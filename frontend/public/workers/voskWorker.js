let recognizer = null;
let transcriptParts = [];
const DEFAULT_VOSK_MODEL_URL = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';

const emit = (payload) => self.postMessage(payload);

const initRecognizer = async (preferredUrl, sampleRate) => {
  const createModel = self.Vosk?.createModel;
  if (!createModel) {
    throw new Error('Vosk createModel is unavailable');
  }

  const urlsToTry = [];
  if (preferredUrl) urlsToTry.push(preferredUrl);
  if (!urlsToTry.includes(DEFAULT_VOSK_MODEL_URL)) {
    urlsToTry.push(DEFAULT_VOSK_MODEL_URL);
  }

  let lastError = null;
  for (const url of urlsToTry) {
    try {
      const model = await createModel(url);
      recognizer = new model.KaldiRecognizer(sampleRate || 16000);
      return url;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to initialize Vosk model');
};

self.onmessage = async (event) => {
  const { type, modelUrl, sampleRate, audio } = event.data || {};

  try {
    if (type === 'init') {
      self.importScripts('https://cdn.jsdelivr.net/npm/vosk-browser@0.0.8/dist/vosk.js');
      transcriptParts = [];
      const selectedUrl = await initRecognizer(modelUrl, sampleRate);

      recognizer.on('result', (result) => {
        const text = String(result?.result?.text || result?.text || '').trim();
        if (!text) return;
        transcriptParts.push(text);
        emit({ type: 'vosk-result', text });
      });

      emit({ type: 'worker-ready', modelUrl: selectedUrl });
      return;
    }

    if (type === 'audio-buffer' && recognizer && audio) {
      recognizer.acceptWaveform(audio);
      return;
    }

    if (type === 'finalize') {
      const finalSegment = recognizer?.finalResult?.();
      const finalChunk = String(finalSegment?.text || finalSegment?.result?.text || '').trim();
      if (finalChunk) {
        transcriptParts.push(finalChunk);
      }
      const finalText = transcriptParts.join(' ').trim();
      emit({ type: 'final-transcript', text: finalText });
      transcriptParts = [];
    }
  } catch (error) {
    emit({ type: 'worker-error', message: error.message || 'Vosk worker error' });
  }
};

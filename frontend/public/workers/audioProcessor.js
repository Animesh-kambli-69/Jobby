// AudioWorklet processor for handling audio stream processing
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input && input.length > 0) {
      const channelData = input[0];

      if (channelData && channelData.length > 0) {
        // Create a copy of the audio data to send to the main thread
        const audioBuffer = new Float32Array(channelData);

        // Post the audio buffer to the main thread
        this.port.postMessage({
          type: 'audio-data',
          audio: audioBuffer
        }, [audioBuffer.buffer]);
      }
    }

    // Return true to keep the processor alive
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);

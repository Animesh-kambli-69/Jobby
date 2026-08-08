let faceLandmarker = null;
let totalFrames = 0;
let centeredFrames = 0;

const emit = (payload) => self.postMessage(payload);

const averagePoint = (points) => {
  if (!points.length) return null;
  const total = points.reduce((acc, point) => {
    acc.x += point.x;
    acc.y += point.y;
    return acc;
  }, { x: 0, y: 0 });
  return {
    x: total.x / points.length,
    y: total.y / points.length
  };
};

const updateEyeContactMetric = (landmarks) => {
  const leftCorner = landmarks[33];
  const rightCorner = landmarks[263];
  const topEyelid = landmarks[159];
  const bottomEyelid = landmarks[145];
  const irisPoints = [468, 469, 470, 471, 472, 473].map((index) => landmarks[index]).filter(Boolean);

  if (!leftCorner || !rightCorner || !topEyelid || !bottomEyelid || irisPoints.length === 0) {
    return;
  }

  const irisCenter = averagePoint(irisPoints);
  const horizontalDenominator = Math.max(0.0001, rightCorner.x - leftCorner.x);
  const verticalDenominator = Math.max(0.0001, bottomEyelid.y - topEyelid.y);

  const horizontalRatio = (irisCenter.x - leftCorner.x) / horizontalDenominator;
  const verticalRatio = (irisCenter.y - topEyelid.y) / verticalDenominator;

  const isCentered = horizontalRatio >= 0.35 && horizontalRatio <= 0.65
    && verticalRatio >= 0.25 && verticalRatio <= 0.75;

  totalFrames += 1;
  if (isCentered) {
    centeredFrames += 1;
  }
};

// Suppress MediaPipe/TensorFlow console warnings
const originalWarn = console.warn;
const originalLog = console.log;
const originalInfo = console.info;
const originalError = console.error;

const shouldSuppressVisionNoise = (msg) =>
  msg.includes('Feedback manager') ||
  msg.includes('XNNPACK') ||
  msg.includes('vision_wasm') ||
  msg.includes('TfLite') ||
  msg.includes('FeedbackManager') ||
  msg.includes('gl_context.cc') ||
  msg.includes('OpenGL') ||
  msg.includes('TensorFlow Lite delegate');

console.warn = (...args) => {
  const msg = String(args[0] || '');
  if (shouldSuppressVisionNoise(msg)) {
    return;
  }
  originalWarn.apply(console, args);
};

console.log = (...args) => {
  const msg = String(args[0] || '');
  if (shouldSuppressVisionNoise(msg) || msg.includes('Created TensorFlow Lite')) {
    return;
  }
  originalLog.apply(console, args);
};

console.info = (...args) => {
  const msg = String(args[0] || '');
  if (shouldSuppressVisionNoise(msg) || msg.includes('Created TensorFlow Lite')) {
    return;
  }
  originalInfo.apply(console, args);
};

console.error = (...args) => {
  const msg = String(args[0] || '');
  if (shouldSuppressVisionNoise(msg)) {
    return;
  }
  originalError.apply(console, args);
};

self.onmessage = async (event) => {
  const { type, frame } = event.data || {};

  try {
    if (type === 'init') {
      const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/vision_bundle.mjs');
      const fileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/wasm'
      );

      faceLandmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          delegate: 'CPU',
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
        },
        runningMode: 'IMAGE',
        numFaces: 1
      });

      emit({ type: 'worker-ready' });
      return;
    }

    if (type === 'face-frame' && faceLandmarker && frame) {
      const result = faceLandmarker.detect(frame);
      frame.close();

      const landmarks = result?.faceLandmarks?.[0];
      if (landmarks) {
        updateEyeContactMetric(landmarks);
      }

      const eyeContactPercentage = totalFrames > 0 ? Math.round((centeredFrames / totalFrames) * 100) : 0;
      emit({ type: 'face-metric', eyeContactPercentage });
      return;
    }

    if (type === 'finalize') {
      const eyeContactPercentage = totalFrames > 0 ? Math.round((centeredFrames / totalFrames) * 100) : 0;
      emit({ type: 'face-metric', eyeContactPercentage });
      totalFrames = 0;
      centeredFrames = 0;
    }
  } catch (error) {
    emit({ type: 'worker-error', message: error.message || 'Face worker error' });
  }
};

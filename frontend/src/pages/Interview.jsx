import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Brain, Mic, MicOff, Send, RotateCcw, CheckCircle,
  AlertCircle, Lightbulb, Target, Clock, Award,
  MessageSquare, User, Sparkles, ArrowRight, Play
} from 'lucide-react';
import {
  getInterviewQuestions as getInterviewQuestionsApi,
  analyzeInterview as analyzeInterviewApi,
  uploadInterviewRecording as uploadInterviewRecordingApi,
  evaluateInterviewPerformance as evaluateInterviewPerformanceApi
} from '../services/interviewService';
import './Interview.css';

function Interview() {
  const { user } = useAuth();
  const [stage, setStage] = useState('setup'); // setup, practicing, feedback
  const [interviewType, setInterviewType] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [questionSet, setQuestionSet] = useState([]);
  const [qaHistory, setQaHistory] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasVoiceAnswer, setHasVoiceAnswer] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordingUploadStatus, setRecordingUploadStatus] = useState('idle');
  const [recordingUploadMessage, setRecordingUploadMessage] = useState('');
  const [reshuffleNotice, setReshuffleNotice] = useState('');
  const [latestAnswerMetrics, setLatestAnswerMetrics] = useState(null);
  const [interviewDurationMs, setInterviewDurationMs] = useState(0);

  const mediaStreamRef = useRef(null);
  const videoElRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const rafIdRef = useRef(null);
  const startedAtRef = useRef(0);
  const transcriptRef = useRef([]);
  const eyeMetricsRef = useRef({ percentage: 0 });
  const speechRecognitionRef = useRef(null);
  const faceWorkerRef = useRef(null);
  const faceReadyRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const uploadPromiseRef = useRef(null);
  const interviewStartedAtRef = useRef(0);
  const mediaOffHandledRef = useRef(false);
  const reshuffleNoticeTimerRef = useRef(null);

  const formatDuration = (durationMs) => {
    const totalSeconds = Math.max(0, durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds - (minutes * 60);
    return `${minutes}m ${seconds.toFixed(1)}s`;
  };

  const showReshuffleNotice = () => {
    setReshuffleNotice('Questions reshuffled due to camera/mic off event.');
    if (reshuffleNoticeTimerRef.current) {
      clearTimeout(reshuffleNoticeTimerRef.current);
    }
    reshuffleNoticeTimerRef.current = setTimeout(() => {
      setReshuffleNotice('');
    }, 2000);
  };

  const shuffleQuestions = (questions) => {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const waitForVideoReady = (videoEl, timeoutMs = 5000) => new Promise((resolve) => {
    if (!videoEl) {
      resolve(false);
      return;
    }

    if (videoEl.readyState >= 2) {
      resolve(true);
      return;
    }

    let settled = false;
    const onReady = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(true);
    };

    const onTimeout = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(videoEl.readyState >= 2);
    };

    const cleanup = () => {
      videoEl.removeEventListener('loadedmetadata', onReady);
      videoEl.removeEventListener('canplay', onReady);
      clearTimeout(timer);
    };

    videoEl.addEventListener('loadedmetadata', onReady, { once: true });
    videoEl.addEventListener('canplay', onReady, { once: true });
    const timer = setTimeout(onTimeout, timeoutMs);
  });

  const safePlayVideo = async (videoEl) => {
    try {
      await videoEl.play();
    } catch (error) {
      // Some browsers can reject play() transiently while stream is warming up.
    }
  };

  const cleanupActiveMedia = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (error) {
        // Ignore cleanup errors when recognition is already stopped.
      }
      speechRecognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];

    if (videoElRef.current && videoElRef.current !== videoPreviewRef.current) {
      videoElRef.current.pause();
      videoElRef.current.srcObject = null;
      videoElRef.current = null;
    } else {
      videoElRef.current = null;
    }

    if (videoPreviewRef.current) {
      videoPreviewRef.current.pause();
      videoPreviewRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    const handlePageExit = () => cleanupActiveMedia();

    window.addEventListener('pagehide', handlePageExit);
    window.addEventListener('beforeunload', handlePageExit);

    return () => {
      window.removeEventListener('pagehide', handlePageExit);
      window.removeEventListener('beforeunload', handlePageExit);

      if (reshuffleNoticeTimerRef.current) {
        clearTimeout(reshuffleNoticeTimerRef.current);
      }

      cleanupActiveMedia();

      if (faceWorkerRef.current) {
        faceWorkerRef.current.terminate();
        faceWorkerRef.current = null;
      }
    };
  }, []);

  const ensureWorkers = () => {
    // Face detection worker only - speech recognition is handled separately
    if (!faceWorkerRef.current) {
      faceWorkerRef.current = new Worker('/workers/faceWorker.js');
      faceWorkerRef.current.onmessage = (event) => {
        const { type, eyeContactPercentage, message } = event.data || {};
        if (type === 'worker-ready') {
          faceReadyRef.current = true;
        }
        if (type === 'face-metric' && typeof eyeContactPercentage === 'number') {
          eyeMetricsRef.current.percentage = eyeContactPercentage;
        }
        if (type === 'worker-error') {
          console.error('Face worker error:', message);
        }
      };
      faceWorkerRef.current.postMessage({ type: 'init' });
    }
  };

  const interviewTypes = [
    { id: 'technical', label: 'Technical', icon: Brain, description: 'Data structures, algorithms, system design' },
    { id: 'behavioral', label: 'Behavioral', icon: User, description: 'STAR method, past experiences' },
    { id: 'mixed', label: 'Mixed', icon: Target, description: 'Both technical and behavioral' },
  ];

  const difficulties = [
    { id: 'beginner', label: 'Entry Level', color: '#10b981' },
    { id: 'intermediate', label: 'Mid Level', color: '#f59e0b' },
    { id: 'senior', label: 'Senior Level', color: '#ef4444' },
  ];

  const startInterview = async () => {
    if (!interviewType) return;

    setLoading(true);
    let questions = [];

    try {
      const response = await getInterviewQuestionsApi({ interviewType, difficulty });
      questions = Array.isArray(response?.questions) ? shuffleQuestions(response.questions) : [];

      if (!questions.length) {
        setRecordingError('Unable to generate interview questions right now. Please try again.');
        return;
      }

      const firstQuestion = questions[0];

      setConversation([
        {
          role: 'interviewer',
          content: `Welcome! I'll be conducting your ${interviewType} interview today. Let's begin.\n\n${firstQuestion}`
        }
      ]);
      setQuestionSet(questions);
      setQaHistory([]);
      setAnalysisHistory([]);
      setCurrentQuestion(0);
      setAnswer('');
      setHasVoiceAnswer(false);
      setRecordingError('');
      setLiveTranscript('');
      setRecordingUploadStatus('idle');
      setRecordingUploadMessage('');
      setLatestAnswerMetrics(null);
      setInterviewDurationMs(0);
      interviewStartedAtRef.current = performance.now();
      setStage('practicing');
    } catch (error) {
      setRecordingError('Unable to generate interview questions right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !hasVoiceAnswer) {
      setRecordingError('Please record your answer with camera and microphone enabled before submitting.');
      return;
    }

    const currentQuestionText = questionSet[currentQuestion] || '';
    const spokenAnswer = answer;
    const newConversation = [
      ...conversation,
      { role: 'candidate', content: answer }
    ];
    setConversation(newConversation);
    setAnswer('');
    setHasVoiceAnswer(false);
    setLiveTranscript('');
    setLoading(true);

    const nextQuestionIndex = currentQuestion + 1;

    try {
      const derivedMetrics = latestAnswerMetrics || {
        transcript: spokenAnswer,
        eyeContactPercentage: 0,
        duration: 1,
        analysis: await processAnalysis({
          transcript: spokenAnswer,
          eye_contact_percentage: 0,
          duration: 1
        })
      };

      const analysis = derivedMetrics.analysis;
      const eyeContact = Number(derivedMetrics.eyeContactPercentage || 0);
      const duration = Number(derivedMetrics.duration || 1);

      const analysisEntry = {
        score: Number(analysis?.score || 0),
        confidence: Number(analysis?.confidence || 0),
        eyeContactPercentage: eyeContact,
        duration
      };

      setAnalysisResult({
        ...analysis,
        eye_contact_percentage: eyeContact,
        duration
      });

      const updatedQa = [
        ...qaHistory,
        {
          question: currentQuestionText,
          answer: spokenAnswer
        }
      ];

      const updatedAnalysisHistory = [...analysisHistory, analysisEntry];
      setQaHistory(updatedQa);
      setAnalysisHistory(updatedAnalysisHistory);
      setLatestAnswerMetrics(null);

      if (nextQuestionIndex < questionSet.length) {
        const aiResponse = {
          role: 'interviewer',
          content: `Good answer. Let me note that down.\n\nNext question: ${questionSet[nextQuestionIndex]}`
        };
        setConversation([...newConversation, aiResponse]);
        setCurrentQuestion(nextQuestionIndex);
      } else {
        setConversation([
          ...newConversation,
          {
            role: 'interviewer',
            content: "That concludes our interview. Thank you for your time! I'll generate your feedback now."
          }
        ]);
        await generateFeedback(updatedQa, updatedAnalysisHistory);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = async (qaPairs = qaHistory, metrics = analysisHistory) => {
    const totalDurationMs = interviewStartedAtRef.current
      ? Math.max(0, performance.now() - interviewStartedAtRef.current)
      : 0;
    setInterviewDurationMs(totalDurationMs);

    try {
      const response = await evaluateInterviewPerformanceApi({
        interviewType,
        difficulty,
        qaPairs,
        metrics,
        totalDurationSeconds: Number((totalDurationMs / 1000).toFixed(2))
      });

      if (response?.success && response?.performance) {
        setFeedback({
          ...response.performance,
          totalInterviewDurationLabel: formatDuration(totalDurationMs)
        });
        setStage('feedback');
        return;
      }
    } catch (error) {
      // Fallback feedback is provided below.
    }

    const avgScore = metrics.length
      ? Math.round(metrics.reduce((sum, item) => sum + Number(item?.score || 0), 0) / metrics.length)
      : 75;

    setFeedback({
      overallScore: avgScore,
      totalInterviewDurationLabel: formatDuration(totalDurationMs),
      strengths: [
        'Maintained consistent communication flow',
        'Attempted clear and structured responses',
        'Stayed engaged throughout interview questions'
      ],
      improvements: [
        'Use more specific project examples from your resume',
        'Explain impact with measurable outcomes',
        'Add deeper technical tradeoff discussion where relevant'
      ],
      tips: [
        'Use STAR format for behavioral responses',
        'Quantify results with numbers when possible',
        'Connect each answer to role requirements'
      ]
    });
    setStage('feedback');
  };

  const startRecording = async () => {
    try {
      setRecordingError('');
      setLiveTranscript('');
      setRecordingUploadStatus('idle');
      setRecordingUploadMessage('');

      // On every mic-on click, reshuffle only upcoming unanswered questions.
      if (currentQuestion < questionSet.length) {
        const nextIndex = currentQuestion;
        const previousCurrentQuestion = questionSet[nextIndex];
        const reshuffledRemaining = shuffleQuestions(questionSet.slice(nextIndex));
        const updatedQuestionSet = [
          ...questionSet.slice(0, nextIndex),
          ...reshuffledRemaining
        ];
        setQuestionSet(updatedQuestionSet);

        const nextCurrentQuestion = updatedQuestionSet[nextIndex];
        if (nextCurrentQuestion && nextCurrentQuestion !== previousCurrentQuestion) {
          setConversation((prev) => ([
            ...prev,
            {
              role: 'interviewer',
              content: `Question reshuffled. Please answer this one:\n\n${nextCurrentQuestion}`
            }
          ]));
        }

        showReshuffleNotice();
      }

      transcriptRef.current = [];
      eyeMetricsRef.current = { percentage: 0 };
      ensureWorkers();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      if (!audioTracks.length || !videoTracks.length) {
        throw new Error('Camera and microphone are both required for AI interview.');
      }

      const audioTrack = audioTracks[0];
      const videoTrack = videoTracks[0];
      audioTrack.enabled = true;
      videoTrack.enabled = true;
      mediaOffHandledRef.current = false;

      const handleMediaTurnedOff = async (sourceLabel) => {
        if (mediaOffHandledRef.current) {
          return;
        }
        mediaOffHandledRef.current = true;

        const nextQuestionIndex = currentQuestion + 1;

        // Stop recorder immediately if still active to avoid stale chunks and UI state.
        try {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        } catch (error) {
          // Ignore stop race conditions.
        }

        cleanupActiveMedia();
        setIsRecording(false);
        setHasVoiceAnswer(false);
        setAnswer('');
        setLiveTranscript('');
        setLatestAnswerMetrics(null);

        if (nextQuestionIndex < questionSet.length) {
          const reshuffledRemaining = shuffleQuestions(questionSet.slice(nextQuestionIndex));
          const updatedQuestionSet = [
            ...questionSet.slice(0, nextQuestionIndex),
            ...reshuffledRemaining
          ];
          const nextQuestionText = updatedQuestionSet[nextQuestionIndex];

          setQuestionSet(updatedQuestionSet);
          showReshuffleNotice();
          setCurrentQuestion(nextQuestionIndex);
          setConversation((prev) => ([
            ...prev,
            {
              role: 'interviewer',
              content: `${sourceLabel} turned off during your answer, so this question was skipped.\n\nNext question: ${nextQuestionText}`
            }
          ]));
          setRecordingError(`${sourceLabel} must remain on. The previous question was skipped automatically.`);
          return;
        }

        setConversation((prev) => ([
          ...prev,
          {
            role: 'interviewer',
            content: `${sourceLabel} turned off on the final question. Interview is now complete and feedback will be generated.`
          }
        ]));
        setRecordingError(`${sourceLabel} turned off. Interview ended and feedback is being generated.`);
        generateFeedback();
      };

      // Browser/device toggles can trigger mute/ended; treat all as mandatory-media violations.
      audioTrack.onended = () => handleMediaTurnedOff('Microphone');
      audioTrack.onmute = () => handleMediaTurnedOff('Microphone');
      videoTrack.onended = () => handleMediaTurnedOff('Camera');
      videoTrack.onmute = () => handleMediaTurnedOff('Camera');

      mediaStreamRef.current = stream;
      startedAtRef.current = Date.now();
      recordedChunksRef.current = [];

      if (window.MediaRecorder) {
        const preferredTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4'
        ];
        const selectedMimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';

        const recorder = selectedMimeType
          ? new MediaRecorder(stream, { mimeType: selectedMimeType })
          : new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      }
      setIsRecording(true);

      // Let React render the preview <video> before attaching the stream.
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // Initialize Web Speech API for transcription
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            transcriptRef.current.push(finalTranscript.trim());
          }

          const fullTranscript = transcriptRef.current.join(' ') + ' ' + interimTranscript;
          setLiveTranscript(fullTranscript.trim());
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            // Restart recognition if no speech detected
            try { recognition.start(); } catch (e) { }
          }
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      } else {
        setRecordingError('Speech recognition is not supported in your browser');
      }

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.muted = true;
        videoPreviewRef.current.playsInline = true;
        await waitForVideoReady(videoPreviewRef.current);
        await safePlayVideo(videoPreviewRef.current);
        videoElRef.current = videoPreviewRef.current;
      } else {
        const fallbackVideo = document.createElement('video');
        fallbackVideo.srcObject = stream;
        fallbackVideo.muted = true;
        fallbackVideo.playsInline = true;
        await waitForVideoReady(fallbackVideo);
        await safePlayVideo(fallbackVideo);
        videoElRef.current = fallbackVideo;
      }

      const processVideoFrame = async () => {
        if (!faceWorkerRef.current || !faceReadyRef.current || !videoElRef.current) {
          rafIdRef.current = requestAnimationFrame(processVideoFrame);
          return;
        }

        try {
          if (videoElRef.current.readyState >= 2) {
            const bitmap = await createImageBitmap(videoElRef.current);
            faceWorkerRef.current.postMessage(
              { type: 'face-frame', frame: bitmap, timestamp: performance.now() },
              [bitmap]
            );
          }
        } catch (error) {
          // Frame drops are tolerated to keep UI responsive.
        }

        rafIdRef.current = requestAnimationFrame(processVideoFrame);
      };

      rafIdRef.current = requestAnimationFrame(processVideoFrame);
    } catch (error) {
      setRecordingError(error.message || 'Unable to start recording');
      setIsRecording(false);
    }
  };

  const processAnalysis = async ({ transcript, eye_contact_percentage, duration }) => {
    try {
      const response = await analyzeInterviewApi({ transcript, eye_contact_percentage, duration });
      if (response?.success && response.analysis) {
        return response.analysis;
      }
    } catch (error) {
      // Fall back to a local approximation so interview flow still works if API is unavailable.
    }

      return {
        score: Math.round(Math.min(100, Math.max(0, eye_contact_percentage))),
        confidence: 0.35,
        eye_contact: eye_contact_percentage >= 60 ? 'Maintained fairly well' : 'Frequent looking away',
        feedback: 'Live AI analysis was unavailable. Continue practicing concise, structured responses.'
      };
  };

  const stopRecording = async () => {
    setIsRecording(false);
    mediaOffHandledRef.current = false;

    let recordedVideoFile = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      recordedVideoFile = await new Promise((resolve) => {
        const recorder = mediaRecorderRef.current;
        recorder.onstop = () => {
          if (!recordedChunksRef.current.length) {
            resolve(null);
            return;
          }

          const blobType = recorder.mimeType || 'video/webm';
          const blob = new Blob(recordedChunksRef.current, { type: blobType });
          const extension = blobType.includes('mp4') ? 'mp4' : 'webm';
          resolve(new File([blob], `interview-${Date.now()}.${extension}`, { type: blobType }));
        };

        recorder.stop();
      });
    }

    cleanupActiveMedia();

    if (faceWorkerRef.current) {
      faceWorkerRef.current.postMessage({ type: 'finalize' });
    }

    const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
    startedAtRef.current = 0;

    const transcript = transcriptRef.current.join(' ').trim() || answer.trim();

    if (!transcript) {
      setRecordingError('No transcript captured. Please speak clearly and try again.');
      return;
    }

    setAnswer(transcript);
    setLiveTranscript(transcript);
    setHasVoiceAnswer(true);
    setRecordingError('');

    // Every mic-off click reshuffles upcoming unanswered questions.
    if (currentQuestion + 1 < questionSet.length) {
      const nextIndex = currentQuestion + 1;
      const reshuffledRemaining = shuffleQuestions(questionSet.slice(nextIndex));
      const updatedQuestionSet = [
        ...questionSet.slice(0, nextIndex),
        ...reshuffledRemaining
      ];
      setQuestionSet(updatedQuestionSet);
      showReshuffleNotice();
    }

    try {
      const eyeContact = Math.round(eyeMetricsRef.current.percentage || 0);
      const analysis = await processAnalysis({
        transcript,
        eye_contact_percentage: eyeContact,
        duration
      });

      setLatestAnswerMetrics({
        transcript,
        eyeContactPercentage: eyeContact,
        duration,
        analysis
      });

      setAnalysisResult({
        ...analysis,
        eye_contact_percentage: eyeContact,
        duration
      });

      if (recordedVideoFile && interviewType) {
        setRecordingUploadStatus('uploading');
        setRecordingUploadMessage('Uploading recording to cloud storage...');
        uploadPromiseRef.current = uploadInterviewRecordingApi({
          videoFile: recordedVideoFile,
          interviewType,
          duration
        }).then(() => {
          setRecordingUploadStatus('success');
          setRecordingUploadMessage('Recording saved to cloud storage.');
        }).catch(() => {
          setRecordingUploadStatus('error');
          setRecordingUploadMessage('Recording upload failed. Please retry this question.');
        });
      }
    } catch (error) {
      setRecordingError('Could not analyze this answer. You can still submit and continue.');
    }
  };

  const resetInterview = () => {
    setStage('setup');
    setInterviewType('');
    setCurrentQuestion(0);
    setAnswer('');
    setConversation([]);
    setFeedback(null);
    setAnalysisResult(null);
    setQuestionSet([]);
    setQaHistory([]);
    setAnalysisHistory([]);
    setLatestAnswerMetrics(null);
    setInterviewDurationMs(0);
    interviewStartedAtRef.current = 0;
    mediaOffHandledRef.current = false;
    setReshuffleNotice('');
    if (reshuffleNoticeTimerRef.current) {
      clearTimeout(reshuffleNoticeTimerRef.current);
    }
    setRecordingUploadStatus('idle');
    setRecordingUploadMessage('');
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
      return;
    }
    await startRecording();
  };

  return (
    <div className="interview-page">
      <div className="container">
        {stage === 'setup' && (
          <div className="setup-stage">
            <div className="setup-header">
              <div className="setup-badge">
                <Brain size={16} />
                <span>AI Interview Simulator</span>
              </div>
              <h1>Practice Makes Perfect</h1>
              <p>Get ready for your next interview with AI-powered mock interviews and personalized feedback</p>
            </div>

            <div className="setup-content">
              <div className="setup-section">
                <h3>Select Interview Type</h3>
                <div className="type-grid">
                  {interviewTypes.map((type) => (
                    <button
                      key={type.id}
                      className={`type-card glass-card ${interviewType === type.id ? 'selected' : ''}`}
                      onClick={() => setInterviewType(type.id)}
                    >
                      <type.icon size={32} />
                      <h4>{type.label}</h4>
                      <p>{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="setup-section">
                <h3>Select Difficulty</h3>
                <div className="difficulty-options">
                  {difficulties.map((diff) => (
                    <button
                      key={diff.id}
                      className={`difficulty-btn ${difficulty === diff.id ? 'selected' : ''}`}
                      onClick={() => setDifficulty(diff.id)}
                      style={{ '--diff-color': diff.color }}
                    >
                      <span className="diff-dot"></span>
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary btn-large start-btn"
                onClick={startInterview}
                disabled={!interviewType || loading}
              >
                <Play size={20} />
                {loading ? 'Preparing Questions...' : 'Start Interview'}
              </button>
            </div>
          </div>
        )}

        {stage === 'practicing' && (
          <div className="practice-stage">
            <div className="practice-header">
              <div className="interview-info">
                <span className="interview-type-badge">
                  <Brain size={16} />
                  {interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview
                </span>
                <span className="question-progress">
                  Question {currentQuestion + 1} of {questionSet.length || 0}
                </span>
              </div>
              <button className="btn btn-secondary" onClick={resetInterview}>
                <RotateCcw size={18} />
                Restart
              </button>
            </div>

            <div className="conversation-area glass-card">
              {conversation.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'interviewer' ? <Brain size={20} /> : <User size={20} />}
                  </div>
                  <div className="message-content">
                    <span className="message-role">
                      {msg.role === 'interviewer' ? 'AI Interviewer' : 'You'}
                    </span>
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message interviewer">
                  <div className="message-avatar">
                    <Brain size={20} />
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="answer-area glass-card">
              {recordingError && (
                <p className="error-text" role="alert">{recordingError}</p>
              )}

              {/* Camera Preview */}
              {isRecording && (
                <div className="camera-preview">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="video-preview"
                  />
                  <div className="recording-indicator">
                    <span className="recording-dot"></span>
                    Recording...
                  </div>
                </div>
              )}

              <p className="recording-hint">
                Camera and microphone are required. Record your answer, then submit.
              </p>
              {reshuffleNotice && (
                <p className="recording-upload-status uploading" role="status" aria-live="polite">
                  {reshuffleNotice}
                </p>
              )}
              {recordingUploadStatus !== 'idle' && (
                <p
                  className={`recording-upload-status ${recordingUploadStatus}`}
                  role="status"
                  aria-live="polite"
                >
                  {recordingUploadMessage}
                </p>
              )}
              {isRecording && liveTranscript && (
                <p className="live-transcript" aria-live="polite">
                  <strong>Live transcript:</strong> {liveTranscript}
                </p>
              )}
              <textarea
                value={answer}
                readOnly
                placeholder="Your spoken answer will appear here after recording..."
                rows={4}
              />
              <div className="answer-actions">
                <button
                  className={`mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={toggleRecording}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={submitAnswer}
                  disabled={!hasVoiceAnswer || loading || isRecording}
                  title={!hasVoiceAnswer ? 'Record your answer first' : ''}
                >
                  <Send size={18} />
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === 'feedback' && feedback && (
          <div className="feedback-stage">
            <div className="feedback-header">
              <CheckCircle size={48} className="success-icon" />
              <h1>Interview Complete!</h1>
              <p>Here's your personalized feedback</p>
            </div>

            <div className="feedback-content">
              <div className="score-card glass-card">
                <div className="score-circle">
                  <span className="score-value">{feedback.overallScore}</span>
                  <span className="score-label">Overall Score</span>
                </div>
                <p className="score-meta">Total Interview Duration: {feedback.totalInterviewDurationLabel || formatDuration(interviewDurationMs)}</p>
                <div className="score-breakdown">
                  <div className="score-item">
                    <Award size={20} />
                    <span>Communication</span>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  <div className="score-item">
                    <Brain size={20} />
                    <span>Technical</span>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="score-item">
                    <Target size={20} />
                    <span>Problem Solving</span>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {analysisResult && (
                <div className="analysis-metrics glass-card">
                  <div className="analysis-metric-item">
                    <Award size={18} />
                    <span>Confidence: {(analysisResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="analysis-metric-item">
                    <Target size={18} />
                    <span>Eye Contact: {analysisResult.eye_contact_percentage}%</span>
                  </div>
                  <div className="analysis-metric-item">
                    <Clock size={18} />
                    <span>Duration: {analysisResult.duration}s</span>
                  </div>
                  <div className="analysis-metric-item">
                    <Clock size={18} />
                    <span>Total Interview: {formatDuration(interviewDurationMs)}</span>
                  </div>
                </div>
              )}

              <div className="feedback-grid">
                <div className="feedback-card glass-card strengths">
                  <h3><CheckCircle size={20} /> Strengths</h3>
                  <ul>
                    {feedback.strengths.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="feedback-card glass-card improvements">
                  <h3><AlertCircle size={20} /> Areas to Improve</h3>
                  <ul>
                    {feedback.improvements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="feedback-card glass-card tips">
                  <h3><Lightbulb size={20} /> Pro Tips</h3>
                  <ul>
                    {feedback.tips.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="feedback-actions">
                <button className="btn btn-primary" onClick={resetInterview}>
                  <RotateCcw size={18} />
                  Practice Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Interview;

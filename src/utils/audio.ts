import { AudioConfig } from '../types/audio';

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  channelCount: 1,
  sampleRate: { ideal: 16000 },
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
};

export const AUDIO_PROCESSING_CONFIG = {
  minChunkSize: 1000,
  processingInterval: 500,       // Increased to reduce processing frequency
  silenceThreshold: 10,         // Increased for better silence detection
  silenceDuration: 800,         // Increased to allow for natural pauses
  chunkCollectionInterval: 200,  // Increased for more stable chunks
  minChunksBeforeProcessing: 3,  // Increased for better context
  maxAudioLevel: 100
};

export function setupAudioContext(stream: MediaStream): {
  audioContext: AudioContext;
  analyser: AnalyserNode;
  scriptProcessor: ScriptProcessorNode;
} {
  const audioContext = new AudioContext({
    sampleRate: 16000,
    latencyHint: 'interactive'
  });
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  
  // Optimized analyzer settings
  analyser.fftSize = 512;  // Increased for better frequency resolution
  analyser.smoothingTimeConstant = 0.5;  // Increased for smoother transitions
  analyser.minDecibels = -85;  // Adjusted for better dynamic range
  analyser.maxDecibels = -10;

  // Improved script processor for volume monitoring
  const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
  source.connect(analyser);
  analyser.connect(scriptProcessor);
  scriptProcessor.connect(audioContext.destination);

  return { audioContext, analyser, scriptProcessor };
}

export function getAudioLevel(analyser: AnalyserNode): number {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  
  // Improved RMS calculation with frequency weighting
  let weightedSum = 0;
  let weightSum = 0;
  
  for (let i = 0; i < bufferLength; i++) {
    // Apply frequency weighting (emphasize speech frequencies)
    const weight = i < bufferLength / 4 ? 2.0 : 1.0;
    weightedSum += (dataArray[i] * dataArray[i]) * weight;
    weightSum += weight;
  }
  
  const rms = Math.sqrt(weightedSum / weightSum);
  
  // Improved normalization with dynamic range compression
  const db = 20 * Math.log10(rms / 128);
  const normalized = Math.max(0, Math.min(100, (db + 85) * (100 / 75)));
  
  // Apply smoothing
  return Math.round(normalized);
}

export function isSilent(audioLevel: number): boolean {
  return audioLevel <= AUDIO_PROCESSING_CONFIG.silenceThreshold;
}

export function getSupportedMimeType(): string {
  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ];
  
  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  throw new Error('No supported audio format found');
}

export function createAudioBlob(chunks: Blob[], mimeType: string): Blob {
  // Ensure we have valid chunks
  const validChunks = chunks.filter(chunk => chunk.size > 0);
  if (validChunks.length === 0) {
    throw new Error('No valid audio chunks to process');
  }
  return new Blob(validChunks, { type: mimeType });
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        return 'Please allow microphone access when prompted by your browser.';
      case 'NotFoundError':
        return 'Could not detect a microphone on your device.';
      case 'NotReadableError':
        return 'Your microphone is busy or unavailable.';
      case 'SecurityError':
        return 'Media access is not allowed in this context.';
      default:
        return `Microphone error: ${error.message}`;
    }
  }
  return error instanceof Error ? error.message : 'Failed to start recording';
}

export function isQuestion(text: string): boolean {
  const questionPatterns = [
    /\?$/,  // Ends with question mark
    /^(what|how|why|when|where|who|which|whose|whom|can|could|should|would|will|do|does|did|is|are|am|was|were|has|have|had)/i,  // Starts with question word
    /^(tell me|describe|explain|share|elaborate)/i  // Implicit questions
  ];
  
  const cleanText = text.trim();
  return questionPatterns.some(pattern => pattern.test(cleanText));
}

// Debug helper with structured logging
export function logAudioData(label: string, data: any) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    label,
    ...data,
    audioLevel: data.audioLevel !== undefined ? Math.round(data.audioLevel) : undefined
  };
  
  console.log(`[Audio Debug] ${label}:`, logData);
}

// Improved audio change detection with hysteresis
export function hasSignificantAudioChange(
  prevLevel: number,
  currentLevel: number,
  threshold: number = 15,  // Increased threshold
  hysteresis: number = 5   // Added hysteresis
): boolean {
  const difference = Math.abs(currentLevel - prevLevel);
  return difference > threshold + hysteresis || 
         (difference > threshold - hysteresis && currentLevel > prevLevel);
}

// Improved processing timing check
export function shouldProcessAudio(
  lastProcessedTime: number,
  currentTime: number = Date.now(),
  minInterval: number = AUDIO_PROCESSING_CONFIG.processingInterval
): boolean {
  const timeSinceLastProcess = currentTime - lastProcessedTime;
  return timeSinceLastProcess >= minInterval;
}

// New helper to detect end of speech
export function isEndOfSpeech(
  silenceDuration: number,
  audioLevel: number,
  recentLevels: number[]
): boolean {
  const isCurrentlySilent = isSilent(audioLevel);
  const wasRecentlyActive = recentLevels.some(level => !isSilent(level));
  const longEnoughSilence = silenceDuration >= AUDIO_PROCESSING_CONFIG.silenceDuration;
  
  return isCurrentlySilent && wasRecentlyActive && longEnoughSilence;
}

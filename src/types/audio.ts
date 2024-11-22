export interface AudioProcessingResult {
  transcription: string;
  response: string;
}

export interface AudioConfig {
  channelCount: number;
  sampleRate: { ideal: number };
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface AudioState {
  isRecording: boolean;
  isProcessing: boolean;
  transcription: string;
  response: string;
}

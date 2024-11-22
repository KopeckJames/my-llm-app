import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from '../components/ui/use-toast';
import { audioService } from '../services/audio';
import { AudioState } from '../types/audio';
import {
  DEFAULT_AUDIO_CONFIG,
  AUDIO_PROCESSING_CONFIG,
  setupAudioContext,
  getAudioLevel,
  getSupportedMimeType,
  createAudioBlob,
  formatErrorMessage,
  isSilent,
  isEndOfSpeech,
  logAudioData
} from '../utils/audio';

export function useAudioRecording(): {
  state: AudioState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
} {
  const [state, setState] = useState<AudioState>({
    isRecording: false,
    isProcessing: false,
    transcription: '',
    response: ''
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isCleaningUpRef = useRef<boolean>(false);
  const recentLevelsRef = useRef<number[]>([]);
  const lastProcessTimeRef = useRef<number>(0);

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));

      logAudioData('Processing audio chunk', {
        size: audioBlob.size,
        type: audioBlob.type,
        timeSinceLastProcess: Date.now() - lastProcessTimeRef.current
      });

      const result = await audioService.analyzeAudio(audioBlob);
      if (result?.transcription) {
        setState(prev => ({
          ...prev,
          transcription: result.transcription,
          response: result.response || prev.response
        }));
      }

      lastProcessTimeRef.current = Date.now();
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process audio",
        variant: "destructive"
      });
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, []);

  const monitorAudio = useCallback(() => {
    if (!state.isRecording || !analyserRef.current || isCleaningUpRef.current) return;

    const audioLevel = getAudioLevel(analyserRef.current);
    const currentTime = Date.now();

    // Update recent levels
    recentLevelsRef.current.push(audioLevel);
    if (recentLevelsRef.current.length > 10) {
      recentLevelsRef.current.shift();
    }

    // Update audio service with current level
    audioService.updateAudioLevel(audioLevel);

    // Check for end of speech
    if (isSilent(audioLevel)) {
      if (silenceStartRef.current === null) {
        silenceStartRef.current = currentTime;
      } else {
        const silenceDuration = currentTime - silenceStartRef.current;
        
        if (isEndOfSpeech(silenceDuration, audioLevel, recentLevelsRef.current)) {
          // Process audio after detecting end of speech
          if (chunksRef.current.length >= AUDIO_PROCESSING_CONFIG.minChunksBeforeProcessing) {
            logAudioData('End of speech detected', {
              silenceDuration,
              audioLevel,
              recentLevels: recentLevelsRef.current
            });

            const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm;codecs=opus';
            const audioBlob = createAudioBlob(chunksRef.current, mimeType);
            processAudioChunk(audioBlob).catch(console.error);
            chunksRef.current = []; // Clear processed chunks
          }
          silenceStartRef.current = null; // Reset silence detection
        }
      }
    } else {
      silenceStartRef.current = null; // Reset silence detection if sound detected
    }

    // Continue monitoring
    if (!isCleaningUpRef.current) {
      animationFrameRef.current = requestAnimationFrame(monitorAudio);
    }
  }, [state.isRecording, processAudioChunk]);

  const cleanup = useCallback(() => {
    logAudioData('Starting cleanup', {
      isRecording: state.isRecording,
      hasMediaRecorder: Boolean(mediaRecorderRef.current)
    });

    isCleaningUpRef.current = true;

    // Cancel animation frame first
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media recorder and tracks
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Error stopping media recorder:', error);
      }
    }

    // Close audio context if it's not already closed
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }

    audioContextRef.current = null;
    analyserRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    silenceStartRef.current = null;
    recentLevelsRef.current = [];
    lastProcessTimeRef.current = 0;

    isCleaningUpRef.current = false;

    logAudioData('Cleanup completed', {});
  }, [state.isRecording]);

  const startRecording = useCallback(async () => {
    try {
      // Reset state
      cleanup();
      audioService.resetContext();
      setState(prev => ({ 
        ...prev, 
        transcription: '', 
        response: '' 
      }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: DEFAULT_AUDIO_CONFIG
      });

      // Setup audio context and analyzer
      const { audioContext, analyser } = setupAudioContext(stream);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const mimeType = getSupportedMimeType();
      logAudioData('Starting recording', { mimeType });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 16000
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(AUDIO_PROCESSING_CONFIG.chunkCollectionInterval);
      setState(prev => ({ ...prev, isRecording: true }));
      animationFrameRef.current = requestAnimationFrame(monitorAudio);

      toast({
        title: "Listening Started",
        description: "Speak naturally. I'll transcribe after detecting silence.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      cleanup();
      toast({
        title: "Error",
        description: formatErrorMessage(error),
        variant: "destructive"
      });
    }
  }, [monitorAudio, cleanup]);

  const stopRecording = useCallback(() => {
    if (!isCleaningUpRef.current && mediaRecorderRef.current && state.isRecording) {
      logAudioData('Stopping recording', {
        pendingChunks: chunksRef.current.length
      });

      setState(prev => ({ ...prev, isRecording: false }));
      
      // Process any remaining audio before cleanup
      if (chunksRef.current.length > 0) {
        const mimeType = mediaRecorderRef.current.mimeType;
        const audioBlob = createAudioBlob(chunksRef.current, mimeType);
        processAudioChunk(audioBlob).catch(console.error);
      }

      cleanup();
      
      toast({
        title: "Listening Stopped",
        description: "Processing final audio...",
      });
    }
  }, [state.isRecording, processAudioChunk, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    state,
    startRecording,
    stopRecording
  };
}

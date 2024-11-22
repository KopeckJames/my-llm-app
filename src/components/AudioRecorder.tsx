"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from './ui/use-toast';
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
  logAudioData
} from '../utils/audio';

export function AudioRecorder() {
  const [state, setState] = useState<AudioState>({
    isRecording: false,
    isProcessing: false,
    transcription: '',
    response: ''
  });
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isCleaningUpRef = useRef<boolean>(false);
  const lastProcessedTimeRef = useRef<number>(0);

  const updateState = useCallback((updates: Partial<AudioState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      logAudioData('State updated', newState);
      return newState;
    });
  }, []);

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    const currentTime = Date.now();
    if (currentTime - lastProcessedTimeRef.current < AUDIO_PROCESSING_CONFIG.processingInterval) {
      return;
    }

    try {
      updateState({ isProcessing: true });
      lastProcessedTimeRef.current = currentTime;

      logAudioData('Processing chunk', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      const result = await audioService.analyzeAudio(audioBlob);
      logAudioData('Analysis result', result);

      if (result?.transcription) {
        updateState({
          transcription: result.transcription,
          response: result.response || state.response
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      updateState({ isProcessing: false });
    }
  }, [state.response, updateState]);

  const monitorAudio = useCallback(() => {
    if (!state.isRecording || !analyserRef.current || isCleaningUpRef.current) return;

    const currentLevel = getAudioLevel(analyserRef.current);
    setAudioLevel(currentLevel);

    const currentTime = Date.now();
    const shouldProcess = currentTime - lastProcessedTimeRef.current >= AUDIO_PROCESSING_CONFIG.processingInterval;

    logAudioData('Audio monitoring', {
      level: currentLevel,
      isSilent: isSilent(currentLevel),
      shouldProcess
    });

    // Process audio in two cases:
    // 1. When silence is detected after speech
    // 2. When enough time has passed since last processing
    if (isSilent(currentLevel)) {
      if (silenceStartRef.current === null) {
        silenceStartRef.current = currentTime;
      } else if (currentTime - silenceStartRef.current >= AUDIO_PROCESSING_CONFIG.silenceDuration) {
        if (chunksRef.current.length >= AUDIO_PROCESSING_CONFIG.minChunksBeforeProcessing) {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm;codecs=opus';
          const audioBlob = createAudioBlob(chunksRef.current, mimeType);
          processAudioChunk(audioBlob).catch(console.error);
          chunksRef.current = [];
        }
        silenceStartRef.current = null;
      }
    } else {
      silenceStartRef.current = null;
      // Process periodically even without silence
      if (shouldProcess && chunksRef.current.length >= AUDIO_PROCESSING_CONFIG.minChunksBeforeProcessing) {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm;codecs=opus';
        const audioBlob = createAudioBlob(chunksRef.current, mimeType);
        processAudioChunk(audioBlob).catch(console.error);
        chunksRef.current = [];
      }
    }

    // Continue monitoring
    if (!isCleaningUpRef.current) {
      animationFrameRef.current = requestAnimationFrame(monitorAudio);
    }
  }, [state.isRecording, processAudioChunk]);

  const cleanup = useCallback(() => {
    isCleaningUpRef.current = true;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }

    audioContextRef.current = null;
    analyserRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    silenceStartRef.current = null;
    setAudioLevel(0);

    isCleaningUpRef.current = false;
    logAudioData('Cleanup completed', {});
  }, []);

  const startRecording = useCallback(async () => {
    try {
      cleanup();
      audioService.resetContext();
      updateState({ 
        transcription: '', 
        response: '' 
      });
      lastProcessedTimeRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: DEFAULT_AUDIO_CONFIG
      });

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
          logAudioData('Audio data received', { size: e.data.size });
        }
      };

      mediaRecorder.start(AUDIO_PROCESSING_CONFIG.chunkCollectionInterval);
      updateState({ isRecording: true });
      animationFrameRef.current = requestAnimationFrame(monitorAudio);

      toast({
        title: "Listening Started",
        description: "Speak naturally. I'll transcribe as you speak.",
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
  }, [monitorAudio, cleanup, updateState]);

  const stopRecording = useCallback(() => {
    if (!isCleaningUpRef.current && mediaRecorderRef.current && state.isRecording) {
      updateState({ isRecording: false });
      
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
  }, [state.isRecording, processAudioChunk, cleanup, updateState]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-4">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Interview Question Assistant</h2>
          <p className="text-sm text-muted-foreground">
            Click Start to begin listening. I'll transcribe as you speak.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={state.isRecording ? stopRecording : startRecording}
              variant={state.isRecording ? "destructive" : "default"}
              disabled={state.isProcessing}
            >
              {state.isRecording ? "Stop Listening" : "Start Listening"}
            </Button>
          </div>
          
          {state.isRecording && (
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${Math.min(100, audioLevel)}%` }}
              />
            </div>
          )}
          
          {state.transcription && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Question:</h3>
              <p className="text-sm">{state.transcription}</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Suggested Response</h2>
          {state.isProcessing && (
            <p className="text-sm text-muted-foreground">
              Processing speech...
            </p>
          )}
          {state.response && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="text-sm space-y-2 whitespace-pre-wrap">
                {state.response}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

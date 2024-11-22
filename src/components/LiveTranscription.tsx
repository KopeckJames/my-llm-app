"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "./ui/use-toast";
import { DocumentSelect } from "./DocumentSelect";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function LiveTranscription() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionComplete, setTranscriptionComplete] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState("");
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedResume, setSelectedResume] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<string>("");

  const recognitionRef = useRef<any>(null);
  const transcriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const responseStreamRef = useRef<AbortController | null>(null);

  // Function to process transcription with streaming LLM
  const processTranscription = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    if (!selectedResume || !selectedJob) {
      toast({
        title: "Missing Documents",
        description: "Please select both a resume and job description",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      setResponse(""); // Clear previous response

      // Cancel any existing stream
      if (responseStreamRef.current) {
        responseStreamRef.current.abort();
      }

      // Create new abort controller for this stream
      responseStreamRef.current = new AbortController();
      
      const formData = new FormData();
      formData.append('lastTranscription', text);
      formData.append('resumeId', selectedResume);
      formData.append('jobId', selectedJob);
      
      const response = await fetch('/api/analysis/audio', {
        method: 'POST',
        body: formData,
        signal: responseStreamRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Failed to process transcription');
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode and process the chunk
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  setResponse(data.text);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Stream aborted');
        } else {
          throw error;
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error processing transcription:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process transcription",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      responseStreamRef.current = null;
    }
  };

  const startTranscription = () => {
    if (!selectedResume || !selectedJob) {
      toast({
        title: "Missing Documents",
        description: "Please select both a resume and job description before starting",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsTranscribing(true);
      setTranscriptionComplete(false);
      setTranscriptionText("");
      setResponse("");

      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(' ');

        setTranscriptionText(transcript);

        // Clear existing timeout
        if (transcriptionTimeoutRef.current) {
          clearTimeout(transcriptionTimeoutRef.current);
        }

        // Set new timeout to process after speech pause
        transcriptionTimeoutRef.current = setTimeout(() => {
          processTranscription(transcript);
        }, 1000);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access to use transcription.",
            variant: "destructive"
          });
          stopTranscription();
        }
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting transcription:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start transcription",
        variant: "destructive"
      });
    }
  };

  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsTranscribing(false);
      setTranscriptionComplete(true);

      // Process final transcription
      if (transcriptionText) {
        processTranscription(transcriptionText);
      }
    }
  };

  const handleToggleTranscription = () => {
    if (!isTranscribing) {
      startTranscription();
    } else {
      stopTranscription();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
      }
      if (responseStreamRef.current) {
        responseStreamRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Document Selection */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Interview Documents</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <DocumentSelect 
            type="resume" 
            onSelect={setSelectedResume} 
          />
          <DocumentSelect 
            type="jobDescription" 
            onSelect={setSelectedJob} 
          />
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {/* Transcription Box */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              <div className="flex justify-between items-center">
                <span>Your Speech</span>
                {isTranscribing && (
                  <div className="rounded-full w-3 h-3 bg-red-400 animate-pulse" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transcriptionText ? (
              <p className="whitespace-pre-wrap">{transcriptionText}</p>
            ) : (
              <p className="text-muted-foreground italic">
                {isTranscribing ? "Speak now..." : "Click the microphone to start"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Response Box */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>AI Coach Response</CardTitle>
          </CardHeader>
          <CardContent>
            {isProcessing && !response && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Thinking...</p>
              </div>
            )}
            {response && (
              <p className="whitespace-pre-wrap">{response}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Microphone Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleToggleTranscription}
          className={`flex items-center justify-center rounded-full w-20 h-20 focus:outline-none transition-colors ${
            isTranscribing 
              ? "bg-red-400 hover:bg-red-500" 
              : "bg-blue-400 hover:bg-blue-500"
          }`}
          disabled={isProcessing}
        >
          {isTranscribing ? (
            <svg
              className="h-12 w-12"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fill="white" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 256 256"
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12 text-white"
            >
              <path
                fill="currentColor"
                d="M128 176a48.05 48.05 0 0 0 48-48V64a48 48 0 0 0-96 0v64a48.05 48.05 0 0 0 48 48ZM96 64a32 32 0 0 1 64 0v64a32 32 0 0 1-64 0Zm40 143.6V232a8 8 0 0 1-16 0v-24.4A80.11 80.11 0 0 1 48 128a8 8 0 0 1 16 0a64 64 0 0 0 128 0a8 8 0 0 1 16 0a80.11 80.11 0 0 1-72 79.6Z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

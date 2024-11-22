import { callLLM } from './llm';
import type { Message, LLMConfig } from '../types/llm';
import { isQuestion, logAudioData } from '../utils/audio';

export class AudioService {
  private config: LLMConfig = {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000
  };

  private lastTranscription: string = '';
  private transcriptionBuffer: string[] = [];
  private isProcessing: boolean = false;
  private pendingChunks: Blob[] = [];
  private processingTimeout: NodeJS.Timeout | null = null;
  private lastQuestionProcessed: string = '';
  private lastProcessTime: number = 0;
  private recentAudioLevels: number[] = [];
  private transcriptionHistory: Set<string> = new Set();

  async analyzeAudio(audioBlob: Blob): Promise<{
    transcription: string;
    response: string;
  }> {
    try {
      // Add chunk to pending chunks
      this.pendingChunks.push(audioBlob);

      // If already processing, return current state
      if (this.isProcessing) {
        logAudioData('Skipping processing - already in progress', {
          pendingChunks: this.pendingChunks.length,
          lastTranscription: this.lastTranscription
        });
        return {
          transcription: this.lastTranscription,
          response: ''
        };
      }

      this.isProcessing = true;
      const currentTime = Date.now();

      // Ensure minimum time between processing
      if (currentTime - this.lastProcessTime < 500) {
        logAudioData('Processing too frequent, skipping', {
          timeSinceLastProcess: currentTime - this.lastProcessTime
        });
        return {
          transcription: this.lastTranscription,
          response: ''
        };
      }

      // Combine all pending chunks
      const combinedBlob = new Blob(this.pendingChunks, { type: audioBlob.type });
      this.pendingChunks = []; // Clear pending chunks

      const formData = new FormData();
      formData.append('audio', combinedBlob);
      formData.append('lastTranscription', this.lastTranscription);

      logAudioData('Sending audio for analysis', {
        size: combinedBlob.size,
        type: combinedBlob.type,
        lastTranscription: this.lastTranscription
      });

      const response = await fetch('/api/analysis/audio', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      logAudioData('Received API response', result);

      if (result.error) {
        console.error('API error:', result.error);
        return {
          transcription: this.lastTranscription,
          response: ''
        };
      }
      
      if (result.transcription) {
        // Update transcription buffer and context
        const newText = result.transcription.trim();
        if (newText && !this.transcriptionHistory.has(newText)) {
          logAudioData('New transcription detected', {
            new: newText,
            previous: this.lastTranscription
          });

          this.transcriptionHistory.add(newText);
          
          // Smart transcription combination
          const words = newText.split(' ');
          const lastWords = this.lastTranscription.split(' ');
          const overlap = this.findOverlap(lastWords, words);
          
          if (overlap > 0) {
            // Remove overlapping words from new text
            const uniqueWords = words.slice(overlap);
            if (uniqueWords.length > 0) {
              this.transcriptionBuffer.push(uniqueWords.join(' '));
            }
          } else {
            this.transcriptionBuffer.push(newText);
          }
          
          // Keep only recent context
          if (this.transcriptionBuffer.length > 3) {
            this.transcriptionBuffer.shift();
          }
          
          // Update last transcription
          this.lastTranscription = this.transcriptionBuffer.join(' ');

          // Check if we have a new question to process
          if (this.shouldProcessNewQuestion(this.lastTranscription)) {
            // Clear any pending timeout
            if (this.processingTimeout) {
              clearTimeout(this.processingTimeout);
            }

            logAudioData('Processing new question', {
              question: this.lastTranscription
            });

            const questionResponse = await this.processQuestion(this.lastTranscription);
            return {
              transcription: this.lastTranscription,
              response: questionResponse
            };
          }
        } else {
          logAudioData('Duplicate or empty transcription, skipping', {
            text: newText
          });
        }

        return {
          transcription: this.lastTranscription,
          response: result.response || ''
        };
      }

      return {
        transcription: this.lastTranscription,
        response: ''
      };
    } catch (error) {
      console.error('Error in audio analysis:', error);
      return {
        transcription: this.lastTranscription,
        response: ''
      };
    } finally {
      this.isProcessing = false;
      this.lastProcessTime = Date.now();
    }
  }

  private findOverlap(prev: string[], current: string[]): number {
    let maxOverlap = 0;
    const minLength = Math.min(prev.length, current.length);
    
    for (let i = 1; i <= minLength; i++) {
      const prevSlice = prev.slice(-i).join(' ');
      const currentSlice = current.slice(0, i).join(' ');
      
      if (prevSlice === currentSlice) {
        maxOverlap = i;
      }
    }
    
    return maxOverlap;
  }

  private shouldProcessNewQuestion(transcription: string): boolean {
    // Don't process if it's the same as the last question
    if (transcription === this.lastQuestionProcessed) {
      return false;
    }

    // Check if it's a complete sentence
    const isComplete = /[.!?]$/.test(transcription.trim());

    // Check if it's a question and different from last processed
    if (isQuestion(transcription) && isComplete) {
      logAudioData('New question detected', {
        question: transcription,
        lastProcessed: this.lastQuestionProcessed
      });
      this.lastQuestionProcessed = transcription;
      return true;
    }

    return false;
  }

  private async processQuestion(question: string): Promise<string> {
    try {
      logAudioData('Processing question', { question });
      
      const formData = new FormData();
      formData.append('lastTranscription', question);
      
      const response = await fetch('/api/analysis/audio', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      logAudioData('Question processing result', result);

      if (result.response) {
        return result.response;
      }
    } catch (error) {
      console.error('Error processing question:', error);
    }
    return '';
  }

  resetContext() {
    logAudioData('Resetting audio service context', {
      hadPreviousTranscription: Boolean(this.lastTranscription)
    });
    
    this.lastTranscription = '';
    this.transcriptionBuffer = [];
    this.isProcessing = false;
    this.pendingChunks = [];
    this.lastQuestionProcessed = '';
    this.lastProcessTime = 0;
    this.recentAudioLevels = [];
    this.transcriptionHistory.clear();
    
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
  }

  getCurrentTranscription(): string {
    return this.lastTranscription;
  }

  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  updateAudioLevel(level: number) {
    this.recentAudioLevels.push(level);
    if (this.recentAudioLevels.length > 10) {
      this.recentAudioLevels.shift();
    }
  }
}

// Create and export a singleton instance
export const audioService = new AudioService();

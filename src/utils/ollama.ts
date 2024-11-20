export interface OllamaModelInfo {
    name: string;
    size: number;
    digest: string;
    modified_at: string;
  }
  
  export interface OllamaStatus {
    isRunning: boolean;
    version?: string;
    error?: string;
  }
  
  export async function checkOllamaStatus(): Promise<OllamaStatus> {
    try {
      const response = await fetch('http://localhost:11434/api/version');
      if (!response.ok) {
        return { isRunning: false, error: 'Ollama server not responding' };
      }
      const data = await response.json();
      return { isRunning: true, version: data.version };
    } catch (error) {
      return { isRunning: false, error: 'Unable to connect to Ollama' };
    }
  }
  
  export async function getInstalledModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch installed models');
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching installed models:', error);
      return [];
    }
  }
  
  export async function checkModelAvailability(modelName: string): Promise<boolean> {
    const models = await getInstalledModels();
    return models.some(model => model.name === modelName);
  }
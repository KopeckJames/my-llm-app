"use client";

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { checkOllamaStatus, getInstalledModels, OllamaModelInfo } from '@/utils/ollama';

export function OllamaStatus() {
  const [status, setStatus] = React.useState<{ isRunning: boolean; version?: string; error?: string }>({ isRunning: false });
  const [models, setModels] = React.useState<OllamaModelInfo[]>([]);
  const [isChecking, setIsChecking] = React.useState(true);

  const checkStatus = React.useCallback(async () => {
    setIsChecking(true);
    try {
      const ollamaStatus = await checkOllamaStatus();
      setStatus(ollamaStatus);
      if (ollamaStatus.isRunning) {
        const installedModels = await getInstalledModels();
        setModels(installedModels);
      }
    } catch (error) {
      setStatus({ isRunning: false, error: 'Failed to check Ollama status' });
    }
    setIsChecking(false);
  }, []);

  React.useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  if (isChecking) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Checking Ollama Status</AlertTitle>
        <AlertDescription>
          Please wait while we check the Ollama server status...
        </AlertDescription>
      </Alert>
    );
  }

  if (!status.isRunning) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ollama Not Running</AlertTitle>
        <AlertDescription>
          {status.error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkStatus}
            className="mt-2"
          >
            Retry Connection
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="default">
      <CheckCircle2 className="h-4 w-4 text-green-500" />
      <AlertTitle>Ollama Connected</AlertTitle>
      <AlertDescription>
        <div>Version: {status.version}</div>
        <div className="mt-2">
          <strong>Installed Models:</strong>
          <ul className="list-disc list-inside mt-1">
            {models.map((model) => (
              <li key={model.name} className="text-sm">
                {model.name}
              </li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}
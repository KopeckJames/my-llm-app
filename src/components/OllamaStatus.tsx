"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export function OllamaStatus() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        setIsAvailable(response.ok);
      } catch (error) {
        setIsAvailable(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      {isAvailable ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-green-500">Ollama server is running</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-500">Ollama server is not running</span>
        </>
      )}
    </div>
  );
}

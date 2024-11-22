interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

export async function checkModelAvailability(model: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:11434/api/show`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: model }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return !!data.name;
  } catch (error) {
    return false;
  }
}

export async function getInstalledModels(): Promise<OllamaModel[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    return [];
  }
}

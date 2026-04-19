import { GoogleGenAI } from "@google/genai";

export const generatePlantInfo = async (plantName: string, apiKey: string) => {
  if (!apiKey) throw new Error("API Key required");
  
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Provide pruning instructions for "${plantName}".
    Return a JSON object with the following structure:
    {
      "careInstructions": "Detailed pruning instructions, tools needed, and aftercare in Markdown format.",
      "tasks": [
        {
          "name": "Short task name (e.g., 'Winter Hard Prune', 'Summer Deadheading')",
          "type": "once" (if the task is performed once in a year/season range) OR "recurring" (if it happens repeatedly across the months),
          "months": [0, 1, ... 11] (Array of 0-based month indices representing the target range)
        }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  if (!response.text) throw new Error("No response text from Gemini");
  return JSON.parse(response.text);
};

export const generatePlantImage = async (plantName: string, apiKey: string) => {
  if (!apiKey) throw new Error("API Key required");

  const ai = new GoogleGenAI({ apiKey });
  
  // Using Imagen-4 as per PRD (simulated via gemini-2.5-flash-image or similar if imagen-4 not avail in this env, 
  // but PRD says Imagen-4. I will use the recommended model for image generation from system instructions).
  // System instruction says: "Generate images using gemini-2.5-flash-image by default; switch to Imagen models... only if the user explicitly requests them."
  // PRD explicitly requests "Imagen-4".
  
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `Botanical close-up of ${plantName}, focusing on leaf and plant shape, secondary focus on flower if present, high quality, photorealistic, nature photography style`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });
    
    if (response.generatedImages?.[0]?.image?.imageBytes) {
      return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    }
    throw new Error("No image generated");
  } catch (e) {
    console.error("Imagen failed, falling back to Gemini Image", e);
    // Fallback to Gemini Image if Imagen fails or is not accessible
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Generate a photorealistic botanical close-up image of ${plantName}, focusing on leaf and plant shape, secondary focus on flower if present` }]
        }
      });

      for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    } catch (fallbackError) {
      console.error("Fallback image generation also failed", fallbackError);
    }
    
    // If both fail, throw the original error
    throw e;
  }
};

export const parsePruningMonths = (text: string): number[] => {
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  
  const lowerText = text.toLowerCase();
  const foundMonths: number[] = [];
  
  months.forEach((m, i) => {
    if (lowerText.includes(m)) {
      foundMonths.push(i);
    }
  });
  
  return foundMonths;
};

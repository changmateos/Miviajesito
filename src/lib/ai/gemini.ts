import { GoogleGenAI } from '@google/genai';

export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

export async function generateWithGemini(
  apiKey: string,
  prompt: string,
  enableSearch = true,
  preferredModel = DEFAULT_GEMINI_MODEL
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const candidateModels = Array.from(
    new Set([preferredModel, 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'])
  );

  let lastError: any = null;

  for (const model of candidateModels) {
    // 1. Try with Google Search tool enabled
    if (enableSearch) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        console.warn(`Gemini with Google Search on ${model} failed, trying without search:`, err?.message);
        lastError = err;
      }
    }

    // 2. Try standard generation without search tool
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Standard Gemini generation with ${model} failed:`, err?.message);
      lastError = err;
    }
  }

  throw lastError || new Error('No se pudo generar respuesta con los modelos de Gemini disponibles.');
}

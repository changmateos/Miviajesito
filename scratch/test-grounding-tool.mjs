import { GoogleGenAI } from '@google/genai';

async function testGroundingTool() {
  const apiKey = process.env.GEMINI_API_KEY || 'test';
  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Cuáles son los 3 lugares más recomendados en redes sociales para visitar en Tokio?',
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    console.log('Result:', res.text?.slice(0, 200));
  } catch (e) {
    console.log('Grounding error test:', e.message);
  }
}

testGroundingTool();

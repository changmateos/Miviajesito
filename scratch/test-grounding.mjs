import { GoogleGenAI } from '@google/genai';

async function testGrounding() {
  const apiKey = process.env.GEMINI_API_KEY || 'test';
  const ai = new GoogleGenAI({ apiKey });
  console.log('Testing model configuration...');
}

testGrounding();

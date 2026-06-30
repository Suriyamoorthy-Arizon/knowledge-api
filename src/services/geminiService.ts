import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function askGemini(question: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
You are an assistant for our Knowledge Desk.

Answer the following question clearly.

Question:
${question}
`,
  });

  return response.text;
}

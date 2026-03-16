import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateAnalystResponse = async (prompt: string, context: any) => {
  const systemInstruction = `You are a senior political risk analyst for TUNISIAINTEL. 
  You have access to the full platform state, including:
  - Current RRI Score: ${context.rri}
  - P(Revolution): ${context.pRev}
  - Active Events: ${JSON.stringify(context.events)}
  - Governorate Data: ${JSON.stringify(context.governorates)}
  
  Answer the user's intelligence query with professional, data-grounded assessment. 
  Cite specific model figures and events. Be concise and objective.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction,
      maxOutputTokens: 800,
    }
  });

  return response.text;
};

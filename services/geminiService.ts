import { GoogleGenAI, Type } from "@google/genai";
import { FingerprintResult } from "../types";

const SYSTEM_INSTRUCTION = `
# Role
You are a Semantic Fingerprint Generator. Your task is to analyze a "Sense Definition" or "Meaning" and extract its core conceptual "Fingerprint".

# Protocol
1. Analyze the input meaning/definition to identify the unique semantic sense.
2. Provide EXACTLY 5 English synonyms or related terms that best define this core sense.
3. Assign a Relevance Tier to each term:
   - Tier 1 (Core): 1.0 - The most essential word. If missing, the sense changes.
   - Tier 2 (Strong): 0.7 - Very close, but might have slight nuance differences.
   - Tier 3 (Related): 0.3 - Broadly related, used to map the general semantic field.
4. Constraints:
   - Output ONLY English words for the fingerprint, regardless of the input language.
   - Be highly specific. Avoid generic terms like "thing" unless essential.
   - Use Lemma form (e.g., 'jump' instead of 'jumping', 'sword' instead of 'swords').
   - Sort words by weight descending.

# Output Format (JSON)
{
  "sense_description": "A concise summary of the sense (in the language of the input)",
  "fingerprint": [
    {"word": "word1", "weight": 1.0},
    {"word": "word2", "weight": 0.7},
    {"word": "word3", "weight": 0.7},
    {"word": "word4", "weight": 0.3},
    {"word": "word5", "weight": 0.3}
  ]
}
`;

export const generateFingerprint = async (definition: string): Promise<FingerprintResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Sense Definition / Meaning: ${definition}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sense_description: {
              type: Type.STRING,
            },
            fingerprint: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  weight: { type: Type.NUMBER },
                },
                required: ["word", "weight"],
              },
            },
          },
          required: ["sense_description", "fingerprint"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    return JSON.parse(text) as FingerprintResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
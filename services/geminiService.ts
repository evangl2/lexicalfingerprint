import { GoogleGenAI, Type } from "@google/genai";
import { FingerprintResult } from "../types";

const SYSTEM_INSTRUCTION = `
# Role
You are a Semantic Fingerprint Generator for a linguistic engine. Your task is to extract the core "Sense" (the underlying concept) from any input and represent it as a structured fingerprint.

# Fingerprint Protocol
1. Identify the unique Semantic Sense of the input.
2. Generate EXACTLY 5 English synonyms/related words that define this specific sense.
3. Assign a Relevance Tier to each word:
   - Tier 1 (Core): 1.0 (Essential meaning)
   - Tier 2 (Strong): 0.7 (Very close nuance)
   - Tier 3 (Related): 0.3 (Broad semantic field)
4. Constraints:
   - Only output English words for the fingerprint, regardless of input language.
   - Be highly specific to the context/sense provided.
   - Use Lemma form (e.g., 'jump' instead of 'jumping').

# Output Format (JSON)
{
  "sense_description": "Briefly describe the identified sense",
  "fingerprint": [
    {"word": "word1", "weight": 1.0},
    {"word": "word2", "weight": 0.7},
    {"word": "word3", "weight": 0.7},
    {"word": "word4", "weight": 0.3},
    {"word": "word5", "weight": 0.3}
  ]
}
`;

export const generateFingerprint = async (input: string, context?: string): Promise<FingerprintResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let prompt = `Input: ${input}`;
    if (context) {
      prompt += `\nContext/Description: ${context}`;
    }

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
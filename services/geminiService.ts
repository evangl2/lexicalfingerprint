import { GoogleGenAI, Type } from "@google/genai";
import { FingerprintResult, FingerprintConfig } from "../types";

const buildSystemInstruction = (config: FingerprintConfig) => {
  const tiersInstruction = config.tiers
    .map((t, index) => `- Tier ${index + 1}: ${t.description}`)
    .join('\n');

  return `
# Role
You are a Semantic Fingerprint Generator. Your task is to analyze a "Sense Definition" or "Meaning" and extract its core conceptual "Fingerprint".

# Protocol
1. Analyze the input meaning/definition to identify the unique semantic sense.
2. Provide EXACTLY ${config.totalCount} English synonyms or related terms that best define this core sense.
3. Assign a specific "Tier" (1, 2, or 3) to each word based on how central it is to the meaning.
   - You determine the distribution of tiers based on the concept's complexity, but the total number of words must match ${config.totalCount}.

# Tier Definitions
${tiersInstruction}

# Constraints
   - Output ONLY English words for the fingerprint, regardless of the input language.
   - Sort words by Tier (1 first, then 2, then 3).

# Lemmatization & Normalization Rules (CRITICAL)
    - Force Lemmatization: Always use the most lemma form of a word.
    - Prefer ADJECTIVE forms for properties. Prefer NOUN forms for objects/entities。
    - No Plurals: Always use singular forms (e.g., "spring" NOT "springs").
    - No Inflections: No past tense or progressive forms.
  

# Output Format (JSON)
{
  "sense_description": "A concise summary of the sense (in the language of the input)",
  "fingerprint": [
    {"word": "word1", "tier": 1},
    {"word": "word2", "tier": 2},
    ... (total ${config.totalCount} items)
  ]
}
`;
};

export const generateFingerprint = async (definition: string, config: FingerprintConfig): Promise<FingerprintResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Sense Definition / Meaning: ${definition}`;
    const systemInstruction = buildSystemInstruction(config);

    const response = await ai.models.generateContent({
      model: config.model, // Use the model selected in configuration
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
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
                  tier: { type: Type.INTEGER, description: "The tier number (1, 2, or 3)" },
                },
                required: ["word", "tier"],
              },
            },
          },
          required: ["sense_description", "fingerprint"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    const rawResult = JSON.parse(text);

    // Post-process: Map the AI-generated "tier" ID to the "weight" defined in the config
    const finalFingerprint = rawResult.fingerprint.map((item: { word: string, tier: number }) => {
        // Adjust for 0-based index. Tier 1 -> index 0
        const tierConfig = config.tiers[item.tier - 1];
        // Fallback to Tier 3 weight if something goes wrong with the index
        const weight = tierConfig ? tierConfig.weight : config.tiers[config.tiers.length - 1].weight;
        
        return {
            word: item.word,
            weight: weight
        };
    });
    
    // Sort by weight descending for display consistency
    finalFingerprint.sort((a: any, b: any) => b.weight - a.weight);

    return {
        sense_description: rawResult.sense_description,
        fingerprint: finalFingerprint
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
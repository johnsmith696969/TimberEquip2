import { GoogleGenAI, Type } from "@google/genai";
import { getAmvInsufficientComparableMessage, getAmvMatchRulesSummary } from '../utils/amvMatching';

const GEMINI_API_KEY = String(import.meta.env.VITE_GEMINI_API_KEY || '').trim();
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

export const geminiService = {
  async getMachineSpecs(machineName: string, category: string) {
    if (!ai) {
      return null;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide technical specifications for a ${machineName} (${category}). 
        Include: horsepower, weight (kg), ton capacity (if applicable).
        If it's firewood equipment, also include: max log diameter (cm), cycle time (seconds), saw blade size (cm), bar saw size (cm), conveyor length (m).
        Return the data as a clean JSON object with keys like 'horsepower', 'weight', 'tonCapacity', etc.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              horsepower: { type: Type.STRING },
              weight: { type: Type.STRING },
              tonCapacity: { type: Type.STRING },
              maxLogDiameter: { type: Type.STRING },
              cycleTime: { type: Type.STRING },
              sawBladeSize: { type: Type.STRING },
              barSawSize: { type: Type.STRING },
              conveyorLength: { type: Type.STRING },
              additionalSpecs: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.warn("Machine specs are temporarily unavailable from Gemini:", error);
      return null;
    }
  },

  async explainAMV(machineName: string, price: number, marketValue: number | null, specs: any) {
    if (marketValue === null) {
      return getAmvInsufficientComparableMessage();
    }

    if (!ai) {
      return `AMV is calculated using comparable equipment listings that match ${getAmvMatchRulesSummary().toLowerCase()}`;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Explain how the Equipment Market Value (AMV) of ${marketValue} was calculated for a ${machineName} priced at ${price}.
        Consider these specs: ${JSON.stringify(specs)}.
        Provide a professional, data-driven explanation in 3-4 sentences.`,
      });

      return response.text;
    } catch (error) {
      console.warn("AMV explanation is temporarily unavailable from Gemini:", error);
      return `AMV is calculated using comparable equipment listings that match ${getAmvMatchRulesSummary().toLowerCase()}`;
    }
  }
};

import { Type } from "@google/genai";
import { getAmvInsufficientComparableMessage, getAmvMatchRulesSummary } from '../utils/amvMatching';
import { getAuth } from 'firebase/auth';

async function callAiProxy(prompt: string, responseSchema?: unknown): Promise<string | null> {
  const user = getAuth().currentUser;
  if (!user) return null;

  const idToken = await user.getIdToken();
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ prompt, responseSchema }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.text || null;
}

export const geminiService = {
  async getMachineSpecs(machineName: string, category: string) {
    try {
      const prompt = `Provide technical specifications for a ${machineName} (${category}).
        Include: horsepower, weight (kg), ton capacity (if applicable).
        If it's firewood equipment, also include: max log diameter (cm), cycle time (seconds), saw blade size (cm), bar saw size (cm), conveyor length (m).
        Return the data as a clean JSON object with keys like 'horsepower', 'weight', 'tonCapacity', etc.`;

      const responseSchema = {
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
      };

      const text = await callAiProxy(prompt, responseSchema);
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.warn("Machine specs are temporarily unavailable:", error);
      return null;
    }
  },

  async explainAMV(machineName: string, price: number, marketValue: number | null, specs: any) {
    if (marketValue === null) {
      return getAmvInsufficientComparableMessage();
    }

    try {
      const prompt = `Explain how the Equipment Market Value (AMV) of ${marketValue} was calculated for a ${machineName} priced at ${price}.
        Consider these specs: ${JSON.stringify(specs)}.
        Provide a professional, data-driven explanation in 3-4 sentences.`;

      const text = await callAiProxy(prompt);
      return text || `AMV is calculated using comparable equipment listings that match ${getAmvMatchRulesSummary().toLowerCase()}`;
    } catch (error) {
      console.warn("AMV explanation is temporarily unavailable:", error);
      return `AMV is calculated using comparable equipment listings that match ${getAmvMatchRulesSummary().toLowerCase()}`;
    }
  }
};

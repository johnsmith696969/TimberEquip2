import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiService = {
  async getMachineSpecs(machineName: string, category: string) {
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
      console.error("Error fetching machine specs from Gemini:", error);
      return null;
    }
  },

  async explainAMV(machineName: string, price: number, marketValue: number | null, specs: any) {
    if (marketValue === null) {
      return 'AMV is N/A for this machine because there are fewer than two comparable listings that match manufacturer, model, year (+/-1), and hours (+/-500).';
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
      console.error("Error explaining AMV from Gemini:", error);
      return "AMV is calculated using comparable equipment listings that match make, model, year, and operating hours.";
    }
  }
};

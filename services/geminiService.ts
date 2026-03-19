import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, IssueCategory, IssueSeverity, AnalysisIssue } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is not defined in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-types' });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalText: {
            type: Type.STRING,
            description: "The specific word or phrase in the input text that is flagged.",
          },
          suggestion: {
            type: Type.STRING,
            description: "A more inclusive, polite, or neutral alternative phrase.",
          },
          reason: {
            type: Type.STRING,
            description: "A brief explanation of why the original text might be problematic in Japanese culture or inclusive writing context.",
          },
          category: {
            type: Type.STRING,
            enum: [
              "GENDER",
              "RACE",
              "ABILITY",
              "AGGRESSION",
              "EXCLUSION",
              "OTHER"
            ],
            description: "The category of the issue.",
          },
          severity: {
            type: Type.STRING,
            enum: ["INFO", "WARNING", "CRITICAL"],
            description: "The severity of the issue.",
          }
        },
        required: ["originalText", "suggestion", "reason", "category", "severity"],
      },
    },
  },
  required: ["issues"],
};

export const analyzeTextWithGemini = async (text: string): Promise<AnalysisResult> => {
  if (!text.trim()) {
    return { issues: [] };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        あなたは日本語のインクルーシブ・ライティングの専門家です。
        以下のテキストを分析し、ジェンダー、人種、障がい、年齢、攻撃的な表現、または不用意に誰かを傷つける可能性のある表現（マイクロアグレッション含む）を見つけてください。
        
        特に以下の点に注意してください：
        1. "彼/彼女"のような性別を特定する代名詞の過度な使用や、性別による役割の決めつけ（「看護婦」「保母」など）。
        2. "外人"のような排他的な表現。
        3. 障がいに関する配慮に欠ける表現（「片手落ち」「めくら」など）。
        4. 必要以上に威圧的、断定的、または命令口調な表現。
        
        見つかった各問題点について、代替案と理由を提示してください。
        問題がない場合は空のリストを返してください。
        
        分析対象テキスト:
        "${text}"
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are a highly skilled Japanese copy editor focusing on Diversity, Equity, and Inclusion (DEI). Be strict but helpful.",
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Empty response from Gemini");
    }

    const result = JSON.parse(jsonText) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return empty result on error to prevent app crash, or could throw to handle in UI
    return { issues: [] };
  }
};

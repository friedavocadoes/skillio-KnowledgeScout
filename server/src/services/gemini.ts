import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  }

  async processDocument(filePath: string, mimeType: string): Promise<string> {
    try {
      const fileData = fs.readFileSync(filePath);

      const result = await this.model.generateContent([
        "Extract and analyze the text content from this document. Provide a clean, readable version of all text content, preserving structure where possible. Include page numbers or section references if available.",
        {
          inlineData: {
            data: fileData.toString("base64"),
            mimeType: mimeType,
          },
        },
      ]);

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini document processing error:", error);
      throw new Error("Failed to process document with Gemini");
    }
  }

  async askQuestion(
    documentContent: string,
    query: string,
    k: number = 3
  ): Promise<{ answer: string; sources: string[] }> {
    try {
      const prompt = `
Based on the following document content, answer the user's question. Provide specific page references or section citations where possible.

Document Content:
${documentContent}

User Question: ${query}

Please provide:
1. A comprehensive answer based on the document
2. Specific page numbers or section references where the information can be found
3. Quote relevant passages when appropriate

Format your response with clear citations like [Page X] or [Section Y] where applicable.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      // Extract sources from the answer (simple regex for page references)
      const sourceMatches =
        answer.match(/\[Page \d+\]|\[Section [^\]]+\]/g) || [];
      const sources = [...new Set(sourceMatches)]; // Remove duplicates

      return {
        answer,
        sources: sources.slice(0, k), // Limit to k sources
      };
    } catch (error) {
      console.error("Gemini Q&A error:", error);
      throw new Error("Failed to process question with Gemini");
    }
  }

  async generateSummary(documentContent: string): Promise<string> {
    try {
      const prompt = `
Provide a concise summary of the following document content. Include key points, main topics, and important details.

Document Content:
${documentContent}

Summary:
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini summary error:", error);
      throw new Error("Failed to generate summary with Gemini");
    }
  }
}

export default new GeminiService();

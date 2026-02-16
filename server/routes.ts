import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateFindings } from "./gemini";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/generate-findings", async (req, res) => {
    try {
      const { lesions } = req.body;
      if (!lesions || !Array.isArray(lesions) || lesions.length === 0) {
        return res.status(400).json({ error: "Lesões são obrigatórias" });
      }
      const findings = await generateFindings(lesions);
      res.json({ findings });
    } catch (error) {
      console.error("Error generating findings:", error);
      res.status(500).json({ error: "Erro ao gerar achados com IA" });
    }
  });

  return httpServer;
}

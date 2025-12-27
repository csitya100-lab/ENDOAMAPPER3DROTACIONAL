import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, aplicarOperacoes } from "./storage";
import { laudoSchema, operacaoSchema, type Laudo, type Operacao } from "@shared/schema";
import { GoogleGenAI } from "@google/genai";

// Usando Replit AI Integrations para Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const PROMPT_SISTEMA = `Você é um especialista em diagnóstico de endometriose por ultrassom ginecológico.
Recebe um ditado em português médico e um JSON estruturado de laudo.
Analise o ditado e extraia APENAS os achados clínicos relevantes (lesões, medidas, localizações, compartimentos afetados).
Retorne uma lista de operações JSON APENAS para campos que mudem.
Nunca modifique campos que não foram mencionados no ditado.
Estruture lesões com: tipo, localização, medidas (ex: 2.0 x 3.0 cm), profundidade (superficial/intermediária/profunda).
Use terminologia médica formal.
Retorne: [{ acao: 'update'|'add'|'remove', caminho: 'campo.subcampo', valor: ... }]`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // API de análise com Gemini
  app.post("/api/analisarDitadoEAplicar", async (req, res) => {
    try {
      const { ditado, laudoAtual } = req.body;

      if (!ditado || !laudoAtual) {
        return res.status(400).json({
          error: "Ditado e laudoAtual são obrigatórios",
        });
      }

      // Validar estrutura do laudo
      const laudoValidado = laudoSchema.parse(laudoAtual);

      const prompt = `${PROMPT_SISTEMA}

JSON do Laudo Atual:
${JSON.stringify(laudoValidado, null, 2)}

Ditado do Médico:
"${ditado}"

Retorne APENAS um JSON válido com array de operações. Exemplo:
[
  { "acao": "update", "caminho": "conclusao", "valor": "Achados compatíveis com endometriose profunda" },
  { "acao": "update", "caminho": "utero.tamanho", "valor": "aumentado" }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      
      const texto = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Extrair JSON da resposta
      const jsonMatch = texto.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return res.status(400).json({
          error: "Não foi possível extrair operações da resposta do Gemini",
          resposta: texto,
        });
      }

      const operacoes: Operacao[] = JSON.parse(jsonMatch[0]);

      // Validar operações
      const operacoesValidadas = operacoes.map((op) =>
        operacaoSchema.parse(op)
      );

      // Aplicar operações
      const laudoAtualizado = aplicarOperacoes(laudoValidado, operacoesValidadas);

      res.json({
        resultado_edicao: {
          operacoes: operacoesValidadas,
        },
        laudoAtualizado,
      });
    } catch (erro) {
      console.error("Erro ao analisar ditado:", erro);
      res.status(500).json({
        error: "Erro ao processar ditado com IA",
        detalhes: erro instanceof Error ? erro.message : String(erro),
      });
    }
  });

  // API auxiliar para aplicar operações manualmente
  app.post("/api/aplicarOperacoes", async (req, res) => {
    try {
      const { laudoAtual, operacoes } = req.body;

      if (!laudoAtual || !operacoes) {
        return res.status(400).json({
          error: "laudoAtual e operacoes são obrigatórios",
        });
      }

      const laudoValidado = laudoSchema.parse(laudoAtual);
      const operacoesValidadas = operacoes.map((op: Operacao) =>
        operacaoSchema.parse(op)
      );

      const laudoAtualizado = aplicarOperacoes(laudoValidado, operacoesValidadas);

      res.json({
        sucesso: true,
        laudoAtualizado,
      });
    } catch (erro) {
      console.error("Erro ao aplicar operações:", erro);
      res.status(500).json({
        error: "Erro ao aplicar operações",
        detalhes: erro instanceof Error ? erro.message : String(erro),
      });
    }
  });

  return httpServer;
}

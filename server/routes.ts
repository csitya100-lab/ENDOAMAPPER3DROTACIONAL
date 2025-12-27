import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, aplicarOperacoes } from "./storage";
import { laudoSchema, operacaoSchema, type Laudo, type Operacao } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const PROMPT_SISTEMA = `Você é um agente de análise de laudos de ultrassom ginecológico para endometriose.
Recebe um texto de ditado em linguagem natural e um JSON de laudo estruturado.
Sua tarefa: interpretar o ditado, extrair achados, lesões, medidas e conclusões,
e retornar APENAS uma lista de operacoes (JSON patch) para atualizar o laudo.
Use terminologia médica formal em português.
Nunca invente achados; se não estiver claro, deixe em branco.
Retorne apenas uma array de operações com acao, caminho e valor.`;

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

      // Chamar Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

      const response = await model.generateContent(prompt);
      const texto = response.response.text();

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

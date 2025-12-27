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
Recebe um ditado em português médico natural e um JSON estruturado de laudo.

SUA TAREFA:
1. Analise o ditado e identifique TODAS as lesões mencionadas.
2. Classifique cada lesão pelo tipo:
   - ENDOMETRIOMA → adicione em ovario_direito.lesoes ou ovario_esquerdo.lesoes
   - MIOMA → adicione em utero.miomas
   - LESÃO ENDOMTRIÓSICA → adicione no compartimento específico mencionado

3. PARA CADA LESÃO, estruture assim:
   {
     "tipo": "endometrioma" | "mioma" | "lesão endomtriósica" | "outra",
     "localizacao": "lado direito" | "lado esquerdo" | "parede anterior" | (conforme ditado),
     "tamanho": "valor em cm" (ex: "2 cm", "4 cm", "2.0 x 3.0 cm"),
     "profundidade": "superficial" | "intermediária" | "profunda" | (conforme ditado)
   }

4. MAPEAMENTO DE CAMINHO:
   - Se "endometrioma lado direito 2 cm" → adicione em: ovario_direito.lesoes (push)
   - Se "mioma parede anterior 4 cm" → adicione em: utero.miomas (push)
   - Se "lesão endomtriósica ligamento redondo direito" → atualize: compartimentos.medial.ligamentos_redondos

5. NUNCA invente campos; use exatamente a estrutura do JSON fornecido.

6. Se o ditado mencionar endometriose em um compartimento, atualize achados_endometriose para 'Sim' naquele compartimento.

7. Se mencionar uma conclusão ou diagnóstico, atualize o campo conclusao.

8. RETORNE APENAS a lista de operações JSON:
   [{ acao: 'update'|'add'|'remove', caminho: 'campo.subcampo.array', valor: {...} }]

EXEMPLO DE RESPOSTA:
Se ditado é 'endometrioma de 2 cm no lado direito, mioma de 4 cm na parede anterior do útero':
[
  { "acao": "add", "caminho": "ovario_direito.lesoes", "valor": { "tipo": "endometrioma", "localizacao": "lado direito", "tamanho": "2 cm", "profundidade": "" } },
  { "acao": "add", "caminho": "utero.miomas", "valor": { "tipo": "mioma", "localizacao": "parede anterior", "tamanho": "4 cm", "profundidade": "" } },
  { "acao": "update", "caminho": "conclusao", "valor": "Presença de endometrioma no ovário direito medindo 2 cm e mioma uterino de 4 cm na parede anterior." }
]

Use terminologia médica formal em português. Nunca deixe campos importantes vazios se foram mencionados.`;

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

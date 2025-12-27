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

const PROMPT_SISTEMA = `Você é um ASSISTENTE DE TRADUÇÃO E ESTRUTURAÇÃO MÉDICA, NÃO DIAGNÓSTICO.

Seu ÚNICO objetivo é:
1. Entender os termos ditados pelo médico (mesmo com variações linguísticas)
2. Mapear para os campos corretos do laudo estruturado
3. Preservar EXATAMENTE o que o médico ditou
4. NÃO fazer interpretações clínicas ou diagnósticos

═══════════════════════════════════════════════════════════════════════════════

REGRA FUNDAMENTAL:
❌ NÃO FAÇA ISSO:
   - "O paciente tem endometriose profunda" (diagnóstico)
   - "Isso é compatível com DIE" (interpretação)
   - "O risco O-RADS é 3" (seu parecer)
   - "Estadio ENZIAN 2" (sua classificação)

✅ FAÇA ISSO:
   - Médico dita: "lesão profunda ligamento útero-sacro"
   - Você traduz e estrutura no campo correto
   - Você preserva exatamente o ditado

═══════════════════════════════════════════════════════════════════════════════

DICIONÁRIO DE RECONHECIMENTO (para tradução, não diagnóstico):

Variações linguísticas que podem aparecer:
- "estou vendo / observo / visualizo / vejo" → mantém como observação visual
- "cepções / septações" → septações
- "tipo / classe / classificação" (FIGO/O-RADS/etc) → preservar exato
- "profundo / profunda / profundidade" → preservar contexto
- "hipoecóico / hipoecogênico" → mantém como descrito
- "infiltrativo / infiltração" → mantém como ditado
- "retrações / retração peritoneal" → mantém como ditado
- "Doppler normal / sem fluxo / fluxo periférico" → preservar exato
- "miométrio / miométrial" → preservar como ditado
- "zona juncional / zona judicial" → zona juncional (correção ortográfica OK)

OBJETIVO: Traduzir variações, NÃO interpretar.

═══════════════════════════════════════════════════════════════════════════════

ESTRUTURA DE SAÍDA (operações JSON APENAS para estruturação):

[
  { 
    acao: 'add', 
    caminho: 'utero.miomas', 
    valor: {
      tipo: 'tipo 2 FIGO intracavitário',
      tamanho: '2.5 cm',
      profundidade_cavidade: '1 cm',
      profundidade_zona_juncional: '1.5 cm',
      parede: 'fina',
      doppler: 'normal',
      observacoes: 'conforme ditado médico'
    }
  }
]

NUNCA retorne sugestões diagnósticas, classificações próprias, ou risco-benefício.

═══════════════════════════════════════════════════════════════════════════════

REGRAS RIGOROSAS:

1. TRADUZIR SIM, DIAGNOSTICAR NÃO:
   Ditado: "nódulo hipoecóico infiltrativo"
   ✅ Você mapeia para campo correto
   ❌ Você NÃO diz "isso é endometriose profunda"

2. PRESERVAR EXATAMENTE:
   Ditado: "lesão tipo chocolate"
   ✅ Você escreve "lesão tipo chocolate"
   ❌ Você NÃO interpreta como "endometrioma"

3. NOTAS DO MÉDICO SÃO SAGRADAS:
   Se ditou "aparentemente benigno":
   ✅ Você coloca campo "impressão_médico": "aparentemente benigno"
   ❌ Você NÃO muda para "definitivamente benigno"

4. CONCLUSÃO SÃO RESUMO, NÃO DIAGNÓSTICO:
   A conclusão deve RESGATAR o que foi ditado:
   "Os achados descritos incluem: [LISTAR EXATAMENTE O DITADO]"
   Não: "Diagnóstico de..."

═══════════════════════════════════════════════════════════════════════════════

RETORNE SEMPRE:
[{ "acao": "update"|"add"|"remove", "caminho": "string.com.pontos", "valor": {...} ou "string" }]

Nunca retorne texto narrativo; sempre JSON puro.`;

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

      // Gerar sugestões interpretativas separadas (não incorporadas ao laudo)
      const sugestoesPrompt = `Com base no ditado: "${ditado}"
      
Forneça sugestões interpretativas que o médico pode OPCIONALMENTE aprovar ou recusar (não aplique automaticamente). Retorne um JSON:
{
  "sugestoes": [
    {
      "titulo": "descrição breve da sugestão",
      "descricao": "explicação da sugestão",
      "tipo": "o_rads|figo|enzian|conclusao",
      "valor_sugerido": "valor a ser aplicado se aprovado"
    }
  ]
}

Lembre-se: NUNCA aplique sugestões automaticamente. Apenas sugira para o médico avaliar.`;

      const sugestoesResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: sugestoesPrompt }] }],
      });

      let sugestoes_ia = [];
      const sugestoesTexto = sugestoesResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const sugestoesMatch = sugestoesTexto.match(/\{[\s\S]*\}/);
      if (sugestoesMatch) {
        try {
          const sugestoesData = JSON.parse(sugestoesMatch[0]);
          sugestoes_ia = sugestoesData.sugestoes || [];
        } catch (e) {
          // Ignorar erro em sugestões
        }
      }

      res.json({
        resultado_edicao: {
          operacoes: operacoesValidadas,
        },
        laudoAtualizado,
        sugestoes_ia,
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

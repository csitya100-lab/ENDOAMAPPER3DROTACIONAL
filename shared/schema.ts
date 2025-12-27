import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Laudo schema - Estrutura clínica completa para endometriose
export const laudoSchema = z.object({
  cabecalho: z.object({
    nome_medico: z.string().default(""),
    data: z.string().default(""),
    tipo_exame: z.string().default("ULTRASSONOGRAFIA PARA PESQUISA DE ENDOMETRIOSE COM PREPARO INTESTINAL"),
  }),
  equipamento: z.object({
    nome: z.string().default(""),
    vias: z.string().default(""),
    tecnicas: z.string().default(""),
  }),
  estruturas: z.object({
    uretra: z.object({ descricao: z.string().default("") }),
    bexiga: z.object({ descricao: z.string().default("") }),
    vagina: z.object({ descricao: z.string().default("") }),
  }),
  utero: z.object({
    forma: z.string().default(""),
    contornos: z.string().default(""),
    paredes: z.string().default(""),
    miometrio: z.string().default(""),
    biometria: z.string().default(""),
    eco_endometrial: z.string().default(""),
    linha_media: z.string().default(""),
    juncao_endometrio_miometrio: z.string().default(""),
    padrao: z.string().default(""),
    espessura_endometrial: z.string().default(""),
  }),
  ovario_direito: z.object({
    localizacao: z.string().default(""),
    forma: z.string().default(""),
    limites: z.string().default(""),
    parenchima: z.string().default(""),
    biometria: z.string().default(""),
    lesoes: z.array(z.any()).default([]),
  }),
  ovario_esquerdo: z.object({
    localizacao: z.string().default(""),
    forma: z.string().default(""),
    limites: z.string().default(""),
    parenchima: z.string().default(""),
    biometria: z.string().default(""),
    lesoes: z.array(z.any()).default([]),
  }),
  compartimentos: z.object({
    anterior: z.object({
      parede_vesical: z.string().default(""),
      espaco_vesico_uterino: z.string().default(""),
      sinal_deslizamento_anterior: z.string().default(""),
      achados_endometriose: z.string().default(""),
    }),
    medial: z.object({
      superficie_uterina: z.string().default(""),
      ligamentos_redondos: z.string().default(""),
      tubas_uterinas: z.string().default(""),
      ovarios: z.string().default(""),
      achados_endometriose: z.string().default(""),
    }),
    posterior: z.object({
      septo_retovaginal: z.string().default(""),
      frnice_vaginal: z.string().default(""),
      retossigmoide: z.string().default(""),
      ligamentos_utero_sacros: z.string().default(""),
      regiao_retro_cervical: z.string().default(""),
      sinal_deslizamento_posterior: z.string().default(""),
      achados_endometriose: z.string().default(""),
    }),
  }),
  rins_ureteres: z.object({
    rins: z.string().default(""),
    ureteres_terminais: z.string().default(""),
  }),
  parede_abdominal: z.object({
    regiao_umbilical: z.string().default(""),
    parede_abdominal: z.string().default(""),
  }),
  conclusao: z.string().default(""),
});

export type Laudo = z.infer<typeof laudoSchema>;

export const operacaoSchema = z.object({
  acao: z.enum(["update", "add", "remove"]),
  caminho: z.string(),
  valor: z.any(),
});

export type Operacao = z.infer<typeof operacaoSchema>;

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

// Laudo schema
export const laudoSchema = z.object({
  paciente: z.object({
    nome: z.string().default(""),
    idade: z.number().default(0),
    cpf: z.string().default(""),
  }),
  exame: z.object({
    data: z.string().default("2024-01-01"),
    tipo: z.string().default("Ultrassom - Endometriose"),
    ecografista: z.string().default(""),
    equipamento: z.string().default(""),
  }),
  utero: z.object({
    tamanho: z.string().default(""),
    forma: z.string().default(""),
    ecotextura: z.string().default(""),
    adenomiose: z.string().default(""),
  }),
  ovario_direito: z.object({
    tamanho: z.string().default(""),
    lesoes: z.array(z.any()).default([]),
  }),
  ovario_esquerdo: z.object({
    tamanho: z.string().default(""),
    lesoes: z.array(z.any()).default([]),
  }),
  compartimentos: z.object({
    ligamento_redondo_d: z.object({ achados: z.string().default("") }),
    ligamento_redondo_e: z.object({ achados: z.string().default("") }),
    bolsa_ovariana_d: z.object({ achados: z.string().default("") }),
    bolsa_ovariana_e: z.object({ achados: z.string().default("") }),
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

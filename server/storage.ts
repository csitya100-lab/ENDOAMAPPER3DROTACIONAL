import { type User, type InsertUser, type Laudo, type Operacao, laudoSchema } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();

// Utilidades para laudo
export function aplicarOperacoes(laudo: Laudo, operacoes: Operacao[]): Laudo {
  let laudoAtualizado = JSON.parse(JSON.stringify(laudo));

  for (const op of operacoes) {
    const partes = op.caminho.split(".");
    let obj = laudoAtualizado;

    // Navegar até o penúltimo nível
    for (let i = 0; i < partes.length - 1; i++) {
      const parte = partes[i];
      if (!obj[parte]) {
        obj[parte] = {};
      }
      obj = obj[parte];
    }

    const ultimaChave = partes[partes.length - 1];

    if (op.acao === "update") {
      obj[ultimaChave] = op.valor;
    } else if (op.acao === "add") {
      if (Array.isArray(obj[ultimaChave])) {
        obj[ultimaChave].push(op.valor);
      } else {
        obj[ultimaChave] = op.valor;
      }
    } else if (op.acao === "remove") {
      delete obj[ultimaChave];
    }
  }

  return laudoAtualizado;
}

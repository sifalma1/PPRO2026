import { Kurz } from "../entities/Kurz.js";

/**
 * Rozhraní repozitáře pro entitu Kurz (DIP - Dependency Inversion Principle)
 */
export interface IKurzRepository {
  findAll(filter?: { jeAkreditovany?: boolean; query?: string }): Promise<Kurz[]>;
  findById(id: string): Promise<Kurz | null>;
  create(kurz: Kurz): Promise<Kurz>;
  update(id: string, kurz: Kurz): Promise<Kurz | null>;
  delete(id: string): Promise<boolean>;
}

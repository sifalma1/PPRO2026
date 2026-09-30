import { Kurz } from "../../domain/entities/Kurz.js";
import { IKurzRepository } from "../../domain/repositories/IKurzRepository.js";
import { CreateKurzDto, KurzResponseDto, UpdateKurzDto } from "../dto/KurzDto.js";

/**
 * Aplikační služba pro správu kurzů.
 * Zajišťuje koordinaci byznys případů a mapování mezi entitami a DTOs.
 */
export class KurzService {
  constructor(private readonly kurzRepository: IKurzRepository) {}

  public async getAllKurzy(filter?: { jeAkreditovany?: boolean; query?: string }): Promise<KurzResponseDto[]> {
    const kurzy = await this.kurzRepository.findAll(filter);
    return kurzy.map(k => this.toResponseDto(k));
  }

  public async getKurzById(id: string): Promise<KurzResponseDto> {
    const kurz = await this.kurzRepository.findById(id);
    if (!kurz) {
      throw new Error(`Kurz s ID '${id}' nebyl nalezen.`);
    }
    return this.toResponseDto(kurz);
  }

  public async createKurz(dto: CreateKurzDto): Promise<KurzResponseDto> {
    const domainKurz = new Kurz({
      nazev: dto.nazev,
      anotace: dto.anotace,
      rozsahHodin: dto.rozsahHodin,
      cena: dto.cena,
      jeAkreditovany: Boolean(dto.jeAkreditovany)
    });

    const created = await this.kurzRepository.create(domainKurz);
    return this.toResponseDto(created);
  }

  public async updateKurz(id: string, dto: UpdateKurzDto): Promise<KurzResponseDto> {
    const existing = await this.kurzRepository.findById(id);
    if (!existing) {
      throw new Error(`Kurz s ID '${id}' nebyl nalezen.`);
    }

    const updatedKurz = new Kurz({
      id: existing.id,
      nazev: dto.nazev !== undefined ? dto.nazev : existing.nazev,
      anotace: dto.anotace !== undefined ? dto.anotace : existing.anotace,
      rozsahHodin: dto.rozsahHodin !== undefined ? dto.rozsahHodin : existing.rozsahHodin,
      cena: dto.cena !== undefined ? dto.cena : existing.cena,
      jeAkreditovany: dto.jeAkreditovany !== undefined ? dto.jeAkreditovany : existing.jeAkreditovany,
      createdAt: existing.createdAt
    });

    const saved = await this.kurzRepository.update(id, updatedKurz);
    if (!saved) {
      throw new Error(`Aktualizace kurzu '${id}' selhala.`);
    }

    return this.toResponseDto(saved);
  }

  public async deleteKurz(id: string): Promise<boolean> {
    const existing = await this.kurzRepository.findById(id);
    if (!existing) {
      throw new Error(`Kurz s ID '${id}' nebyl nalezen.`);
    }
    return await this.kurzRepository.delete(id);
  }

  private toResponseDto(kurz: Kurz): KurzResponseDto {
    return {
      id: kurz.id || "",
      nazev: kurz.nazev,
      anotace: kurz.anotace,
      rozsahHodin: kurz.rozsahHodin,
      cena: kurz.cena,
      jeAkreditovany: kurz.jeAkreditovany,
      createdAt: kurz.createdAt ? kurz.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: kurz.updatedAt ? kurz.updatedAt.toISOString() : new Date().toISOString()
    };
  }
}

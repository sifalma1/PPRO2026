import { PostgresTerminRepository, CreateTerminDto } from "../../infrastructure/database/PostgresTerminRepository.js";

export class TerminService {
  constructor(private readonly repo: PostgresTerminRepository) {}

  public async getAllTerminy(): Promise<any[]> {
    return await this.repo.findAll();
  }

  public async getTerminById(id: string): Promise<any> {
    const termin = await this.repo.findById(id);
    if (!termin) throw new Error("Termín nebyl nalezen.");
    return termin;
  }

  public async createTermin(dto: CreateTerminDto): Promise<string> {
    if (!dto.kurzId) throw new Error("Kurz je povinný.");
    if (!dto.datumOd || !dto.datumDo) throw new Error("Datum od a do jsou povinná.");
    if (new Date(dto.datumOd) > new Date(dto.datumDo)) {
      throw new Error("Datum zahájení nesmí být po datu ukončení.");
    }
    if (!dto.kapacita || dto.kapacita <= 0) {
      throw new Error("Kapacita musí být kladné celé číslo.");
    }
    return await this.repo.createTermin(dto);
  }

  public async getPrihlaskyForTermin(terminId: string): Promise<any[]> {
    return await this.repo.getPrihlaskyForTermin(terminId);
  }

  public async createPrihlaska(terminId: string, studentData: any): Promise<any> {
    if (!studentData.jmeno || !studentData.prijmeni || !studentData.email) {
      throw new Error("Jméno, příjmení a e-mail studenta jsou povinné.");
    }
    return await this.repo.createPrihlaska(terminId, studentData);
  }

  public async cancelPrihlaska(prihlaskaId: string): Promise<any> {
    return await this.repo.cancelPrihlaska(prihlaskaId);
  }

  public async getLektori(): Promise<any[]> {
    return await this.repo.getLektori();
  }

  public async getUcebny(): Promise<any[]> {
    return await this.repo.getUcebny();
  }

  public async getStudenti(): Promise<any[]> {
    return await this.repo.getStudenti();
  }

  public async getAnalytics(): Promise<any> {
    return await this.repo.getAnalytics();
  }
}

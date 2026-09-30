/**
 * Doménová entita Kurz
 * Reprezentuje vzdělávací kurz nabízený Akademií Trutnov.
 */
export interface IKurzProps {
  id?: string;
  nazev: string;
  anotace: string;
  rozsahHodin: number;
  cena: number;
  jeAkreditovany: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Kurz {
  public readonly id?: string;
  public readonly nazev: string;
  public readonly anotace: string;
  public readonly rozsahHodin: number;
  public readonly cena: number;
  public readonly jeAkreditovany: boolean;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: IKurzProps) {
    this.id = props.id;
    this.nazev = props.nazev.trim();
    this.anotace = props.anotace.trim();
    this.rozsahHodin = props.rozsahHodin;
    this.cena = Number(props.cena);
    this.jeAkreditovany = props.jeAkreditovany;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

    this.validate();
  }

  /**
   * Doménové validační invarianty
   */
  private validate(): void {
    if (!this.nazev || this.nazev.length < 3 || this.nazev.length > 150) {
      throw new Error("Název kurzu musí mít délku mezi 3 a 150 znaky.");
    }

    if (!this.anotace || this.anotace.length < 10) {
      throw new Error("Anotace kurzu musí mít alespoň 10 znaků.");
    }

    if (!Number.isInteger(this.rozsahHodin) || this.rozsahHodin <= 0) {
      throw new Error("Hodinový rozsah kurzu musí být kladné celé číslo větší než 0.");
    }

    if (isNaN(this.cena) || this.cena < 0) {
      throw new Error("Cena kurzu nesmí být záporné číslo.");
    }
  }
}

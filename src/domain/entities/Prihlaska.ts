export type StavPrihlasky = "POTVRZENA" | "PORADNIK" | "ZRUSENA" | "DOKONCENA";

export interface IPrihlaskaProps {
  id?: string;
  terminId: string;
  studentId: string;
  studentJmeno?: string;
  studentPrijmeni?: string;
  studentEmail?: string;
  datumPodani?: string;
  stav: StavPrihlasky;
  poradiVPoradniku?: number | null;
  poznamka?: string | null;
}

export class Prihlaska {
  public readonly id?: string;
  public readonly terminId: string;
  public readonly studentId: string;
  public readonly studentJmeno?: string;
  public readonly studentPrijmeni?: string;
  public readonly studentEmail?: string;
  public readonly datumPodani?: string;
  public readonly stav: StavPrihlasky;
  public readonly poradiVPoradniku: number | null;
  public readonly poznamka: string | null;

  constructor(props: IPrihlaskaProps) {
    this.id = props.id;
    this.terminId = props.terminId;
    this.studentId = props.studentId;
    this.studentJmeno = props.studentJmeno;
    this.studentPrijmeni = props.studentPrijmeni;
    this.studentEmail = props.studentEmail;
    this.datumPodani = props.datumPodani;
    this.stav = props.stav;
    this.poradiVPoradniku = props.poradiVPoradniku ?? null;
    this.poznamka = props.poznamka ?? null;

    this.validate();
  }

  private validate(): void {
    if (!this.terminId) throw new Error("Přihláška musí odkazovat na termín.");
    if (!this.studentId) throw new Error("Přihláška musí odkazovat na studenta.");
    if (this.stav === "PORADNIK" && (this.poradiVPoradniku === null || this.poradiVPoradniku <= 0)) {
      throw new Error("Přihláška v pořadníku musí mít kladné pořadové číslo.");
    }
  }
}

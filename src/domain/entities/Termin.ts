export interface ITerminProps {
  id?: string;
  kurzId: string;
  kurzNazev?: string;
  ucebnaId?: string;
  ucebnaNazev?: string;
  datumOd: string;
  datumDo: string;
  kapacita: number;
  stav?: string;
  potvrzenoPocet?: number;
  poradnikPocet?: number;
}

export class Termin {
  public readonly id?: string;
  public readonly kurzId: string;
  public readonly kurzNazev?: string;
  public readonly ucebnaId?: string;
  public readonly ucebnaNazev?: string;
  public readonly datumOd: string;
  public readonly datumDo: string;
  public readonly kapacita: number;
  public readonly stav: string;
  public readonly potvrzenoPocet: number;
  public readonly poradnikPocet: number;

  constructor(props: ITerminProps) {
    this.id = props.id;
    this.kurzId = props.kurzId;
    this.kurzNazev = props.kurzNazev;
    this.ucebnaId = props.ucebnaId;
    this.ucebnaNazev = props.ucebnaNazev;
    this.datumOd = props.datumOd;
    this.datumDo = props.datumDo;
    this.kapacita = props.kapacita;
    this.stav = props.stav || "NAPLANOVAN";
    this.potvrzenoPocet = props.potvrzenoPocet || 0;
    this.poradnikPocet = props.poradnikPocet || 0;

    this.validate();
  }

  private validate(): void {
    if (!this.kurzId) throw new Error("Termín musí mít přiřazený kurz.");
    if (!this.datumOd || !this.datumDo) throw new Error("Termín musí mít datum od a datum do.");
    if (new Date(this.datumOd) > new Date(this.datumDo)) {
      throw new Error("Datum začátku termínu nesmí být po datu konce.");
    }
    if (!Number.isInteger(this.kapacita) || this.kapacita <= 0) {
      throw new Error("Kapacita termínu musí být kladné celé číslo.");
    }
  }

  public get jePlno(): boolean {
    return this.potvrzenoPocet >= this.kapacita;
  }
}

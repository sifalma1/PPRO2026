export interface CreateKurzDto {
  nazev: string;
  anotace: string;
  rozsahHodin: number;
  cena: number;
  jeAkreditovany: boolean;
}

export interface UpdateKurzDto {
  nazev?: string;
  anotace?: string;
  rozsahHodin?: number;
  cena?: number;
  jeAkreditovany?: boolean;
}

export interface KurzResponseDto {
  id: string;
  nazev: string;
  anotace: string;
  rozsahHodin: number;
  cena: number;
  jeAkreditovany: boolean;
  createdAt: string;
  updatedAt: string;
}

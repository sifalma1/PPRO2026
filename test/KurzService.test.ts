import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Kurz } from "../src/domain/entities/Kurz.js";
import { IKurzRepository } from "../src/domain/repositories/IKurzRepository.js";
import { KurzService } from "../src/application/services/KurzService.js";

/**
 * In-memory mock repozitář pro izolované unit testy
 */
class InMemoryKurzRepository implements IKurzRepository {
  private items: Kurz[] = [];

  constructor(initialItems: Kurz[] = []) {
    this.items = [...initialItems];
  }

  async findAll(filter?: { jeAkreditovany?: boolean; query?: string }): Promise<Kurz[]> {
    return this.items.filter(k => {
      if (filter?.jeAkreditovany !== undefined && k.jeAkreditovany !== filter.jeAkreditovany) {
        return false;
      }
      if (filter?.query) {
        const q = filter.query.toLowerCase();
        return k.nazev.toLowerCase().includes(q) || k.anotace.toLowerCase().includes(q);
      }
      return true;
    });
  }

  async findById(id: string): Promise<Kurz | null> {
    return this.items.find(k => k.id === id) || null;
  }

  async create(kurz: Kurz): Promise<Kurz> {
    const created = new Kurz({
      ...kurz,
      id: "mock-uuid-" + (this.items.length + 1),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.items.push(created);
    return created;
  }

  async update(id: string, kurz: Kurz): Promise<Kurz | null> {
    const idx = this.items.findIndex(k => k.id === id);
    if (idx === -1) return null;
    const updated = new Kurz({
      ...kurz,
      id,
      createdAt: this.items[idx].createdAt,
      updatedAt: new Date()
    });
    this.items[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.items.findIndex(k => k.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }
}

describe("KurzService a Kurz Entity (Unit Testy)", () => {
  test("Úspěšné vytvoření kurzu se správnými parametry", async () => {
    const repo = new InMemoryKurzRepository();
    const service = new KurzService(repo);

    const result = await service.createKurz({
      nazev: "Testovací kurz programování",
      anotace: "Anotace kurzu s dostatečnou délkou textu pro validaci.",
      rozsahHodin: 40,
      cena: 9900,
      jeAkreditovany: true
    });

    assert.ok(result.id);
    assert.strictEqual(result.nazev, "Testovací kurz programování");
    assert.strictEqual(result.rozsahHodin, 40);
    assert.strictEqual(result.cena, 9900);
    assert.strictEqual(result.jeAkreditovany, true);
  });

  test("Vyhození chyby při příliš krátkém názvu kurzu", async () => {
    const repo = new InMemoryKurzRepository();
    const service = new KurzService(repo);

    await assert.rejects(
      async () => {
        await service.createKurz({
          nazev: "AB", // < 3 znaky
          anotace: "Dlouhá anotace splňující limit délky znaků.",
          rozsahHodin: 20,
          cena: 5000,
          jeAkreditovany: false
        });
      },
      { message: "Název kurzu musí mít délku mezi 3 a 150 znaky." }
    );
  });

  test("Vyhození chyby při nekladném rozsahu hodin", async () => {
    const repo = new InMemoryKurzRepository();
    const service = new KurzService(repo);

    await assert.rejects(
      async () => {
        await service.createKurz({
          nazev: "Kurz s nulovým rozsahem",
          anotace: "Dlouhá anotace splňující limit délky znaků.",
          rozsahHodin: 0,
          cena: 5000,
          jeAkreditovany: false
        });
      },
      { message: "Hodinový rozsah kurzu musí být kladné celé číslo větší než 0." }
    );
  });

  test("Vyhození chyby při záporné ceně kurzu", async () => {
    const repo = new InMemoryKurzRepository();
    const service = new KurzService(repo);

    await assert.rejects(
      async () => {
        await service.createKurz({
          nazev: "Kurz se zápornou cenou",
          anotace: "Dlouhá anotace splňující limit délky znaků.",
          rozsahHodin: 20,
          cena: -150,
          jeAkreditovany: false
        });
      },
      { message: "Cena kurzu nesmí být záporné číslo." }
    );
  });

  test("Filtrování kurzů podle akreditace a vyhledávacího dotazu", async () => {
    const repo = new InMemoryKurzRepository();
    const service = new KurzService(repo);

    await service.createKurz({
      nazev: "Python pro začátečníky",
      anotace: "Základní seznámení se syntaxí a knihovnami.",
      rozsahHodin: 20,
      cena: 4000,
      jeAkreditovany: false
    });

    await service.createKurz({
      nazev: "Účetnictví v praxi",
      anotace: "Akreditovaný kurz podvojného účetnictví MŠMT.",
      rozsahHodin: 80,
      cena: 12000,
      jeAkreditovany: true
    });

    const all = await service.getAllKurzy();
    assert.strictEqual(all.length, 2);

    const akreditovane = await service.getAllKurzy({ jeAkreditovany: true });
    assert.strictEqual(akreditovane.length, 1);
    assert.strictEqual(akreditovane[0].nazev, "Účetnictví v praxi");

    const pythonSearch = await service.getAllKurzy({ query: "Python" });
    assert.strictEqual(pythonSearch.length, 1);
    assert.strictEqual(pythonSearch[0].nazev, "Python pro začátečníky");
  });

  test("Aktualizace existujícího kurzu", async () => {
    const repo = new InMemoryKurzRepository();
    const service = new KurzService(repo);

    const created = await service.createKurz({
      nazev: "Původní název kurzu",
      anotace: "Původní anotace kurzu pro testování.",
      rozsahHodin: 30,
      cena: 6000,
      jeAkreditovany: false
    });

    const updated = await service.updateKurz(created.id, {
      nazev: "Nový upravený název kurzu",
      cena: 7500
    });

    assert.strictEqual(updated.nazev, "Nový upravený název kurzu");
    assert.strictEqual(updated.cena, 7500);
    assert.strictEqual(updated.rozsahHodin, 30); // zůstalo zachováno
  });

  test("Smazání kurzu a kontrola, že již nelze dohledat", async () => {
    const repo = new InMemoryKurzRepository();
    const service = new KurzService(repo);

    const created = await service.createKurz({
      nazev: "Kurz ke smazání",
      anotace: "Anotace kurzu, který bude následně smazán.",
      rozsahHodin: 10,
      cena: 2000,
      jeAkreditovany: false
    });

    const deleted = await service.deleteKurz(created.id);
    assert.strictEqual(deleted, true);

    await assert.rejects(
      async () => await service.getKurzById(created.id),
      /nebyl nalezen/
    );
  });
});

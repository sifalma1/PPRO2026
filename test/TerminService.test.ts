import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Termin } from "../src/domain/entities/Termin.js";
import { Prihlaska } from "../src/domain/entities/Prihlaska.js";

describe("Termin a Prihlaska Entity & Pořadník (Unit Testy)", () => {
  test("Platné vytvoření termínu s kapacitou", () => {
    const termin = new Termin({
      kurzId: "kurz-123",
      datumOd: "2026-11-01",
      datumDo: "2026-11-20",
      kapacita: 15,
      potvrzenoPocet: 10,
      poradnikPocet: 0
    });

    assert.strictEqual(termin.kapacita, 15);
    assert.strictEqual(termin.jePlno, false);
  });

  test("Detekce plného termínu (kapacita dosažena)", () => {
    const termin = new Termin({
      kurzId: "kurz-123",
      datumOd: "2026-11-01",
      datumDo: "2026-11-20",
      kapacita: 5,
      potvrzenoPocet: 5,
      poradnikPocet: 2
    });

    assert.strictEqual(termin.jePlno, true);
  });

  test("Vyhození chyby pokud datum konce předchází datu začátku", () => {
    assert.throws(() => {
      new Termin({
        kurzId: "kurz-123",
        datumOd: "2026-12-01",
        datumDo: "2026-11-01",
        kapacita: 10
      });
    }, { message: "Datum začátku termínu nesmí být po datu konce." });
  });

  test("Vyhození chyby při nekladné kapacitě termínu", () => {
    assert.throws(() => {
      new Termin({
        kurzId: "kurz-123",
        datumOd: "2026-11-01",
        datumDo: "2026-11-10",
        kapacita: 0
      });
    }, { message: "Kapacita termínu musí být kladné celé číslo." });
  });

  test("Vytvoření přihlášky v pořadníku vyžaduje kladné pořadové číslo", () => {
    const prihlaska = new Prihlaska({
      terminId: "termin-1",
      studentId: "student-1",
      stav: "PORADNIK",
      poradiVPoradniku: 1
    });

    assert.strictEqual(prihlaska.stav, "PORADNIK");
    assert.strictEqual(prihlaska.poradiVPoradniku, 1);

    assert.throws(() => {
      new Prihlaska({
        terminId: "termin-1",
        studentId: "student-2",
        stav: "PORADNIK",
        poradiVPoradniku: 0 // neplatné pořadí
      });
    }, { message: "Přihláška v pořadníku musí mít kladné pořadové číslo." });
  });
});

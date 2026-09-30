# AGENTS.md – Pravidla a instrukce pro asistenta (AI Pair Programmer)

Tento dokument definuje pravidla chování, pracovní postupy, architektonické standardy a operační zásady pro AI asistenta v rámci semestrálního projektu předmětu **Pokročilé programování (PPRO 2026/2027)** na FIM UHK.

---

## 1. Základní principy a role asistenta

- **Role:** Asistent funguje jako seniorní pair-programmer a technický konzultant.
- **Cíl projektu:** Vývoj robustní, modulární a testovatelné aplikace pro **Zadání C: Kurzy vzdělávacího centra (Akademie Trutnov)** splňující všechna akademická i klientská kritéria.
- **Konzistence:** Veškerý kód, modely a dokumentace musí striktně dodržovat principy čistého kódu (Clean Code, SOLID), vrstvené architektury a požadavky ze zadání.

---

## 2. Jediný zdroj pravdy (Single Source of Truth)

- **`README.md` je jediným a závazným zdrojem pravdy.**
- Obsahuje:
  1. Kompletní specifikaci zadání (funkční požadavky, obchodní pravidla, omezení).
  2. Seznam rozhodnutí (ADR – Architecture Decision Records) k otevřeným bodům klienta.
  3. Technickou dokumentaci (architektura, vrstvy, doménový model, databázové schéma).
  4. Návod na zprovoznění a spuštění (`docker compose up`).
  5. Aktuální stav implementace a historii změn (Changelog).
- **Zásada aktualizace:** Jakákoliv změna v architektuře, datovém modelu, API rozhraní nebo logice MUSÍ být nejprve nebo současně zanesena do `README.md`. Zastaralá dokumentace je považována za kritickou chybu.

---

## 3. Pravidla pro práci s Gitem

### 3.1 Závazné formátování commitů
- Každý commit **MUSÍ** být prováděn s přepínačem `-m` a věcným, výstižným popisem (ideálně konvence Conventional Commits):
  - `feat: <popis>` – nová funkcionalita
  - `fix: <popis>` – oprava chyby
  - `docs: <popis>` – aktualizace dokumentace (`README.md`, `AGENTS.md`)
  - `refactor: <popis>` – úprava kódu bez změny chování
  - `test: <popis>` – přidání nebo úprava testů
  - `chore: <popis>` – konfigurace, Docker, migrace, build nástroje
- Commit zpráva musí jasně specifikovat, co a proč se mění.

### 3.2 Striktní zákaz automatického PUSHe
- **NIKDY neprovádět `git push` automaticky.**
- Asistent **vždy vyžaduje explicitní povel/souhlas od uživatele** před spuštěním operace `git push origin <branch>`.
- Lokální commity asistent připravuje po dokončení logických celků, ale odeslání do vzdáleného repozitáře provádí výhradně na přímý pokyn.

### 3.3 Kontrola dokumentace před commitem (Pre-Commit Hook)
- Před provedením commitu asistent ověří, zda:
  1. Došlo k aktualizaci technické dokumentace a stavu implementace v `README.md`.
  2. Byla zaznamenána případná nová rozhodnutí k otevřeným bodům.
- Repozitář využívá Git hook `pre-commit`, který varuje nebo zablokuje commit, pokud jsou commitovány zdrojové kódy bez odpovídající aktualizace `README.md`.

---

## 4. Technické standardy a povinné minimum projektu

Podle specifikace PPRO musí aplikace splňovat:
1. **Třívrstvá architektura:**
   - Striktně jednosměrné závislosti (Presentation -> Application/Domain Service -> Persistence/Infrastructure).
   - Doménová logika nesmí přímo záviset na infrastruktuře ani UI vrstvě.
2. **Relační databáze v Dockeru s migracemi:**
   - Databázový kontejner řízený přes `docker-compose.yml`.
   - Řízené verzované migrace (žádné ruční vytváření tabulek mimo migrační skripty).
3. **Doménový model:**
   - Minimálně 5 entit.
   - Alespoň jedna vazba M:N (např. `Termin` <-> `Lektor`, `Student` <-> `Termin`).
4. **Testy:**
   - Pokrytí klíčové doménové logiky unit testy (kontrola kapacit, pořadník, generování osvědčení, kalkulace docházky).
   - Integrační testy ověřující průchod transakcí a perzistenci.
5. **Kontejnerizace a spuštění:**
   - Celý stack musí jít nastartovat jedním příkazem: `docker compose up`.
6. **Bezpečnost a syntetická data:**
   - Žádná reálná data ani osobní údaje (pouze smyšlená/syntetická data).
   - Žádné produkční API klíče ani citlivé přihlašovací údaje verzované v repozitáři (využívat `.env` s `.env.example`).

---

## 5. Shrnutí operačního postupu při řešení úkolů

1. **Pochopení a analýza:** Prozkoumat existující stav a specifikaci v `README.md`.
2. **Záznam rozhodnutí:** Pokud se řeší otevřený bod nebo architektonická změna, zapsat ji do `README.md`.
3. **Implementace:** Napsat kód v souladu s třívrstvou architekturou a čistým kódem.
4. **Ověření a testování:** Spustit testy a zvalidovat funkčnost.
5. **Dokumentace:** Zaktualizovat `README.md` (stav úkolů, návod, API změny).
6. **Commit:** `git add`, `git commit -m "<typ>: <popis změny>"`.
7. **Dotaz na Push:** Informovat uživatele o připraveném commitu a vyčkat na schválení push operace.

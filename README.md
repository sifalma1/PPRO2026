# Informační systém pro vzdělávací centrum (Akademie Trutnov)
> **Předmět:** Pokročilé programování (PPRO), ZS 2026/2027  
> **Semestrální projekt:** Zadání C – Kurzy vzdělávacího centra  
> **Klient:** Ing. Lucie Bartošová, Akademie Trutnov  
> **Status dokumentu:** Jediný zdroj pravdy (Single Source of Truth – technická dokumentace a zadání)

---

## Obsah
1. [Kontext a specifikace klienta](#1-kontext-a-specifikace-klienta)
2. [Otevřené body a Seznam rozhodnutí (ADR)](#2-otevřené-body-a-seznam-rozhodnutí-adr)
3. [Architektura a technický návrh](#3-architektura-a-technický-návrh)
4. [Doménový a datový model](#4-doménový-a-datový-model)
5. [Infrastruktura a spuštění projektu](#5-infrastruktura-a-spuštění-projektu)
6. [Testovací strategie](#6-testovací-strategie)
7. [Stav implementace a Roadmapa](#7-stav-implementace-a-roadmapa)

---

## 1. Kontext a specifikace klienta

### 1.1 Výchozí stav (Jak to v Akademii Trutnov funguje dnes)
Akademie Trutnov pořádá přibližně 40 rekvalifikačních a firemních kurzů ročně za účasti externích lektorů. Aktuální agenda je vedena manuálně:
- Zájemci se hlásí webovým formulářem do e-mailu, odkud jsou přihlášky ručně přepisovány do excelové tabulky (jedna záložka na kurz).
- Kapacity kurzů jsou hlídány pouze od oka. Pořadník náhradníků je řešen poznámkami tužkou na okraji papíru.
- Když účastník na poslední chvíli odřekne, recepce ztrácí čas zjišťováním, kdo je první na řadě.
- Osvědčení o absolvování jsou ručně připravována v MS Wordu. Čísla osvědčení jsou odvozována ručním čítáním, což již v minulosti vedlo k vystavení duplicitních čísel certifikátů.

### 1.2 Funkční požadavky klienta
1. **Evidence kurzů:** Název, textová anotace, hodinový rozsah, základní cena, příznak akreditace MŠMT/MPSV.
2. **Termíny kurzů:** Jeden kurz se opakuje vícekrát ročně. Termín má přesné datum od–do, místo konání (učebnu) a kapacitu odvozenou od parametrů učebny.
3. **Lektoři a jejich přiřazení:** Evidence externích lektorů. Lektor může vést více termínů, na delších kurzech se mohou střídat dva i více lektorů.
4. **Přihlášky studentů na termín:** Student se může zapsat na více kurzů, na daném termínu je zapsáno více studentů.
5. **Kapacita a pořadník (Waiting list):**
   - Po naplnění kapacity termínu jsou další zájemci automaticky zařazeni do pořadníku s přesnou evidencí pořadí.
   - Při uvolnění kapacity (zrušení přihlášky) je ihned jasné, kdo je první na řadě.
6. **Evidence docházky:** Záznam účasti studentů na jednotlivých výukových dnech vícedenních termínů.
7. **Dokončení kurzu a osvědčení:**
   - Uzavření termínu a vygenerování seznamu absolventů.
   - Vystavení osvědčení s garantovaně unikátním evidenčním číslem a datem vydání.
8. **Analytické přehledy:**
   - Vytížení a procentuální naplněnost termínů.
   - Sumář odučených hodin za jednotlivé lektory.
   - Přehled studentů přihlášených na více než jeden kurz v daném roce.

### 1.3 Obchodní pravidla (Na čem klient trvá)
- **Striktní strop kapacity:** Kapacitu termínu nelze za žádných okolností překročit (žádný overbooking).
- **Integrita pořadníku:** Pořadí zájemců v pořadníku se nesmí přeskakovat.
- **Unikátnost osvědčení:** Číslo osvědčení musí být v rámci celého systému unikátní. Již vydané osvědčení je neměnné (auditní stopa).
- **Nemažeme historii:** Zrušená přihláška se fyzicky z databáze nemaže; zůstává dohledatelná ve stavu `ZRUSENA` včetně časového razítka a důvodu zrušení.

### 1.4 Vedlejší požadavky a výhled
- Architektura musí být připravena na budoucí modul fakturace (oddělený kontext).
- Jednoduché a přehledné uživatelské rozhraní vhodné i pro lektory bez vysoké počítačové gramotnosti.
- Příprava pro budoucí automatické e-mailové notifikace.

---

## 2. Otevřené body a Seznam rozhodnutí (ADR)

Následující tabulka a rozhodnutí řeší nejasnosti a protichůdné představy zadavatele:

| # | Otevřený bod klienta | Klíčové dilema | Přijaté architektonické rozhodnutí |
|---|---|---|---|
| **ADR-01** | **Kdo rozhoduje o dokončení kurzu** | 70% docházka vs. subjektivní posouzení lektorem | **Hybridní model s pravidlem 70 % + veto/výjimka lektora:** Systém automaticky kvalifikuje studenta při dosažení alespoň 70% účasti. Lektor má možnost udělit výjimku (při 60–69 % s písemným odůvodněním) nebo naopak neudělit zápočet z odborných důvodů. |
| **ADR-02** | **Posun z pořadníku při uvolnění místa** | Zcela automatický zápis vs. manuální potvrzování | **Notifikační okno 24 hodin s automatickým propadem:** Uvolněné místo je rezervováno prvnímu náhradníkovi po dobu 24 hodin, kdy může potvrdit zájem online nebo telefonicky přes recepci. Pokud nepotvrdí, nabídka přechází na dalšího v pořadí. |
| **ADR-03** | **Souběh termínů téhož kurzu** | Možnost podat přihlášku na dva termíny naráz | **Zákaz souběhu aktivních přihlášek:** Student může mít v jednom okamžiku na stejný kurz pouze jednu platnou (potvrzenou) přihlášku. Je však povoleno být zapsán v pořadníku na jiný termín pro případ, že první termín bude zrušen. |
| **ADR-04** | **Přihlášení studenta po zahájení kurzu** | Pravidlo „nejde to“ vs. neformální výjimky | **Řízená výjimka administrátora do 20 % dotace:** Po zahájení kurzu je standardní registrace uzamčena. Dodatečný zápis smí provést pouze recepce/administrátor s označením výjimky, a to maximálně do proběhnutí 20 % hodinové dotace, aby bylo reálné splnit 70% docházku. |
| **ADR-05** | **Jeden lektor vs. více lektorů na termínu** | Střídání lektorů vs. agregace hodin na lektora | **Rozpad termínu na výukové dny s vazbou M:N:** Termín se skládá z jednotlivých výukových dnů/bloků, z nichž každý má přiřazeného konkrétního lektora. Přehledy pak agregují skutečně odučené hodiny přes tyto dílčí bloky naprosto přesně. |

---

## 3. Architektura a technický návrh

Projekt je navržen v souladu s pravidly předmětu **PPRO** jako modulární třívrstvá aplikace s jednosměrnými závislostmi.

```mermaid
graph TD
    UI[Prezentační vrstva<br/>REST API / Controllers / Web UI] --> APP[Aplikační & Doménová vrstva<br/>Services, Validace kapacit, Pořadník, Certifikace]
    APP --> DATA[Perzistentní vrstva<br/>Entity, Repositories, Migrace]
    DATA --> DB[(Relační databáze v Dockeru<br/>PostgreSQL)]
```

### 3.1 Vrstvy aplikace
1. **Prezentační vrstva:**
   - Obsluhuje HTTP požadavky, validuje vstupní DTO a zprostředkovává REST rozhraní / UI.
   - Neobsahuje žádnou doménovou logiku ani přímé dotazy do databáze.
2. **Aplikační a doménová vrstva:**
   - Zajišťuje byznys procesy: zařazování do pořadníku, atomické rezervace bez překročení kapacity, kalkulaci docházky a generování unikátních čísel certifikátů.
   - Je nezávislá na konkrétním databázovém enginu a prezentačním frameworku.
3. **Perzistentní vrstva:**
   - Implementuje repozitáře pro ukládání entit.
   - Zajišťuje transakční integritu a spouštění verzovaných migrací.

---

## 4. Doménový a datový model

Systém pokrývá minimálně 7 klíčových entit s bohatými relacemi včetně vazeb M:N.

```mermaid
erDiagram
    KURZ ||--o{ TERMIN : "má vypsané"
    UCEBNA ||--o{ TERMIN : "hostí"
    TERMIN ||--|{ VYUKOVY_DEN : "skládá se z"
    LEKTOR ||--o{ VYUKOVY_DEN : "vyučuje"
    TERMIN ||--o{ TERMIN_LEKTOR : "má přiřazené"
    LEKTOR ||--o{ TERMIN_LEKTOR : "garantuje / participuje"
    TERMIN ||--o{ PRIHLASKA : "eviduje"
    STUDENT ||--o{ PRIHLASKA : "podává"
    PRIHLASKA ||--o| OSVEDCENI : "získává"
    VYUKOVY_DEN ||--o{ DOCHAZKA : "zaznamenává"
    STUDENT ||--o{ DOCHAZKA : "má účast"

    KURZ {
        uuid id PK
        string nazev
        text anotace
        int rozsah_hodin
        decimal cena
        boolean je_akreditovany
    }
    UCEBNA {
        uuid id PK
        string nazev
        string adresa
        int maximalni_kapacita
    }
    TERMIN {
        uuid id PK
        uuid kurz_id FK
        uuid ucebna_id FK
        date datum_od
        date datum_do
        int kapacita
        string stav
    }
    LEKTOR {
        uuid id PK
        string jmeno
        string prijmeni
        string email
        string telefon
        string specializace
    }
    TERMIN_LEKTOR {
        uuid termin_id FK
        uuid lektor_id FK
        string role
    }
    STUDENT {
        uuid id PK
        string jmeno
        string prijmeni
        string email
        string telefon
        string organizace
    }
    PRIHLASKA {
        uuid id PK
        uuid termin_id FK
        uuid student_id FK
        datetime datum_podani
        string stav "POTVRZENA | PORADNIK | ZRUSENA | DOKONCENA"
        int poradi_v_poradniku
        datetime cas_nabidky_z_poradniku
    }
    VYUKOVY_DEN {
        uuid id PK
        uuid termin_id FK
        uuid lektor_id FK
        date datum
        int pocet_hodin
        string tema
    }
    DOCHAZKA {
        uuid id PK
        uuid vyukovy_den_id FK
        uuid student_id FK
        boolean pritomen
        string poznamka
    }
    OSVEDCENI {
        uuid id PK
        uuid prihlaska_id FK
        string cislo_osvedceni UK "AT-YYYY-XXXX"
        date datum_vydani
        decimal procento_dochazky
    }
```

---

---

## 5. Infrastruktura a spuštění projektu

### 5.1 Použitý technologický stack
- **Běhové prostředí:** Node.js (TypeScript, ES Modules, `strict` mode)
- **Prezentační vrstva:** Express REST API + responzivní Web UI (Vanilla CSS s moderní estetikou, flexbox/grid, Google Fonts Outfit, čisté vektorové SVG ikony namísto nesystémových emoji)
- **Aplikační vrstva:** Doménové služby (`KurzService`), DTOs a striktní validace invariantů
- **Perzistentní vrstva:** PostgreSQL 16 (přes `pg` connection pool), verzované SQL migrace
- **Kontejnerizace:** Docker & Docker Compose

### 5.2 Lokální spuštění v Dockeru (doporučeno pro klienta a obhajobu)
Celý stack (databáze + migrace + webová aplikace) se spouští jediným příkazem:
```bash
docker compose up --build
```
Aplikace bude následně dostupná:
- **Webový katalog pro klienta:** [http://localhost:3000](http://localhost:3000)
- **REST API rozhraní:** [http://localhost:3000/api/kurzy](http://localhost:3000/api/kurzy)
- **Health check:** [http://localhost:3000/health](http://localhost:3000/health)

### 5.3 Lokální vývojové spuštění (bez Dockeru)
1. Spuštění PostgreSQL databáze na portu 5432 (dle konfigurace v `.env`).
2. Instalace závislostí a spuštění:
```bash
npm install
npm run migrate   # aplikuje migrace ze složky migrations/
npm run dev       # spustí aplikaci ve sledovacím režimu
```

### 5.4 REST API rozhraní entity Kurz
| Metoda | Endpoint | Popis |
|---|---|---|
| `GET` | `/api/kurzy` | Seznam všech kurzů (volitelné query parametry: `?akreditovany=true\|false&search=dotaz`) |
| `GET` | `/api/kurzy/:id` | Detail vybraného kurzu podle UUID |
| `POST` | `/api/kurzy` | Vytvoření nového kurzu s validací polí |
| `PUT` | `/api/kurzy/:id` | Aktualizace parametrů kurzu |
| `DELETE` | `/api/kurzy/:id` | Smazání kurzu |

---

## 6. Testovací strategie

1. **Unit testy (`npm test`):**
   - Spouštěny pomocí nativního Node test runneru (`node --test`).
   - Pokrývají doménová validační pravidla entity `Kurz` a službu `KurzService`:
     - Ochrana proti neplatné délce názvu (< 3 a > 150 znaků).
     - Validace kladné hodinové dotace (> 0).
     - Zákaz záporné ceny kurzu.
     - Správnost dynamického filtrování a vyhledávání.
     - Konzistence aktualizace a mazání kurzů.
2. **Integrační testy:**
   - Transakční integrita perzistence v PostgreSQL.
   - Aplikační migrace `001_create_kurzy.sql` a `002_seed_kurzy.sql`.

---

## 7. Stav implementace a Roadmapa

- [x] Inicializace Git repozitáře a propojení s GitHub `sifalma1/PPRO2026`
- [x] Vytvoření pravidel vývoje a chování asistenta ([AGENTS.md](file:///c:/Users/skitt/Documents/PPRO/AGENTS.md))
- [x] Zpracování zadání C a definice architektonických rozhodnutí (ADR) v [README.md](file:///c:/Users/skitt/Documents/PPRO/README.md)
- [x] Nastavení Git hooku pro kontrolu dokumentace před commitem
- [x] **Demo fáze – Správa entity Kurz (`Course`):**
  - [x] Třívrstvá architektura (Presentation, Application, Infrastructure/Persistence)
  - [x] Databázové schéma a verzované migrace (`migrations/001_create_kurzy.sql`, `migrations/002_seed_kurzy.sql`)
  - [x] Dockerfile a `docker-compose.yml` s PostgreSQL kontejnerem
  - [x] Aplikační vrstva s doménovou validací a DTOs
  - [x] REST API kontroler a router
  - [x] Moderní klientské webové UI pro paní Bartošovou (katalog, odznaky akreditace, filtry, formulář, statistiky)
  - [x] Sada unit testů pro byznys pravidla (`npm test` – 7 testů prošlo)
- [ ] **Rozšíření po klientském schválení dema:**
  - [ ] Entita `Ucebna` a `Termin` kurzu s hlídáním kapacity
  - [ ] Entita `Lektor` a přiřazení k termínům (vazba M:N)
  - [ ] Entita `Student` a `Prihlaska` s logikou pořadníku (Waiting list)
  - [ ] Evidence docházky a výpočet 70% pravidla pro generování `Osvedceni`


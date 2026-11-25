# Dokumentace semestrálního projektu – Pokročilé programování (PPRO)

> **Předmět:** Pokročilé programování (PPRO), zimní semestr 2026/2027  
> **Instituce:** Fakulta informatiky a managementu, Univerzita Hradec Králové

---

### Základní identifikační údaje

| Položka                   | Hodnota                                                                      |
| :------------------------ | :--------------------------------------------------------------------------- |
| **Název projektu**        | Informační systém pro vzdělávací centrum (Akademie Trutnov)                  |
| **Zvolené zadání**        | Zadání C – Kurzy vzdělávacího centra                                         |
| **Jméno a příjmení**      | Marek Šifalda                                                                |
| **Repozitář na GitHubu**  | [https://github.com/sifalma1/PPRO2026](https://github.com/sifalma1/PPRO2026) |
| **Datum poslední úpravy** | 23. 11. 2026                                                                 |

---

## 1. Popis řešení

Aplikace představuje komplexní informační systém pro vzdělávací centrum **Akademie Trutnov**, které ročně pořádá přibližně 40 rekvalifikačních, firemních a odborných kurzů za účasti interních i externích odborných lektorů. Systém nahrazuje původní neudržitelnou praxi manuálního přepisování přihlášek z e-mailů do nepřehledných excelových tabulek, papírové vedení čekací listiny náhradníků a ruční generování osvědčení ve wordových šablonách, jež v minulosti vedlo k finančním ztrátám z propadlých míst a duplicitám v evidenci certifikátů.

Aplikace komplexně pokrývá celý životní cyklus vzdělávací agendy:

- **Evidence kurzů a vypsaných termínů:** Katalog vzdělávacích programů (včetně akreditovaných rekvalifikací MPSV/MŠMT a bezplatných úvodních workshopů) a plánování termínů v návaznosti na konkrétní učebny a jejich maximální kapacity.
- **Kapacita a atomický pořadník (ADR-02):** Striktní strop kapacity bez možnosti overbookingu. Při naplnění termínu jsou další zájemci automaticky řazeni do fronty náhradníků. Pokud potvrzený student odřekne účast, databázová transakce s řádkovým zamykáním (`SELECT ... FOR UPDATE`) okamžitě povýší prvního náhradníka a posune celou frontu dopředu bez nutnosti manuálního zásahu personálu.
- **Více lektorů a rozpad na výukové dny (ADR-05):** Podpora vícedenních bloků a střídání lektorů na kurzu (vazba M:N), detailní evidence prezence studentů na jednotlivých dnech a přesné analytické podklady pro měsíční fakturaci lektorů.
- **Kritéria dokončení a certifikace (ADR-01):** Automatické vyhodnocení docházky vůči normě 70 % s možností lektorské výjimky (s povinným písemným odůvodněním) a vystavování celosvětově unikátních osvědčení formátu `AT-YYYY-XXXX` garantovaných atomickou databázovou sekvencí.
- **Zabezpečení a RBAC (ADR-07):** Striktní oddělení rolí (Administrátor, Student, Anonymní návštěvník). Anonymní návštěvníci vidí pouze obsazenost, osobní kontakty jsou skryty dle GDPR. Student má k dispozici klientský portál a může zapsat/stornovat pouze sám sebe. Administrátor má k dispozici plnou správu, manažerské analytické dashboardy a rychlý výběrovník studentů.

### Technická architektura systému

Aplikace je navržena jako robustní třívrstvá webová architektura se striktně jednosměrnými závislostmi:

1. **Prezentační vrstva:** Single Page Application postavená na moderním bundleru Vite, TypeScriptu a Tailwind CSS. Nabízí plně responzivní rozhraní pro desktop i mobilní zařízení, přepínání světlého a tmavého režimu a ergonomické rozdělení typografie (prestižní titulní font Cinzel v kombinaci s ultra-čitelným funkčním fontem Inter a neproporcionálním JetBrains Mono).
2. **Aplikační a doménová vrstva:** REST API v Node.js (Express framework) a TypeScriptu. Zahrnuje 9 bohatých doménových entit a 4 aplikační služby (`CourseService`, `TermService`, `AttendanceService`, `CertificateService`) s transakčním řízením operací a ověřováním rolí.
3. **Perzistentní vrstva:** Relační databáze PostgreSQL 16 v Docker kontejneru s řízenými verzovanými migracemi (001–005), 19 cizími klíči s kaskádní integritou a 38 výkonnostními indexy. Celý stack se spouští jediným příkazem `docker compose up`. Spolehlivost garantuje 203 automatizovaných testů (35 Node + 168 Jest) se 100% úspěšností.

---

## 2. Rozhodnutí

|   Č.    | Rozhodnutí                                                                                        | Důvod                                                                                                                                                                            |    Datum     |
| :-----: | :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------: |
| **R1**  | **Backend v Node.js + TypeScript (Express framework)**                                            | Silná typová kontrola eliminující běhové chyby, nativní práce s JSON REST API, vysoká rychlost asynchronního I/O a jednotný jazyk TypeScript pro backend i frontend.             | 30. 9. 2026  |
| **R2**  | **Databáze PostgreSQL 16 v Dockeru s řízenými migracemi**                                         | Splnění povinného akademického standardu zadání. PostgreSQL poskytuje robustní transakční zamykání (`SELECT FOR UPDATE`) a atomické sekvence pro generování certifikátů.         | 30. 9. 2026  |
| **R3**  | **Třívrstvá architektura se striktně jednosměrnými závislostmi**                                  | Oddělení zodpovědností: Presentation (Express/REST) -> Application/Domain Service -> Infrastructure/Persistence. Doménové entity jsou čisté a nezávislé na frameworku.           | 30. 9. 2026  |
| **R4**  | **Dvoustupňový testovací harness (Node Test Runner + Jest)**                                      | Nativní Node runner zajišťuje bleskový běh izolovaných unit testů domény, zatímco Jest s modulem Supertest pokrývá integrační toky, API aliasy, RBAC a bezpečnost.               | 7. 10. 2026  |
| **R5**  | **Frontend jako Single Page Application ve Vite, TypeScript a Tailwind CSS**                      | Bleskový vývojový cyklus (HMR), okamžité klientské reakce bez reloadu, plná typová integrace a stylizace do autentického fantasy vellum design systému dle `Kurzy-Projekt.webp`. | 14. 10. 2026 |
| **R6**  | **Automatický transakční posun náhradníků v pořadníku (ADR-02)**                                  | Okamžitý atomický posun náhradníka č. 1 na potvrzené místo při stornu zabraňuje finančním ztrátám z propadnutí míst; řádkové zamykání eliminuje souběh a overbooking.            | 14. 10. 2026 |
| **R7**  | **Hybridní model dokončení kurzu: 70 % docházka + lektorská výjimka a kód AT-YYYY-XXXX (ADR-01)** | Kombinace dotačního limitu 70 % s odborným posouzením lektora (písemné odůvodnění min. 5 znaků); atomická DB sekvence garantuje globální unikátnost čísel certifikátů.           | 21. 10. 2026 |
| **R8**  | **Zákaz souběhu aktivních přihlášek na stejný kurz (ADR-03)**                                     | Prevence blokování omezených kapacit; student smí mít na jeden kurz pouze jedno potvrzené místo (`CONFIRMED`), zápis do pořadníku je povolen jako záložní volba.                 | 21. 10. 2026 |
| **R9**  | **Rozpad termínů na výukové dny a vazba M:N pro lektory (ADR-05)**                                | Umožňuje střídání specializovaných lektorů na vícedenních kurzech, evidenci prezence na úrovni dnů a přesné analytické podklady pro měsíční fakturaci lektorů.                   | 28. 10. 2026 |
| **R10** | **Vyhodnocení vhodnosti Strapi CMS – Zamítnuto (ADR-06)**                                         | Standardní headless CMS nepodporovalo specifické transakční posuny náhradníků, validace dotační docházky a runové tabulky bez rozsáhlých nestandardních pluginů.                 | 4. 11. 2026  |
| **R11** | **Role-Based Access Control (RBAC), anonymní politika a ochrana GDPR (ADR-07)**                   | Zabezpečení REST API: student může zapsat a stornovat pouze sám sebe, kontaktní data studentů jsou pro anonymy maskována (GDPR), administrace je chráněna `requireAdminAuth`.    | 11. 11. 2026 |
| **R12** | **Typografická harmonizace rozhraní (Cinzel vs. Inter vs. JetBrains Mono)**                       | Monumentální Cinzel zachován pro heraldická záhlaví, erby a diplomy; funkční UI (tlačítka, tabulky, formuláře, filtry) převedeno na vysoce čitelný Inter s podporou diakritiky.  | 23. 11. 2026 |

---

## 3. Změny požadované klientem

|   Č.    |    Datum     | Požadavek klienta                                                                                                                | Řešení a dopad na návrh                                                                                                                                                |    Stav    |
| :-----: | :----------: | :------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------: |
| **Z1**  | 30. 9. 2026  | „Potřebujeme evidovat kurzy, termíny a kapacity učeben; dříve jsme to dělali v nepřehledném Excelu a ztrácela se nám data.“      | Návrh relačního modelu PostgreSQL v Dockeru, entity `Course` a `CourseTerm`, třívrstvá architektura se striktními validacemi. Viz R1, R2, R3.                          | **hotovo** |
| **Z2**  | 7. 10. 2026  | „Když přihlášený student na poslední chvíli zruší účast, musí na jeho místo automaticky naskočit první náhradník z pořadníku.“   | Implementace transakčního automatu s řádkovým zamykáním `SELECT FOR UPDATE` (ADR-02), atomické povýšení náhradníka #1 a posun celé fronty bez overbookingu. Viz R6.    | **hotovo** |
| **Z3**  | 14. 10. 2026 | „Na vícedenních kurzech se střídají externí lektoři a docházku potřebujeme vést detailně po jednotlivých dnech.“                 | Rozpad termínů na výukové dny `teaching_days`, vazba M:N pro lektory `term_lecturers` a prezenční listina s evidencí odučených hodin pro fakturaci (ADR-05). Viz R9.   | **hotovo** |
| **Z4**  | 21. 10. 2026 | „Osvědčení smí dostat jen student s alespoň 70% účastí, ale lektor má mít právo udělit řádně odůvodněnou výjimku.“               | Hybridní vyhodnocení docházky s validací písemného odůvodnění výjimky (min. 5 znaků), atomický generátor unikátních kódů `AT-YYYY-XXXX` (ADR-01). Viz R7.              | **hotovo** |
| **Z5**  | 21. 10. 2026 | „Jeden student se nesmí hlásit na dva termíny stejného kurzu současně a blokovat tak místa ostatním.“                            | Zavedení byznys pravidla ADR-03 v `TermService`: zákaz duplicitního aktivního zápisu (`CONFIRMED`) na tentýž kurz; čekací listina je povolena jako záloha. Viz R8.     | **hotovo** |
| **Z6**  | 28. 10. 2026 | „Vzhled aplikace nesmí vypadat jako generická korporátní šablona, chceme reprezentativní historický styl Akademie s pergamenem.“ | Návrh fantasy/vellum design systému dle `Kurzy-Projekt.webp`: kamenné zdivo, dřevěné trámy, vellum plátno a runové tabulky s kovanými měřidly. Viz R5.                 | **hotovo** |
| **Z7**  | 4. 11. 2026  | „Ve světlém režimu je vyhledávací lišta a kamenné pozadí příliš tmavé, prosvětlete ho pro lepší denní čitelnost.“                | Projasnění kamenné textury a pergamenového podkladu pro světlý mód, redesign vyhledávací lišty s dynamickými filtry pro světlý i tmavý režim.                          | **hotovo** |
| **Z8**  | 11. 11. 2026 | „V termínech a docházce nemá co dělat text 'adr-02', odstraňte tyto interní vývojářské značky, fialovou barvu a emojis.“         | Kompletní purifikace UI: odstranění všech štítků ADR z klientských pohledů, nahrazení fialové barvy warm bronzem a odstranění emojis u jmen studentů.                  | **hotovo** |
| **Z9**  | 18. 11. 2026 | „Student nesmí mít možnost smazat cizí přihlášku a anonym nesmí vidět osobní kontakty studentů ani administrátorské agendy.“     | Zavedení striktního RBAC (ADR-07): anonym vidí pouze kapacity (kontakty maskovány jako `Účastník #X` dle GDPR), student může zapsat/stornovat pouze sám sebe. Viz R11. | **hotovo** |
| **Z10** | 23. 11. 2026 | „Zápis studenta u administrátora by měl mít výběrovník studentů, co už v aplikaci jsou, ať to nemusíme psát ručně.“              | Implementace rozbalovacího výběrovníku studentů s automatickým předvyplněním údajů z databáze a možností volby nového studenta pro manuální zadání.                    | **hotovo** |
| **Z11** | 23. 11. 2026 | „Koukněte na ten font, zda skutečně všude používat ten monumentální fantasy font.“                                               | Typografická harmonizace: Cinzel ponechán pro erby, tituly a diplomy; funkční UI prvky, tlačítka a tabulky převedeny na vysoce čitelný Inter (`font-sans`). Viz R12.   | **hotovo** |

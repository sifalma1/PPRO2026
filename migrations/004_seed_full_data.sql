-- Migrace 004: Syntetická testovací data pro Učebny, Lektory, Termíny, Studenty a Přihlášky

-- 1. Učebny
INSERT INTO ucebny (id, nazev, adresa, maximalni_kapacita)
VALUES 
    ('11111111-1111-4111-8111-111111111111', 'Počítačová učebna A1', 'Krakonošovo nám. 128, Trutnov (1. patro)', 14),
    ('22222222-2222-4222-8222-222222222222', 'Seminární místnost B2', 'Krakonošovo nám. 128, Trutnov (2. patro)', 20),
    ('33333333-3333-4333-8333-333333333333', 'Velký přednáškový sál', 'Horská 5, Trutnov', 35)
ON CONFLICT (id) DO NOTHING;

-- 2. Lektoři
INSERT INTO lektori (id, jmeno, prijmeni, email, telefon, specializace)
VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Jan', 'Novák', 'novak.lektor@akademietrutnov.cz', '+420 777 123 456', 'Účetnictví, daně, mzdy a podnikové finance'),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Petra', 'Svobodová', 'svobodova@akademietrutnov.cz', '+420 777 234 567', 'Programování v Pythonu, datová analýza, SQL'),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Pavel', 'Černý', 'cerny.marketing@akademietrutnov.cz', '+420 777 345 678', 'Online marketing, sociální sítě a SEO'),
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Helena', 'Dvořáková', 'dvorakova@akademietrutnov.cz', '+420 777 456 789', 'Sociální práce, komunikace a krizová intervence')
ON CONFLICT (id) DO NOTHING;

-- 3. Termíny kurzů
-- Vazby na kurzy z 002_seed_kurzy.sql:
-- b2a3f789-2345-4cde-8901-234567890abc: Účetnictví a daňová evidence
-- c3b4a890-3456-4def-9012-345678901bcd: Python
-- d4c5b901-4567-4ef0-0123-456789012cde: Marketing
-- e5d6c012-5678-4f01-1234-567890123def: Sociální služby
INSERT INTO terminy (id, kurz_id, ucebna_id, datum_od, datum_do, kapacita, stav)
VALUES
    -- Termín 1: Python - kapacita 3 (pro ukázku pořadníku!), naplněno + náhradníci
    ('a1111111-1111-4111-8111-111111111111', 'c3b4a890-3456-4def-9012-345678901bcd', '11111111-1111-4111-8111-111111111111', '2026-11-02', '2026-12-18', 3, 'NAPLANOVAN'),
    -- Termín 2: Účetnictví - kapacita 12, volná místa
    ('a2222222-2222-4222-8222-222222222222', 'b2a3f789-2345-4cde-8901-234567890abc', '22222222-2222-4222-8222-222222222222', '2026-10-15', '2026-12-05', 12, 'PROBIHA'),
    -- Termín 3: Digitální marketing - kapacita 15
    ('a3333333-3333-4333-8333-333333333333', 'd4c5b901-4567-4ef0-0123-456789012cde', '11111111-1111-4111-8111-111111111111', '2026-11-10', '2026-11-25', 15, 'NAPLANOVAN'),
    -- Termín 4: Sociální služby - kapacita 10
    ('a4444444-4444-4444-8444-444444444444', 'e5d6c012-5678-4f01-1234-567890123def', '33333333-3333-4333-8333-333333333333', '2026-12-01', '2027-01-20', 10, 'NAPLANOVAN')
ON CONFLICT (id) DO NOTHING;

-- 4. Přiřazení lektorů k termínům (M:N)
INSERT INTO termin_lektori (termin_id, lektor_id, role)
VALUES
    ('a1111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'hlavni'),
    ('a2222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'hlavni'),
    ('a2222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'asistent'), -- střídání 2 lektorů dle zadání
    ('a3333333-3333-4333-8333-333333333333', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'hlavni'),
    ('a4444444-4444-4444-8444-444444444444', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'hlavni')
ON CONFLICT (termin_id, lektor_id) DO NOTHING;

-- 5. Studenti
INSERT INTO studenti (id, jmeno, prijmeni, email, telefon, organizace)
VALUES
    ('c1111111-1111-4111-8111-111111111111', 'Tomáš', 'Marný', 'tomas.marny@seznam.cz', '+420 603 111 222', 'MěÚ Trutnov'),
    ('c2222222-2222-4222-8222-222222222222', 'Alena', 'Kratochvílová', 'a.kratochvilova@gmail.com', '+420 604 222 333', 'OSVČ'),
    ('c3333333-3333-4333-8333-333333333333', 'Michal', 'Kučera', 'michal.kucera@post.cz', '+420 605 333 444', 'Krkonoše Tech s.r.o.'),
    ('c4444444-4444-4444-8444-444444444444', 'Lenka', 'Burešová', 'lenka.b@centrum.cz', '+420 606 444 555', 'Samoplátce'),
    ('c5555555-5555-4555-8555-555555555555', 'Jakub', 'Veselý', 'jakub.vesely@email.cz', '+420 607 555 666', 'Mladé Buky Ski'),
    ('c6666666-6666-4666-8666-666666666666', 'Kateřina', 'Horáková', 'k.horakova@volny.cz', '+420 608 666 777', 'Nemocnice Trutnov')
ON CONFLICT (id) DO NOTHING;

-- 6. Přihlášky (termín 1 má kapacitu 3; první 3 studenti mají POTVRZENA, 4. a 5. jsou v POŘADNÍKU!)
INSERT INTO prihlasky (id, termin_id, student_id, datum_podani, stav, poradi_v_poradniku, poznamka)
VALUES
    -- Termín Python (kapacita 3) - 3 potvrzené
    ('d1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111', '2026-10-01 08:30:00', 'POTVRZENA', NULL, 'Hradí zaměstnavatel'),
    ('d2222222-2222-4222-8222-222222222222', 'a1111111-1111-4111-8111-111111111111', 'c2222222-2222-4222-8222-222222222222', '2026-10-01 09:15:00', 'POTVRZENA', NULL, 'Dotace ÚP'),
    ('d3333333-3333-4333-8333-333333333333', 'a1111111-1111-4111-8111-111111111111', 'c3333333-3333-4333-8333-333333333333', '2026-10-01 10:00:00', 'POTVRZENA', NULL, 'Vlastní zájemce'),
    -- Termín Python (plno -> Náhradníci v pořadníku dle ADR-02)
    ('d4444444-4444-4444-8444-444444444444', 'a1111111-1111-4111-8111-111111111111', 'c4444444-4444-4444-8444-444444444444', '2026-10-02 11:20:00', 'PORADNIK', 1, 'Čekatel na uvolnění místa'),
    ('d5555555-5555-4555-8555-555555555555', 'a1111111-1111-4111-8111-111111111111', 'c5555555-5555-4555-8555-555555555555', '2026-10-03 14:40:00', 'PORADNIK', 2, 'Druhý náhradník v řadě'),
    -- Termín Účetnictví
    ('d6666666-6666-4666-8666-666666666666', 'a2222222-2222-4222-8222-222222222222', 'c6666666-6666-4666-8666-666666666666', '2026-10-04 10:00:00', 'POTVRZENA', NULL, 'Rekvalifikace MŠMT'),
    ('d7777777-7777-4777-8777-777777777777', 'a2222222-2222-4222-8222-222222222222', 'c1111111-1111-4111-8111-111111111111', '2026-10-05 11:00:00', 'POTVRZENA', NULL, 'Student přihlášen na 2 různé kurzy (Tomáš Marný)')
ON CONFLICT (id) DO NOTHING;

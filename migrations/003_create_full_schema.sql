-- Migrace 003: Rozšíření schématu o Učebny, Lektory, Termíny, Studenty a Přihlášky s pořadníkem

CREATE TABLE IF NOT EXISTS ucebny (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nazev VARCHAR(100) NOT NULL,
    adresa VARCHAR(255) NOT NULL,
    maximalni_kapacita INTEGER NOT NULL CHECK (maximalni_kapacita > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lektori (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jmeno VARCHAR(100) NOT NULL,
    prijmeni VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefon VARCHAR(50),
    specializace VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS terminy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kurz_id UUID NOT NULL REFERENCES kurzy(id) ON DELETE CASCADE,
    ucebna_id UUID REFERENCES ucebny(id) ON DELETE SET NULL,
    datum_od DATE NOT NULL,
    datum_do DATE NOT NULL,
    kapacita INTEGER NOT NULL CHECK (kapacita > 0),
    stav VARCHAR(30) NOT NULL DEFAULT 'NAPLANOVAN', -- 'NAPLANOVAN' | 'PROBIHA' | 'UKONCEN' | 'ZRUSEN'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vazba M:N mezi termíny a lektory (na jednom termínu se mohou střídat)
CREATE TABLE IF NOT EXISTS termin_lektori (
    termin_id UUID NOT NULL REFERENCES terminy(id) ON DELETE CASCADE,
    lektor_id UUID NOT NULL REFERENCES lektori(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'hlavni', -- 'hlavni' | 'asistent' | 'host'
    PRIMARY KEY (termin_id, lektor_id)
);

CREATE TABLE IF NOT EXISTS studenti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jmeno VARCHAR(100) NOT NULL,
    prijmeni VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefon VARCHAR(50),
    organizace VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Přihlášky studentů na termíny včetně pořadníku (Waiting list)
CREATE TABLE IF NOT EXISTS prihlasky (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    termin_id UUID NOT NULL REFERENCES terminy(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES studenti(id) ON DELETE CASCADE,
    datum_podani TIMESTAMPTZ DEFAULT NOW(),
    stav VARCHAR(30) NOT NULL DEFAULT 'POTVRZENA', -- 'POTVRZENA' | 'PORADNIK' | 'ZRUSENA' | 'DOKONCENA'
    poradi_v_poradniku INTEGER DEFAULT NULL,
    poznamka TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexy pro efektivní vyhledávání a řazení v pořadníku
CREATE INDEX IF NOT EXISTS idx_terminy_kurz ON terminy(kurz_id);
CREATE INDEX IF NOT EXISTS idx_prihlasky_termin_stav ON prihlasky(termin_id, stav);
CREATE INDEX IF NOT EXISTS idx_prihlasky_poradnik ON prihlasky(termin_id, poradi_v_poradniku);

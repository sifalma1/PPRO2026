-- Migrace 001: Vytvoření tabulky pro správu kurzů
CREATE TABLE IF NOT EXISTS kurzy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nazev VARCHAR(150) NOT NULL,
    anotace TEXT NOT NULL,
    rozsah_hodin INTEGER NOT NULL CHECK (rozsah_hodin > 0),
    cena NUMERIC(10, 2) NOT NULL CHECK (cena >= 0),
    je_akreditovany BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pro rychlé vyhledávání podle názvu
CREATE INDEX IF NOT EXISTS idx_kurzy_nazev ON kurzy (nazev);

-- Migrace 005: Kompletní přechod na anglické schéma a dokončení celého zadání (Fáze 3: TeachingDays, Attendance, Certificates)

-- 1. Tabulka kurzů (courses)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    annotation TEXT NOT NULL,
    hours INTEGER NOT NULL CHECK (hours > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_accredited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabulka učeben (classrooms)
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabulka lektorů (lecturers)
CREATE TABLE IF NOT EXISTS lecturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(50),
    specialization VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabulka termínů (course_terms)
CREATE TABLE IF NOT EXISTS course_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED', -- 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Vazební tabulka termíny - lektoři (term_lecturers)
CREATE TABLE IF NOT EXISTS term_lecturers (
    term_id UUID NOT NULL REFERENCES course_terms(id) ON DELETE CASCADE,
    lecturer_id UUID NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'lead',
    PRIMARY KEY (term_id, lecturer_id)
);

-- 6. Tabulka studentů (students)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(50),
    organization VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabulka přihlášek (enrollments)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID NOT NULL REFERENCES course_terms(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED', -- 'CONFIRMED' | 'WAITLIST' | 'CANCELLED' | 'COMPLETED'
    waitlist_position INTEGER DEFAULT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabulka výukových dnů (teaching_days) - ADR-05
CREATE TABLE IF NOT EXISTS teaching_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID NOT NULL REFERENCES course_terms(id) ON DELETE CASCADE,
    lecturer_id UUID REFERENCES lecturers(id) ON DELETE SET NULL,
    day_date DATE NOT NULL,
    hours INTEGER NOT NULL CHECK (hours > 0),
    topic VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabulka docházky (attendance) - ADR-01
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teaching_day_id UUID NOT NULL REFERENCES teaching_days(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    is_present BOOLEAN NOT NULL DEFAULT TRUE,
    note VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (teaching_day_id, student_id)
);

-- 10. Tabulka osvědčení / certifikátů (certificates) - ADR-01 (AT-YYYY-XXXX)
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES course_terms(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    attendance_rate NUMERIC(5, 2) NOT NULL,
    has_waiver BOOLEAN NOT NULL DEFAULT FALSE,
    waiver_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Čítač sekvence osvědčení pro garantovanou unikátnost čísla certifikátu
CREATE TABLE IF NOT EXISTS certificate_counter (
    year INTEGER PRIMARY KEY,
    last_seq INTEGER NOT NULL DEFAULT 0
);

-- Indexy
CREATE INDEX IF NOT EXISTS idx_courses_title ON courses (title);
CREATE INDEX IF NOT EXISTS idx_terms_course ON course_terms (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_term_status ON enrollments (term_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_waitlist ON enrollments (term_id, waitlist_position);
CREATE INDEX IF NOT EXISTS idx_teaching_days_term ON teaching_days (term_id);
CREATE INDEX IF NOT EXISTS idx_attendance_day ON attendance (teaching_day_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates (certificate_number);

-- Převod dat ze starých českých tabulek (pokud existují)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kurzy') THEN
        INSERT INTO courses (id, title, annotation, hours, price, is_accredited, created_at, updated_at)
        SELECT id, nazev, anotace, rozsah_hodin, cena, je_akreditovany, created_at, updated_at FROM kurzy
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            annotation = EXCLUDED.annotation,
            hours = EXCLUDED.hours,
            price = EXCLUDED.price,
            is_accredited = EXCLUDED.is_accredited;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ucebny') THEN
        INSERT INTO classrooms (id, name, address, capacity, created_at)
        SELECT id, nazev, adresa, maximalni_kapacita, created_at FROM ucebny
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            capacity = EXCLUDED.capacity;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lektori') THEN
        INSERT INTO lecturers (id, first_name, last_name, email, phone, specialization, created_at)
        SELECT id, jmeno, prijmeni, email, telefon, specializace, created_at FROM lektori
        ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            specialization = EXCLUDED.specialization;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'terminy') THEN
        INSERT INTO course_terms (id, course_id, classroom_id, start_date, end_date, capacity, status, created_at, updated_at)
        SELECT 
            id, kurz_id, ucebna_id, datum_od, datum_do, kapacita,
            CASE stav 
                WHEN 'NAPLANOVAN' THEN 'PLANNED'
                WHEN 'PROBIHA' THEN 'IN_PROGRESS'
                WHEN 'UKONCEN' THEN 'COMPLETED'
                WHEN 'ZRUSEN' THEN 'CANCELLED'
                ELSE 'PLANNED'
            END,
            created_at, updated_at
        FROM terminy
        ON CONFLICT (id) DO NOTHING;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'termin_lektori') THEN
        INSERT INTO term_lecturers (term_id, lecturer_id, role)
        SELECT 
            termin_id, lektor_id,
            CASE role
                WHEN 'hlavni' THEN 'lead'
                WHEN 'asistent' THEN 'assistant'
                ELSE 'guest'
            END
        FROM termin_lektori
        ON CONFLICT (term_id, lecturer_id) DO NOTHING;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'studenti') THEN
        INSERT INTO students (id, first_name, last_name, email, phone, organization, created_at)
        SELECT id, jmeno, prijmeni, email, telefon, organizace, created_at FROM studenti
        ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            organization = EXCLUDED.organization;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prihlasky') THEN
        INSERT INTO enrollments (id, term_id, student_id, submitted_at, status, waitlist_position, note, created_at, updated_at)
        SELECT 
            id, termin_id, student_id, datum_podani,
            CASE stav
                WHEN 'POTVRZENA' THEN 'CONFIRMED'
                WHEN 'PORADNIK' THEN 'WAITLIST'
                WHEN 'ZRUSENA' THEN 'CANCELLED'
                WHEN 'DOKONCENA' THEN 'COMPLETED'
                ELSE 'CONFIRMED'
            END,
            poradi_v_poradniku, poznamka, created_at, updated_at
        FROM prihlasky
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Syntetická data pro výukové dny, docházku a certifikáty
-- Přidáme ukázkový proběhlý termín, aby bylo možné demonstrovat hotové certifikáty
INSERT INTO course_terms (id, course_id, classroom_id, start_date, end_date, capacity, status)
VALUES (
    'a5555555-5555-4555-8555-555555555555',
    'b2a3f789-2345-4cde-8901-234567890abc',
    '22222222-2222-4222-8222-222222222222',
    '2026-09-01',
    '2026-09-30',
    10,
    'COMPLETED'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO term_lecturers (term_id, lecturer_id, role)
VALUES ('a5555555-5555-4555-8555-555555555555', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'lead')
ON CONFLICT (term_id, lecturer_id) DO NOTHING;

-- Zajištění syntetického studenta Jan Novák
INSERT INTO students (id, first_name, last_name, email, phone, organization)
VALUES ('c1111111-1111-4111-8111-111111111111', 'Jan', 'Novák', 'jan.novak@firma.cz', '+420 603 111 222', 'Krkonoše Tech s.r.o.')
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    organization = EXCLUDED.organization;

-- Přihlášky na dokončený termín a další stavy (Jan Novák)
INSERT INTO enrollments (id, term_id, student_id, submitted_at, status, waitlist_position, note)
VALUES 
    ('e1111111-1111-4111-8111-111111111111', 'a5555555-5555-4555-8555-555555555555', 'c2222222-2222-4222-8222-222222222222', '2026-08-15 10:00:00', 'COMPLETED', NULL, 'Absolvoval s vyznamenáním'),
    ('e2222222-2222-4222-8222-222222222222', 'a5555555-5555-4555-8555-555555555555', 'c3333333-3333-4333-8333-333333333333', '2026-08-16 11:30:00', 'COMPLETED', NULL, 'Udělení lektorské výjimky (docházka 67 %)'),
    ('e3333333-3333-4333-8333-333333333333', 'a5555555-5555-4555-8555-555555555555', 'c1111111-1111-4111-8111-111111111111', '2026-08-14 09:00:00', 'COMPLETED', NULL, 'Absolvoval rekvalifikační program s vyznamenáním (Jan Novák)'),
    ('d8888888-8888-4888-8888-888888888888', 'a4444444-4444-4444-8444-444444444444', 'c1111111-1111-4111-8111-111111111111', '2026-10-10 14:00:00', 'WAITLIST', 1, 'Čekatel v pořadníku náhradníků (Jan Novák)')
ON CONFLICT (id) DO NOTHING;

-- Výukové dny pro dokončený termín (3 dny)
INSERT INTO teaching_days (id, term_id, lecturer_id, day_date, hours, topic)
VALUES
    ('f1111111-1111-4111-8111-111111111111', 'a5555555-5555-4555-8555-555555555555', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-09-05', 8, 'Základy účetnictví a rozvaha'),
    ('f2222222-2222-4222-8222-222222222222', 'a5555555-5555-4555-8555-555555555555', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-09-12', 8, 'DPH a daňová evidence v praxi'),
    ('f3333333-3333-4333-8333-333333333333', 'a5555555-5555-4555-8555-555555555555', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-09-19', 8, 'Účetní závěrka a software Pohoda')
ON CONFLICT (id) DO NOTHING;

-- Výukové dny pro běžící termín (Účetnictví - probíhající)
INSERT INTO teaching_days (id, term_id, lecturer_id, day_date, hours, topic)
VALUES
    ('f4444444-4444-4444-8444-444444444444', 'a2222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-10-20', 6, 'Úvod do daňového systému'),
    ('f5555555-5555-4555-8555-555555555555', 'a2222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', '2026-10-27', 6, 'Praktická cvičení v PC učebně')
ON CONFLICT (id) DO NOTHING;

-- Evidence docházky pro dokončený termín
-- Alena Kratochvílová (c2): 3/3 dny přítomna = 100%
INSERT INTO attendance (teaching_day_id, student_id, is_present, note)
VALUES
    ('f1111111-1111-4111-8111-111111111111', 'c2222222-2222-4222-8222-222222222222', TRUE, 'Přítomna včas'),
    ('f2222222-2222-4222-8222-222222222222', 'c2222222-2222-4222-8222-222222222222', TRUE, 'Aktivní účast'),
    ('f3333333-3333-4333-8333-333333333333', 'c2222222-2222-4222-8222-222222222222', TRUE, 'Úspěšný test');

-- Michal Kučera (c3): 2/3 dny přítomen = 66.7% (udělena výjimka lektora)
INSERT INTO attendance (teaching_day_id, student_id, is_present, note)
VALUES
    ('f1111111-1111-4111-8111-111111111111', 'c3333333-3333-4333-8333-333333333333', TRUE, 'Přítomen'),
    ('f2222222-2222-4222-8222-222222222222', 'c3333333-3333-4333-8333-333333333333', FALSE, 'Omluven ze zdravotních důvodů'),
    ('f3333333-3333-4333-8333-333333333333', 'c3333333-3333-4333-8333-333333333333', TRUE, 'Doplnil samostudiem');

-- Jan Novák (c1): 3/3 dny přítomen = 100%
INSERT INTO attendance (teaching_day_id, student_id, is_present, note)
VALUES
    ('f1111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111', TRUE, 'Přítomen včas'),
    ('f2222222-2222-4222-8222-222222222222', 'c1111111-1111-4111-8111-111111111111', TRUE, 'Aktivní práce s daňovými doklady'),
    ('f3333333-3333-4333-8333-333333333333', 'c1111111-1111-4111-8111-111111111111', TRUE, 'Závěrečný test 95 %');

-- Jan Novák (c1): Evidence docházky pro běžící termín Účetnictví (2/2 = 100%)
INSERT INTO attendance (teaching_day_id, student_id, is_present, note)
VALUES
    ('f4444444-4444-4444-8444-444444444444', 'c1111111-1111-4111-8111-111111111111', TRUE, 'Přítomen'),
    ('f5555555-5555-4555-8555-555555555555', 'c1111111-1111-4111-8111-111111111111', TRUE, 'Splněno praktické cvičení');

-- Vystavená osvědčení
INSERT INTO certificate_counter (year, last_seq) VALUES (2026, 3)
ON CONFLICT (year) DO UPDATE SET last_seq = GREATEST(certificate_counter.last_seq, 3);

INSERT INTO certificates (id, enrollment_id, student_id, term_id, certificate_number, issue_date, attendance_rate, has_waiver, waiver_reason)
VALUES
    (
        'c0000001-0000-4000-8000-000000000001',
        'e1111111-1111-4111-8111-111111111111',
        'c2222222-2222-4222-8222-222222222222',
        'a5555555-5555-4555-8555-555555555555',
        'AT-2026-0001',
        '2026-09-30',
        100.00,
        FALSE,
        NULL
    ),
    (
        'c0000002-0000-4000-8000-000000000002',
        'e2222222-2222-4222-8222-222222222222',
        'c3333333-3333-4333-8333-333333333333',
        'a5555555-5555-4555-8555-555555555555',
        'AT-2026-0002',
        '2026-09-30',
        66.67,
        TRUE,
        'Schválena výjimka lektora: student předložil lékařské potvrzení a prokázal znalosti v náhradním testu.'
    ),
    (
        'c0000003-0000-4000-8000-000000000003',
        'e3333333-3333-4333-8333-333333333333',
        'c1111111-1111-4111-8111-111111111111',
        'a5555555-5555-4555-8555-555555555555',
        'AT-2026-0003',
        '2026-09-30',
        100.00,
        FALSE,
        NULL
    )
ON CONFLICT (id) DO NOTHING;

-- Migrace 002: Vložení syntetických ukázkových dat kurzů pro klienta
INSERT INTO kurzy (id, nazev, anotace, rozsah_hodin, cena, je_akreditovany)
VALUES 
    (
        'b2a3f789-2345-4cde-8901-234567890abc',
        'Účetnictví a daňová evidence pro praxi',
        'Komplexní rekvalifikační kurz zaměřený na podvojné účetnictví, DPH, daň z příjmů a práci v účetním softwaru Pohoda.',
        120,
        14900.00,
        TRUE
    ),
    (
        'c3b4a890-3456-4def-9012-345678901bcd',
        'Programování v jazyce Python – od základů po web',
        'Praktický kurz pro začátečníky i mírně pokročilé pokrývající základy jazyka Python, práci s daty a tvorbu webových aplikací.',
        80,
        18500.00,
        FALSE
    ),
    (
        'd4c5b901-4567-4ef0-0123-456789012cde',
        'Digitální marketing a sociální sítě pro malé podniky',
        'Intenzivní workshop zaměřený na tvorbu marketingové strategie, PPC kampaně v Meta Ads a Google Ads a obsahový marketing.',
        32,
        7800.00,
        FALSE
    ),
    (
        'e5d6c012-5678-4f01-1234-567890123def',
        'Pracovník v sociálních službách',
        'Akreditovaný kvalifikační kurz dle zákona o sociálních službách. Zahrnuje teorii, standardy kvality a praktický nácvik.',
        150,
        12500.00,
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

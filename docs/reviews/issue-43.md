# Review Issue #43: Lernprämien 1 / 2 / 3

- Datum: 24.09.2026
- Reviewer: Codex, separater Selbstreview; keine unabhängige Freigabe.
- Basis: main `3985eb2`; Branch `codex/issue-43-punkte-123`.

Gesamtdiff gegen main einschließlich Migration, UI, Projektvorgaben und Tests geprüft. Rust vergibt für beide Fächer 1/2/3 nach Aufgabenstufe. Falsche und bereits gelöste Aufgaben bleiben bei 0. Die API liefert die Anzeigeprämien; Ergebnisse zeigen den tatsächlich gespeicherten Betrag, einschließlich historischer Replays. Singular „1 Punkt“ ergänzt. Spielpreise und Vokabelpunkte bleiben unverändert.

Migration 008 kopiert alle Antwortbelege einschließlich Zeitstempel; der erlaubte Wertebereich enthält historische 5/10/15 und neue 1/2/3. Kein Journal-Neuberechnen, keine neuen Commands oder Abhängigkeiten. Reviewbefund während Umsetzung: alte Tests setzten 5/10/15 bzw. Schema 7 voraus; Erwartungswerte angepasst. Historische Fixtures erzeugen bewusst alte Belege und verwenden nicht mehr die aktuelle Prämienfunktion. Keine neu gefundenen bestehenden Produktbugs und keine offenen blockierenden Befunde.

Prüfungen: Frontendprüfung mit Prettier, 49 Frontend-/Spieltests, 2 Workflowtests, TypeScript und Vite erfolgreich. Nach letzten Rust-Testkorrekturen `npm run check:rust` erfolgreich: rustfmt, Clippy und 50 Rusttests. Insgesamt 101 Tests. Verhalten in beiden Fächern, alle Stufen, falsche Antworten, Replays, Wiederöffnung, historische 5/10/15-Belege und Migration-Rollback abgedeckt. `git diff --check` ohne Befund. CI auf macOS/Windows muss vor Merge grün sein.

Grenzen: Selbstreview; keine separate manuelle Windows-UI-Prüfung. Historische Gutschriften werden absichtlich nicht reduziert. Die Bezeichnung Vorschule bleibt erhalten und entspricht der vom Nutzer genannten Stufe Vorschulkind.

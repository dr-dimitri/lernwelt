# Review zu Issue #35: Punkte nach Schwierigkeit

- Datum: 24.09.2026
- Reviewer: Codex, **separater Selbstreview**, keine unabhängige Freigabe.
- Basis: `main` bei `52db6df`; Branch `codex/issue-35-punkte-nach-stufe`.

## Umfang und Ergebnis

Gesamtdiff gegen `main` einschließlich Migration 005 geprüft: Rust-Punktevergabe, IPC-Projektion, TypeScript-Modell, Lernansicht, Spielhallen-Hinweis, Tests, README, Architektur und Projektvorgaben. Keine offenen blockierenden Befunde und keine neu gefundenen Produktbugs im bisherigen Stand.

Die Prämie kommt aus der unveränderlichen Schwierigkeit der beantworteten Aufgabe: Vorschule 5, Könner 10, Streber 15. Die aktuell gespeicherte Stufe kann diese Zuordnung nicht überschreiben. Das Frontend liefert weiterhin ausschließlich Request-ID, Aufgabe und Antwort. Die UI erhält die Zuordnung vom Backend und aktualisiert den Hinweis nach erfolgreichem Stufenwechsel.

## Datenhaltung und Fehlerpfade

Migration 005 erweitert nur die CHECK-Bedingung der Antworttabelle auf 0/5/10/15 und kopiert sämtliche Spalten transaktional. Buchungsjournal, Profil, Einstellungen, Lernfortschritt, Abzeichen und Spielrunden werden nicht verändert. Alte 10-Punkte-Antwortergebnisse bleiben bei Replays erhalten, auch wenn dieselbe Schwierigkeit künftig 5 oder 15 Punkte bringt. Neue Requests für bereits gelöste Aufgaben geben 0 weitere Punkte. Bestehende Validierung, Schreibtransaktionen und Schutz gegen doppelte Buchungen bleiben aktiv.

Die bisherige Projektregel gleicher Belohnungen wurde entsprechend der ausdrücklichen Nutzeranweisung aktualisiert. Der Spielpreis bleibt 10 Punkte. Der veraltete Spielhallen-Hinweis „eine neue Antwort reicht immer“ wurde durch die drei tatsächlichen Prämien ersetzt.

## Prüfungen

- `npm run check:all`: erfolgreich; **39 Frontend-/Spieltests, 2 Workflowtests, 33 Rusttests**; TypeScript/Vite, Prettier, rustfmt und Clippy ohne Fehler.
- Neue Backendtests prüfen alle drei Stufen in beiden Fächern bei absichtlich abweichender globaler Stufe, falsche Antworten, erneute Versuche, Request-Replays und Guthaben nach erneutem Öffnen.
- Migrationstest mit Schema 4 prüft alte Vorschule-/Streber-Gutschriften von jeweils 10 Punkten, Zeitstempel, vorhandenes Abzeichen, aktive Spielrunde, Profil/Stufe/Fortschritt sowie neue 5-/15-Punkte-Gutschriften. Ein fehlgeschlagenes Upgrade erhält Schema 4 und die alten Antworten.
- Bestehender Test aller 363 Mathematikaufgaben prüft jetzt die stufenspezifischen Gutschriften und unverändert die einmalige Vergabe.
- UI-Test prüft den Wechsel 10 → 5 → 10 → 15 und die jeweils angezeigte Antwortgutschrift.
- Nativer macOS-Release-Build erfolgreich. Im isolierten Testprofil drei neue Mathematikaufgaben gelöst: Streber +15 (Guthaben 0 → 15), Vorschule +5 (15 → 20), Könner +10 (20 → 30). Alle Stufenanzeigen stimmen, alte insgesamt verdiente 60 Punkte blieben erhalten und stiegen nur durch diese Antworten auf 90. Vorhandenes Abzeichen und Lernstände blieben erhalten.
- GitHub-CI muss vor Merge für Frontend, macOS und Windows grün sein.

## Grenzen

Keine rückwirkende Neuberechnung oder Nachzahlung. Alte Requests zeigen ihren historischen Betrag. Keine manuelle Windows-UI-Prüfung; automatisierte Windows-Prüfungen und nativer Build erfolgen in CI. Keine neuen Abhängigkeiten oder Berechtigungen.

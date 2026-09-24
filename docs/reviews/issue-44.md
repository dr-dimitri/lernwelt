# Review Issue #44: Einmaleins und Quadratzahlen

- Datum: 24.09.2026
- Reviewer: Codex, **separater Selbstreview**, keine unabhängige Freigabe.
- Basis: main `b30229b` (Punkteänderung #43 bereits gemergt); eigener Branch `codex/issue-44-einmaleins`.

## Umfang und Befunde

Gesamtdiff gegen main geprüft: eigener navigierbarer Trainer, zwei Rechenarten, prozedurale Inhalte und Metadaten, Rust-Prüfung, SQLite-Migration 009, zwei begrenzte Commands mit Handler/Buildmanifest/Capability, typisierte Frontendschnittstelle, Tests und aktuelle Dokumentation. Keine neuen Abhängigkeiten. Nutzerpräzisierung umgesetzt: 100er-Einmaleins bedeutet Faktoren 1–10, nicht 1–100. Quadratzahlen reichen von 1² bis 25².

Die festen Permutationen besuchen in jeder Runde alle 100 geordneten Faktorenpaare bzw. 25 Quadratzahlen genau einmal; Wiederholungsrunden erlauben weitere Punkte. Faktoren und Lösungen liegen in Rust, keine vom Client gelieferten Beträge oder Richtig-Flags. Fachliche IDs unterscheiden Rechenart/Faktoren/Inhaltsversion; Sequenzen unterscheiden neue Übungsversuche. Bei geänderter Inhaltsfolge braucht es eine neue Belegversion.

Nachbesserungen im Implementierungs-/Reviewdurchgang: Fokusprüfung wartet auf den abgeschlossenen React-Effekt; Test für laufenden Retry prüft die gesperrte Antwort statt einer während des Ladens ausgeblendeten Fehlerschaltfläche. Singular „1 Aufgabe“ ergänzt. Beim Aktualisieren auf main wurden Schema-Konflikte mit beiden Migrationen 008 und 009 in Reihenfolge aufgelöst. Keine neu gefundenen bestehenden Produktbugs und keine offenen blockierenden Befunde.

## Datenhaltung und Fehlerpfade

Jede automatisch richtige neue Antwort gibt +1 unabhängig von Rechenart/globaler Stufe. Falsch/Aufdecken ergibt 0 ohne Abzug; Lösung wird erst nach der Bewertung angezeigt. Beleg und Journalbuchung bilden eine Immediate-Transaktion. Schlüssel Profil + Modus + Sequenz verhindert doppelte Punkte auch bei mehreren Verbindungen. Gleicher Retry liefert gespeichertes Ergebnis/aktuelles Guthaben; abweichende Antwort auf denselben bereits gespeicherten Versuch wird abgewiesen. Zukünftige Sequenzen, ungültige Zahlen, fremde Modi und fehlendes Profil werden abgefangen.

Migration 009 kopiert sämtliche Journalspalten unverändert und erlaubt die neue Art ausschließlich mit Betrag +1. Andere Tabellen bleiben erhalten. Aufgabenstand und Trefferzahlen werden aus den Belegen je Modus geladen, auch nach Neustart. Die UI wartet auf Backendbestätigung, hält unklare Schreibversuche für identischen Retry fest und bietet Neuladen des bestätigten Stands. Veraltete Antworten nach Profiländerung/Unmount werden ignoriert.

## Tatsächliche Prüfungen

- `npm run check:all`: erfolgreich nach Integration von #43, **58 Frontend-/Spieltests, 2 Workflowtests und 57 Rusttests = 117 Tests**; Prettier, TypeScript/Vite, rustfmt und Clippy grün. Nach abschließender Textkorrektur `npm run check` erneut grün.
- Rust: vollständiger Aufgabenraum einschließlich 10×10/25×25, neue Runden, alle globalen Stufen, falsche Antworten/Aufdecken, strikte Eingaben, historische Retries, fehlendes Profil, parallele Verbindungen, Transaktionsrollback, Wiederöffnung und reale Spielhallenabbuchung aus zehn Trainerpunkten.
- Upgrade einer Schema-8-Datei erhält vorhandenes Guthaben, Abzeichen, Profil, Schwierigkeit, Lernfortschritt und Journalzeitstempel. Erzwungener Fehler nach Journal-Neuaufbau lässt ursprüngliches Schema/Constraints und Guthaben erhalten. Bestehende Migrationstests für Lern-/Vokabeldaten laufen ebenfalls mit Schema 9.
- UI: Enter, Fokus, verborgene Lösung, +1/Guthaben, falsch/Aufdecken, Moduswechsel, nächste Aufgabe, ungültige Eingabe, Profil-/Ladefehler, identischer Retry, Neuladen nach verlorenem Response und veraltete Lade-/Speicherantworten. Navigation lädt beim Rückweg das gemeinsame Konto neu.
- Nativer macOS-Release-Build erfolgreich. Im isolierten bestehenden Profil: Guthaben zunächst unverändert 43; Einmaleins 2×8 = 16 → 44; 6×5 falsch als 29 → weiterhin 44 und Lösung 30; Quadratzahl 8×8 = 64 → 45. Nach Beenden/Neustart weiterhin 45, Einmaleins bei Aufgabe 3 (10×2), Quadratzahlen bei Aufgabe 2 (19×19). Vorschule/Könner/Streber zeigen im Lernbereich 1/2/3. Darstellung des Trainers mit Modusauswahl, Zahlenfeld und Fokusrahmen per Screenshot geprüft.
- `git diff --check` ohne Befund. Frontend-/macOS-/Windows-CI muss vor Merge grün sein.

## Grenzen

Fest gemischte, sich wiederholende Aufgabenfolge; keine adaptive Fehlerwiederholung und keine Zeitwertung. Die ausgewählte Rechenart wird beim Öffnen auf Einmaleins gesetzt, der Aufgabenstand beider Rechenarten bleibt erhalten. Nicht gesendete Texteingaben werden nicht gespeichert. Ergänzender Grundfertigkeitentrainer, keine vollständige Lehrplanabdeckung. Lokales Punktekonto, keine manipulationssichere Währung. Keine manuelle Windows-UI-Prüfung oder Verständlichkeitsstudie mit Kindern behauptet.

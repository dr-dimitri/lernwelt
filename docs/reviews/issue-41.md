# Review zu Issue #41: Mehr Wortkarten und geprüfte Ein-Punkt-Antworten

- Datum: 24.09.2026
- Reviewer: Codex, **separater Selbstreview**, keine unabhängige Freigabe.
- Basis: `main` bei `cfb07f1`; Branch `codex/issue-41-vokabeln-punkte`.

## Umfang und Befunde

Gesamtdiff gegen main geprüft: 250 zusätzliche eigene Karten, explizite Antwortvarianten für alle 370 Karten, Rust-Prüfung und Punktebuchung, Migration 007, typisierte Antwortschnittstelle, Trainerablauf, Guthaben, Tests, Punktehinweis in der Spielhalle und Projekt-/Inhaltsdokumentation. Alle neuen Wort-/Übersetzungspaare und Beispielsätze separat gelesen. Alle bisherigen Felder der ursprünglichen 120 Karten wurden gegen main verglichen: unverändert; nur Antwortlisten ergänzt. 18 Themen, davon 17 mit je 20 Karten und Zahlen mit 30.

Die Nutzerentscheidung „Antwort eintippen und automatisch prüfen“ ersetzt die vorherige Selbsteinschätzung. Deshalb ist `known` kein erlaubter Requestparameter mehr. Die UI sendet ausschließlich Antwort oder Aufdeckwunsch und Versionsschutz, niemals das Prüfergebnis oder den Punktebetrag. Die noch nicht gemergte Testimplementierung wurde korrigiert: Ein Wiederholungstest musste die tatsächlich aktive Stufe Streber senden. Die erwartete Abweisung bestätigte den bestehenden Schutz. Zwei neue Beispielsätze wurden sprachlich vereinfacht. Keine neu gefundenen Produktbugs im bisherigen Stand, keine offenen blockierenden Befunde.

## Antworten, Punkte und Fehlerpfade

Jede richtige neue Bewertung erhält unabhängig von der Stufe genau 1 Punkt, auch bei später fälligen Wiederholungen. Falsche Antworten und freiwilliges Aufdecken ergeben 0 Punkte, keinen Abzug und baldige Wiederholung. Unterschiedliche Großschreibung, Leerraum und Apostrophe sowie hinterlegte Varianten werden akzeptiert; deutsche Antworten dürfen einen Artikel enthalten. Keine unscharfe Prüfung oder Behauptung aller möglichen Übersetzungen. Vorschule zeigt den englischen Beispielsatz zur Bedeutungsabgrenzung.

Requestbeleg speichert originalen Antworttext, Backend-Ergebnis und historische Punkte. Retry mit unveränderter Nutzlast liefert denselben Betrag ohne erneute Buchung, abweichende Nutzlast wird abgewiesen. Neue Request-IDs umgehen weder Bewertungszähler noch Fälligkeit. Karte, Stufe, Thema, Profil, Antwortlänge und Steuerzeichen werden geprüft. Fortschritt, Beleg und positive Journalbuchung bilden eine Transaktion; auch ein Fehler bei der letzten Punktebuchung rollt die vorherigen Inserts zurück. UI aktualisiert das Guthaben ausschließlich anhand bestätigter Serverantworten und hält unklare Übertragungen für Retry fest.

Migration 007 kopiert Journal-IDs, Beträge und Zeitstempel unverändert, ergänzt die Art `vocabulary` mit strikt +1 und fügt Antwort-/Prüffelder an alte Belege an. Alte Selbsteinschätzungen bleiben mit 0 Punkten erhalten; keine nachträgliche Vergütung. Alte Beleg-IDs dürfen nicht zu automatisch geprüften Antworten umgedeutet werden. Keine neuen Abhängigkeiten oder zusätzlichen Commands/Berechtigungen.

## Prüfungen

- `npm run check:all`: erfolgreich, **49 Frontend-/Spieltests, 2 Workflowtests, 49 Rusttests** (100 insgesamt), Prettier, TypeScript/Vite, rustfmt und Clippy.
- Prüfvarianten über alle Karten und Stufen sowie falsche Antworten; neue Transaktionstests für jeden Schwierigkeitsgrad, erneute fällige Antwort, Retry, fehlendes Profil, veraltete/zu frühe Bewertung, ungültige Texte und unzulässiges Richtig-Flag.
- Schema-6-Datei mit Kartenfortschritt, alten Selbstbewertungen, Journal, Abzeichen, Antwortbelegen und Spielrunde erfolgreich migriert/erneut geöffnet. Alte Journalzeilen einschließlich Zeitstempel exakt erhalten. Erzwungener Fehler nach Journal-Neuaufbau rollt Migration/Version zurück.
- Zehn Vokabelpunkte finanzieren im Backendtest eine reguläre Spielrunde; Guthaben/insgesamt verdient nach Neustart korrekt. Fehler beim Beleg- oder Punkte-Insert lässt keine Teilbuchung zurück.
- UI: Enter-Abgabe, verborgene Lösung, richtig/falsch/Aufdecken, Guthaben, Retry mit identischer ID und gesperrter Eingabe, Themen-/Stufenwechsel, Profil/Ladefehler, veraltete Antworten und nächste Karte.
- Nativer macOS-Release-Build erfolgreich. Im isolierten Profil 370 Karten/18 Themen und vorhandene Fächer sichtbar; unverändert zunächst 40 Punkte/100 insgesamt verdient. „HELLO“ in Könner → 41, falsches „wrong“ für „Name“ → weiterhin 41, neue Tierkarte „die Katze“ in Vorschule → 42, „CAT“ in Streber-Satzlücke → 43. Lösungen und nächste Wiederholung sichtbar, jeweils genau +1.
- `git diff --check` ohne Befund. Vor Merge müssen Frontend-, macOS- und Windows-CI grün sein.

## Grenzen

Eigene Wortauswahl nach Lehrplan-Wortfeldern und thematischer Green-Line-Bayern-Orientierung, keine vollständige offizielle Pflicht-/Buchwortliste. Antwortlisten enthalten häufige Varianten, keine beliebigen Umschreibungen; keine Audioaufnahmen oder KI. Lokales Punktekonto, keine manipulationssichere Währung. Fälligkeiten bleiben von der Geräteuhr abhängig. Keine manuelle Windows-UI-Prüfung oder Verständlichkeitsprüfung mit Kindern behauptet.

# Review zu Issue #101: Umfangreiche Themenpakete

## Umfang und Reviewart

Separater Selbstreview durch Codex nach der Umsetzung; keine unabhängige Freigabe. Geprüft wurden der Gesamtdiff gegen `main`, die Akzeptanzkriterien, alle Aufgabenfamilien im Entwicklungswerkzeug, die Zuordnung der ursprünglichen Aufgaben, Quellen-/Jahrgangsmetadaten, die IPC-Projektion, Audio- und Trainerwechsel sowie Speicherung und Fehlerpfade.

Das Ergebnis umfasst 87 Unterthemen in 17 Lernbereichen und 3.675 sichtbare Fachaufgaben (1.767 Mathematik, 1.368 Englisch, 540 Natur und Technik). Jedes Unterthema hat mindestens zwölf Aufgaben pro Stufe. Die vier Grundpakete mit 615 sichtbaren Aufgaben sowie die ursprüngliche Wort-/Audiobank sind unverändert. 3.060 eigene Aufgaben ergänzen die bestehenden IDs. Die Inhaltsmatrix weist jede Stufe aus.

## Befunde und Korrekturen

- Englisch wurde in 18 gezielte Wortschatz-Themen aufgeteilt. Trainerlinks starten im passenden Deck; Wortschatzsuche berücksichtigt deutsche und englische Wörter. Ein eigenes Hörthema nutzt bekannte lokale Wort- und Satzdateien. Keine beliebigen Pfade oder neuen Commands.
- Lernziele wurden von bloßen Themenwiederholungen zu konkreten Fähigkeiten überarbeitet. Die Fragen nennen gesuchte Größe und Einheit; neue Zeichen und Begriffe werden in Frage, Tipp oder Erklärung erläutert. Natur und Technik verwendet fachbezogene Hinweise; Versuchsauswertung erhält zwölf konkrete Denkwege.
- Mehrdeutige Versuchseinleitung, gleiche Geometrie-/Lesebeispiele und mögliche unfaire freie Synonymabfragen wurden während des Inhaltsreviews korrigiert. Auswahlaufgaben erhalten eindeutig verschiedene Optionen und wechselnde Positionen der richtigen Antwort. Hör-Schreibaufgaben bieten den Satz zur Einordnung ähnlich klingender Wörter.
- Der neue Audio-Baustein erhielt einen eigenen React-Schlüssel, damit Aufgabenwechsel die Wiedergabe zuverlässig beenden. Frontendtests prüfen Wechsel, Rückweg, Abspielfehler, erneuten Versuch und ausbleibende Punktebuchung durch Anhören.
- Der in `main` reproduzierte verspätete Fokuswechsel wurde separat als #103 bearbeitet, reviewt und vor Fortsetzung gemergt. Kein stiller Nebenfix.
- Vorhandene Umfangstests wurden auf die vergrößerte Bank aktualisiert; Antwort- und Punkteprüfungen bleiben vollständig. Kein Datenbankschema, keine alten Antwortbedeutungen und keine bestehenden Buchungen geändert.

## Prüfergebnisse

- `npm run check:all` erfolgreich: Formatierung, 211 Frontendtests, 8 Skripttests, TypeScript und Produktionsbuild; Rust-Formatierung, Clippy ohne Warnungen und 122 Rusttests.
- Fünf gezielte Rusttests nach der letzten Metadaten-/Tippüberarbeitung erneut erfolgreich. Mindestens zwölf Aufgaben pro Stufe, eindeutige neue Fragen/Optionen/Audios, Textgrenzen, richtige und falsche Antworten, unabhängig handgerechnete Zahlenbeispiele und Grammatik-/Naturbeispiele, ursprüngliche Antwortbedeutungen und Audio-Whitelist geprüft.
- Antworttest mit erneutem Öffnen einer SQLite-Verbindung erhält alte/neue Lösungen, 1/2/3 Punkte, alte Request-Belege und idempotente Wiederholungen. Der vollständige Mathematiktest prüft alle 1.767 Aufgaben samt Erstlösung, falscher Antwort, Retry und erneuter Antwort. Bestehende Migrations-/Rollbacktests bleiben grün.
- Wiederholte Ausführung des Entwicklungswerkzeugs erzeugt identische SHA-256-Werte für Bank und Katalog. `git diff --check` erfolgreich.
- `npm run desktop:build -- --debug --no-bundle` erfolgreich. Zusätzlich native macOS-App mit temporärem Konfigurations-Override (`de.lernwelt.review101`) gestartet: neuer Katalog aus echtem IPC, neues Testprofil, 1,6 km → 1600 m korrekt mit zwei Punkten, Fachwechsel, lokale Satzwiedergabe und Audio-Stopp beim Aufgabenwechsel erfolgreich. Der Override betrifft nur die isolierte Review-App; Produktionskonfiguration unverändert. Lokale Updater-Artefakte wurden im Override deaktiviert, da der private Signierschlüssel ausschließlich in GitHub liegt.
- Isolierte Browseransicht bei 360 und 1.100 Pixeln visuell geprüft: Mathematik-Unterthemen, neue Längenumrechnung/Tippdialog, Englisch-Suche/Hörübungen und Natur-und-Technik-Anwendung mit Stufenwechsel. Keine horizontale Seitenüberbreite bei 360 Pixeln. Die Browseransicht simulierte Speicherung ausdrücklich nur im Test; native und Rusttests prüften echte Speicherung. Temporäre Vorschau entfernt.

## Grenzen und Ergebnis

Keine offenen blockierenden Befunde. Die Bank enthält endliche, vorab geprüfte Aufgabenfamilien und gemeinsame Grundlagen über Stufen hinweg; die Anzahl ist keine Zahl unabhängiger Kompetenzen oder ein Nachweis vollständiger Lehrplanbeherrschung. Kein unabhängiges pädagogisches Gutachten, keine Prüfung mit Kindern und keine vollständige Barrierefreiheitszertifizierung. Aussprache wird nicht automatisch bewertet. Die bestehende Vite-Warnung zum JavaScript-Bundle über 500 kB bleibt unverändert. Windows-Start und Betriebssystem-Installerprüfung erfolgen nicht lokal; native Windows-/macOS-Builds und Releasepakete werden in GitHub separat geprüft.

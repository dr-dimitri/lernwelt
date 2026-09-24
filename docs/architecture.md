# Architektur

## Aufbau

Lernwelt ist eine eigenständige Tauri-2-Anwendung. React, TypeScript und Vite stellen die Oberfläche bereit; Rust verwaltet SQLite über rusqlite mit eingebundener SQLite-Version. Es ist kein separater Web- oder Datenbankserver im installierten Produkt notwendig. npm/Vite sind Entwicklungs- und Buildwerkzeuge.

- `src/components/`: UI und sichtbare Lade-, Fehler- und Speicherzustände.
- `src/domain/`: Fach- und Nutzerdatentypen.
- `src/lib/desktop.ts`: typisierte Grenze zu den Tauri-Commands; im Browser expliziter Fehler.
- `src-tauri/src/lib.rs`: begrenzte Commands und lokaler Anwendungszustand.
- `src-tauri/src/database.rs`: Validierung, parametrisierte Abfragen, Migration und Datenbanktests.
- `src-tauri/migrations/`: versionierte SQL-Schemata.

## Daten und Migrationen

Ein lokales Profil mit stabiler ID 1; Name und Jahrgangsstufe können aktualisiert werden, ohne vorhandenen Fortschritt zu löschen. Fortschritt wird pro Fach und stabiler Kompetenz-ID mit Versuchs- und Trefferzahl gespeichert. `record_attempt` ist nur noch eine interne Datenbankfunktion. Die Oberfläche sendet Antworten über `submit_answer`; Antwortprüfung, Lernfortschritt und Punkte werden gemeinsam in einer Transaktion gespeichert.

SQLite liegt im betriebssystemspezifischen Tauri-Anwendungsdatenverzeichnis. Die Verbindung wird durch einen Mutex serialisiert; SQLite regelt zusätzlich Schreibzugriffe mehrerer Prozesse. Fremdschlüssel sind aktiviert, Sperren haben ein begrenztes Zeitlimit. Die jetzigen kleinen synchronen Commands eignen sich für kurze lokale Operationen; umfangreiche spätere Importe gehören in Hintergrundaufgaben.

`PRAGMA user_version` versioniert das Schema. Migration und Versionswechsel erfolgen in einer Transaktion; höhere Versionen werden abgewiesen. Weitere Migrationen als neue Dateien hinzufügen, vorhandene veröffentlichte Migrationen nicht umschreiben. Jede Änderung mit einer älteren Datenbankfixture und erneutem Öffnen prüfen.

Die Datenbank ist nicht verschlüsselt. Es gibt noch keine Mehrbenutzerverwaltung, Synchronisierung oder integrierte Sicherung. Eine manuelle Sicherung erfolgt bei vollständig beendeter App durch Kopieren der Datenbank. Fehler beim Öffnen werden sichtbar gemeldet; es wird keine leere Ersatzdatenbank angelegt, um einen Fehler zu verdecken.

## Offline und Schnittstellen

Sechs explizite Commands sind für das lokale Hauptfenster erlaubt: `get_profile`, `save_profile`, `list_progress`, `get_learning_state`, `submit_answer`, `redeem_reward`. Ein vom Frontend geliefertes `correct`-Flag wird nicht als Antwortbewertung akzeptiert. Rust prüft Eingaben auch dann, wenn das Frontend bereits geprüft hat. Es gibt keinen beliebigen SQL-, Shell- oder Dateisystemzugriff aus der Oberfläche und keine Netzwerk-Plugins. Produktions-CSP und lokal gebündelte Assets vermeiden externe Ressourcen. Die Entwicklungs-CSP erlaubt nur zusätzlich Vite/HMR auf der Loopback-Adresse.

## Lehrplaninhalte ergänzen

Lehrplaninhalte getrennt von Nutzerdaten als versionierte Pakete pflegen. Vor einem Import ein überprüfbares Schema einführen: stabile ID, Fach, Jahrgangsstufe, Lernbereich, Kompetenz, Quellen-URL, Lehrplanstand, Inhaltsversion und bei Englisch Fremdsprachenfolge. Offizielle Grundlage ist [LehrplanPLUS Bayern](https://www.lehrplanplus.bayern.de/). Ein technisches Beispiel stellt keine fachliche Vollständigkeit sicher.

Aufgaben benötigen eigene Antwortprüfer; Formeldarstellung (später etwa KaTeX) ersetzt keine mathematische Validierung. Vier eigene Beispielaufgaben prüfen ganze Zahlen beziehungsweise einzelne englische Wörter. Umfangreiche Aufgabenpakete, differenzierte Fachbewertungen, Wiederholungsplanung, Audioinhalte und KI-Funktionen sind noch nicht enthalten.

## Qualität und Review

`npm run check:all` führt die lokalen Qualitätsprüfungen aus. GitHub Actions wiederholt Frontend-Prüfungen sowie Rust-Tests, Clippy und native Debug-Builds auf macOS und Windows. Der native macOS-Release-Build und der Profilablauf werden zusätzlich manuell geprüft. CI ersetzt keinen Review oder visuellen Funktionstest.

Die Workflow-Prüfung kontrolliert Issue-Branch, genau eine passende Abschlussverknüpfung und vorhandene Reviewdatei. Sie kann nicht die inhaltliche Qualität eines Reviews beweisen. Die verbindlichen Regeln stehen in `AGENTS.md`; serverseitige Branch-Schutzregeln werden nicht automatisch eingerichtet.

## Punktebuchungen (Schema 2)

`point_entries` ist das lokale Buchungsjournal: positive Beträge für erstmalig korrekt gelöste Aufgaben, negative Beträge für einmalige Abzeichen. Guthaben und insgesamt verdiente Punkte werden daraus berechnet. Eine eindeutige Kombination aus Profil, Buchungsart und Aufgaben-/Belohnungs-ID verhindert doppelte Gutschriften oder Käufe.

`answer_submissions` speichert Request-ID, Aufgabe, Antwort und Ergebnis. Derselbe Request wird ohne erneute Fortschritts- oder Punktebuchung beantwortet; dieselbe ID mit anderen Argumenten wird abgewiesen. Nach einem Transportfehler behält die UI die ID für einen Retry derselben Antwort. Ein erneuter Übungsversuch verwendet eine neue ID, kann aber für dieselbe Aufgabe keine weiteren Punkte erhalten.

Schreibtransaktionen verwenden `BEGIN IMMEDIATE`, damit auch mehrere App-Prozesse keine parallelen Guthabenprüfungen mit anschließendem Überziehen verursachen. Wiederholtes Einlösen desselben einmaligen Abzeichens liefert dessen aktuellen Besitzstand. Antworten und Preise werden im Backend bestimmt; ein beliebiger Punktebetrag ist kein Command-Argument.

Die Migration von Schema 1 erhält Profile und Fortschritt und startet das Buchungsjournal leer. Für alte aggregierte Fortschrittsdaten fehlen eindeutige Aufgaben-IDs; daraus werden keine Punkte erfunden. Zukünftige geänderte Aufgaben benötigen eine neue stabile Inhaltsversion/ID. Belohnungen sind derzeit einmalige digitale Abzeichen; wiederholt einlösbare oder eigene Belohnungen benötigen ein erweitertes Datenmodell.

Die vier `sample.*.v1`-Aufgaben stammen aus eigenen Lernwelt-Beispielen (Stand 2026-09-24); ihre Kompetenz-IDs sind ausdrücklich Beispiel-IDs. Eine amtlich geprüfte Jahrgangs-/Lehrplanzuordnung ist noch nicht erfolgt. Vor der Aufnahme regulärer Aufgabenpakete gelten die oben beschriebenen Quellen- und Metadatenanforderungen.

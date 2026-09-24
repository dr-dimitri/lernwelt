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

Zehn explizite Commands sind für das lokale Hauptfenster erlaubt: `get_profile`, `save_profile`, `list_progress`, `get_learning_state`, `submit_answer`, `redeem_reward`, `set_difficulty`, `get_arcade_state`, `start_game`, `finish_game`. Ein vom Frontend geliefertes `correct`-Flag wird nicht als Antwortbewertung akzeptiert. Rust prüft Eingaben auch dann, wenn das Frontend bereits geprüft hat. Es gibt keinen beliebigen SQL-, Shell- oder Dateisystemzugriff aus der Oberfläche und keine Netzwerk-Plugins. Produktions-CSP und lokal gebündelte Assets vermeiden externe Ressourcen. Die Entwicklungs-CSP erlaubt nur zusätzlich Vite/HMR auf der Loopback-Adresse.

## Lehrplaninhalte ergänzen

Lehrplaninhalte getrennt von Nutzerdaten als versionierte Pakete pflegen. Vor einem Import ein überprüfbares Schema einführen: stabile ID, Fach, Jahrgangsstufe, Lernbereich, Kompetenz, Quellen-URL, Lehrplanstand, Inhaltsversion und bei Englisch Fremdsprachenfolge. Offizielle Grundlage ist [LehrplanPLUS Bayern](https://www.lehrplanplus.bayern.de/). Ein technisches Beispiel stellt keine fachliche Vollständigkeit sicher.

Das erste Paket liegt in `src-tauri/content/curriculum-v1.json` und wird über `include_str!` offline eingebunden. `content.rs` liest es einmalig, validiert Metadaten, IDs und Antworten und trennt es von der Punktebuchung in `learning.rs`. Topics können zusätzlich strukturierte Lerntafeln mit Caption, Spalten, Zeilen und Erklärung enthalten. Die UI rendert daraus zugängliche HTML-Tabellen; Rust validiert nichtleere Beschriftungen und konsistente Zeilenbreiten. Das optionale Feld benötigt keine Nutzerdatenmigration. Topics tragen Jahrgangsstufe, Lehrplanbezug und ggf. Fremdsprachenfolge; Aufgaben verweisen auf Topic, Kompetenz, Stufe und eine unveränderliche Versions-ID. Quelle und Abrufstand gelten paketweit für die Mathematikzuordnung; Englisch ist ausdrücklich als Beispiel ohne vollständige Zuordnung markiert.

Die IPC-Projektion liefert Aufgaben ohne Lösungsschlüssel. Rust bewertet Zahlen über exakte Dezimalnormalisierung (keine Fließkomma-Rundung, kein `eval`), Text ohne ASCII-Großschreibung und Auswahlantworten exakt. Einheiten werden durch die Fragestellung vorgegeben. Antwort- und Requestvalidierung, Journal und Idempotenz gelten für alle Stufen. Die vier ursprünglichen Beispiel-IDs behalten ihre Antworten; die beiden Mathematikbeispiele werden in der neuen Themenauswahl nicht angezeigt, bleiben aber für alte Request-Replays erreichbar. Geänderte Antwortbedeutungen benötigen neue Aufgaben-IDs.

Die UI wählt Thema und Stufe, zeigt Tipps, Rückmeldung und lösbare Teilaufgaben. Papieraktivitäten mit Selbstkontrolle ergänzen geometrische Konstruktionen und das Erklären von Rechenwegen; sie lösen keine Punktebuchung aus. Audio, adaptive Wiederholungsplanung und KI sind nicht enthalten.

## Fachübergreifende Stufe (Schema 3)

`learning_settings` enthält genau eine Einstellung mit den erlaubten Werten `vorschule`, `koenner`, `streber`. Die transaktionale Migration setzt bestehende und neue Installationen auf `koenner` und lässt Profile, Fortschritt und Buchungen unverändert. Die Einstellung ist unabhängig von Profiljahrgang und Fach; Profiländerung und Neustart erhalten sie. `set_difficulty` prüft auch ungültige Strings am Rust-Eingang, bevor geschrieben wird. Die UI ändert die aktive Stufe erst nach erfolgreichem Speichern und zeigt Fehler mit Wiederholungsmöglichkeit an.

## Qualität und Review

`npm run check:all` führt die lokalen Qualitätsprüfungen aus. GitHub Actions wiederholt Frontend-Prüfungen sowie Rust-Tests, Clippy und native Debug-Builds auf macOS und Windows. Der native macOS-Release-Build und der Profilablauf werden zusätzlich manuell geprüft. CI ersetzt keinen Review oder visuellen Funktionstest.

Die Workflow-Prüfung kontrolliert Issue-Branch, genau eine passende Abschlussverknüpfung und vorhandene Reviewdatei. Sie kann nicht die inhaltliche Qualität eines Reviews beweisen. Die verbindlichen Regeln stehen in `AGENTS.md`; serverseitige Branch-Schutzregeln werden nicht automatisch eingerichtet.

## Punktebuchungen (Schema 2)

`point_entries` ist das lokale Buchungsjournal: positive Beträge für erstmalig korrekt gelöste Aufgaben, negative Beträge für einmalige Abzeichen. Guthaben und insgesamt verdiente Punkte werden daraus berechnet. Eine eindeutige Kombination aus Profil, Buchungsart und Aufgaben-/Belohnungs-ID verhindert doppelte Gutschriften oder Käufe.

`answer_submissions` speichert Request-ID, Aufgabe, Antwort und Ergebnis. Derselbe Request wird ohne erneute Fortschritts- oder Punktebuchung beantwortet; dieselbe ID mit anderen Argumenten wird abgewiesen. Nach einem Transportfehler behält die UI die ID für einen Retry derselben Antwort. Ein erneuter Übungsversuch verwendet eine neue ID, kann aber für dieselbe Aufgabe keine weiteren Punkte erhalten.

Schreibtransaktionen verwenden `BEGIN IMMEDIATE`, damit auch mehrere App-Prozesse keine parallelen Guthabenprüfungen mit anschließendem Überziehen verursachen. Wiederholtes Einlösen desselben einmaligen Abzeichens liefert dessen aktuellen Besitzstand. Antworten und Preise werden im Backend bestimmt; ein beliebiger Punktebetrag ist kein Command-Argument.

Die Migration von Schema 1 erhält Profile und Fortschritt und startet das Buchungsjournal leer. Für alte aggregierte Fortschrittsdaten fehlen eindeutige Aufgaben-IDs; daraus werden keine Punkte erfunden. Zukünftige geänderte Aufgaben benötigen eine neue stabile Inhaltsversion/ID. Schema 2 modelliert einmalige digitale Abzeichen; Schema 4 ergänzt wiederholt einlösbare Spielrunden (siehe unten).

Die vier `sample.*.v1`-Aufgaben stammen aus eigenen Lernwelt-Beispielen (Stand 2026-09-24); ihre Kompetenz-IDs sind ausdrücklich Beispiel-IDs. Die Englischbeispiele werden weiterhin als Beispiele gekennzeichnet; die neue Mathematikzuordnung und ihre Grenzen sind in `curriculum-math-5.md` dokumentiert.

## Spielhalle (Schema 4)

`arcade.rs` verwaltet drei zusätzliche erlaubte Commands: `get_arcade_state`, `start_game(sessionId, gameId)` und `finish_game(sessionId, score)`. Der Eintrittspreis von 10 Punkten und die vier erlaubten Spiel-IDs liegen im Backend. Das Schema erweitert das Buchungsjournal um `kind = 'game'`; Migration 004 kopiert alle bisherigen Journalspalten unverändert und tauscht die Tabelle innerhalb derselben Migrationstransaktion aus. Profile, Einstellungen, Antworten und Fortschritt bleiben erhalten.

`game_sessions` speichert die Runden-ID, das Profil, die Spiel-ID und den finalen Spiel-Score. `score IS NULL` bedeutet eine offene bezahlte Runde. Ein partieller Unique-Index erlaubt höchstens eine offene Runde je Profil. Beginn, Guthabenprüfung, Abbuchung und Session erfolgen mit `BEGIN IMMEDIATE`. Die Runden-ID ist zugleich der Idempotenzschlüssel: ein gleicher offener Start wird wiederholt, andere Argumente oder ein bereits abgeschlossener Start abgewiesen. Nach einem verlorenen Response entdeckt `get_arcade_state` die bezahlte Runde. `finish_game` akzeptiert nur vorhandene Runden und ganzzahlige Scores von 0 bis 1.000.000; identische Wiederholungen buchen nichts. Bestwerte werden aus abgeschlossenen Runden ermittelt. Spiele erzeugen keine Lernpunkte; die lokalen Bestwerte sind nicht manipulationssicher.

`src/games/engine.ts` enthält die unabhängig von React und Canvas prüfbaren Regeln, Kollisionen und Rundenenden. `draw.ts` zeichnet eigene Formen; `GameStage` verbindet die Regeln mit einem begrenzten Animationszeitschritt, Eingaben, Pause bei Fokusverlust und einmaliger Ergebnismeldung. Eine bezahlte unterbrochene Runde startet mit neuem lokalen Spielzustand, ohne erneuten Eintritt. Kein Checkpoint-Speichern mitten im Spiel. `ArcadePanel` behandelt Lade- und Buchungsfehler, behält eine unklare Start-ID für Wiederholungen und bietet das erneute Speichern eines Ergebnisses an. Die Hauptnavigation mountet Lernkonto bzw. Spielhalle beim Wechsel neu und lädt damit das aktuelle gemeinsame Guthaben.


## Punkte nach Schwierigkeit (Schema 5)

Rust bestimmt die Prämie anhand von `exercise.difficulty`: Vorschule 5, Könner 10, Streber 15. Die aktuell gewählte Einstellung und vom Frontend übergebene Werte ändern diese Zuordnung nicht. `get_learning_state` liefert `pointsByDifficulty` für alle drei Stufen; die UI zeigt damit auch nach einem Stufenwechsel sofort die passende Prämie. Falsche Antworten oder neue Versuche auf bereits gelöste Aufgaben geben weiterhin 0 zusätzliche Punkte.

Migration 005 erweitert die erlaubten Beträge in `answer_submissions` auf 0/5/10/15. Alle alten Antworten einschließlich Request-ID, Betrag und Zeitstempel werden in derselben Transaktion erhalten. Das Journal wird nicht neu bewertet: alte 10-Punkte-Gutschriften bleiben bestehen und alte Requests liefern weiterhin ihren damals gespeicherten Betrag, ohne nochmals zu buchen. Abzeichen und Spiele behalten ihre Preise.

## Englisches Lernpaket

`english-5-v1.json` ergänzt das Mathematikpaket als separates eingebettetes Paket. Der Loader validiert beide Pakete und danach den gemeinsamen Katalog (einschließlich global eindeutiger IDs). Er ergänzt jeden Topic mit der Quelle und dem Lehrplanstand seines Pakets; Englisch zeigt dadurch seine eigene Quelle. Historische Englischbeispiele bleiben nur für alte Requests/Journalverweise erhalten. Keine Schemaänderung oder neue Berechtigung.

## Vokabeltrainer und Wiederholungen

Zwei weitere begrenzte Commands: `get_vocabulary_state(deckId)` und `review_vocabulary(input)`, insgesamt zwölf Commands. `vocabulary.rs` lädt und validiert das eingebettete Paket `vocabulary-5-v1.json`. Paketmetadaten enthalten Fach, Klasse, Fremdsprachenfolge, Quelle/Stand und Orientierung; Karten stabile IDs, Thema, Kompetenz, Übersetzung, Beispielsatz und konsistente Satzlücke. Beide Commands sind in Handler, Buildmanifest und Capability eingetragen.

Migration 006 ergänzt nur `vocabulary_progress` und `vocabulary_reviews`. Fortschrittsschlüssel: Profil + Karte + Schwierigkeit. Gespeichert werden Fach 1–5, Bewertungszähler und Fälligkeit als Unixsekunden. Noch üben → Fach 1 / 60 Sekunden; Gewusst → nächstes Fach, maximal 5 / 1, 3, 7, 14 Tage. Backend-Systemzeit bestimmt Fälligkeit, keine vom Client gelieferte Uhr oder Fachnummer. Fällige Wiederholungen werden nach ältestem Termin vor neuen Karten gewählt, Themenfilter respektiert. Unbekannte frühere Kartenstände werden bei einer künftigen Paketänderung nicht gelöscht.

Bewertung und Request-Beleg werden in einer Immediate-Transaktion gespeichert. Eindeutige Request-ID + unveränderte Nutzlast ermöglicht gefahrlose Wiederholung nach unklaren Transportfehlern. `expectedReviews` verhindert verlorene Updates durch alte Ansichten oder mehrere Prozesse; noch nicht fällige Karten und eine abweichende globale Stufe werden abgewiesen. Karte, Thema, Profil und Requestformat werden geprüft; unbekannte Inputfelder sind nicht erlaubt. Eine Selbsteinschätzung bucht weder Punkte noch benoteten Fachfortschritt. Die UI verbirgt die Lösung bis zum Umdrehen, bietet bewusst keine automatische Bewertung an und sperrt weitere Bewertungen bei einem offenen Speicherfehler. Erneutes Laden liest den tatsächlichen Stand, ohne eine Bewertung nachzuholen.

Tests verwenden eine interne explizite Zeit, die nicht über IPC erreichbar ist. Migrationstests öffnen eine echte Schema-5-Datei erneut und prüfen Profil, Stufe, Fortschritt, Antwort-Replay, Abzeichen, Punkte und offene Spielrunde. Rollback wird sowohl beim Upgrade als auch bei einer fehlgeschlagenen Bewertung geprüft. Die Geräteuhr kann Fälligkeiten beeinflussen; kein manipulationssicheres System oder automatischer Hintergrunddienst.

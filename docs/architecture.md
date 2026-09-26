# Architektur

## Aufbau

Lernwelt ist eine eigenständige Tauri-2-Anwendung. React, TypeScript und Vite stellen die Oberfläche bereit; Rust verwaltet SQLite über rusqlite mit eingebundener SQLite-Version. Es ist kein separater Web- oder Datenbankserver im installierten Produkt notwendig. npm/Vite sind Entwicklungs- und Buildwerkzeuge.

- `src/components/`: UI und sichtbare Lade-, Fehler- und Speicherzustände.
- `src/domain/`: Fach- und Nutzerdatentypen.
- `src/lib/desktop.ts`: typisierte Grenze zu den Tauri-Commands; im Browser expliziter Fehler.
- `src-tauri/src/lib.rs`: begrenzte Commands und lokaler Anwendungszustand.
- `src-tauri/src/database.rs`: Validierung, parametrisierte Abfragen, Migration und Datenbanktests.
- `src-tauri/migrations/`: versionierte SQL-Schemata.

## Zahlenstrahl-Werkstatt (ohne Schemaänderung)

`number-line-5-v1.json` ergänzt die drei bisherigen Pakete um ein eigenes Mathematikthema mit 36 stabilen Aufgaben-IDs. `content.rs` validiert das optionale `numberLine`-Modell: Achsenart, Ablese- oder Markiermodus, ganzzahlige Grenzen und Schrittweite, höchstens zehn Intervalle sowie eindeutige Beschriftungen und Marker auf dem Raster. Ein Zahlenstrahl beginnt bei 0; Zahlengeraden dürfen auch Ausschnitte zeigen. Die Lösung bleibt Teil der bestehenden numerischen Antwortprüfung im Backend.

`get_learning_state` liefert die Diagrammdaten über die vorhandene typisierte Schnittstelle, ohne Antwortschlüssel oder vorweggenommene Lösungserklärung. Die lokal gezeichnete Grafik und die Punktwahl liegen in `NumberLine`; `LearningPanel` hält die unbewertete Antwort und verwendet weiterhin `submit_answer`. Maus, Touch und Pfeiltasten ändern nur die Auswahl. Erst die ausdrückliche Prüfung speichert den Versuch und gegebenenfalls 1/2/3 Punkte. Aufgabenwechsel leeren die Auswahl; bereits bestätigte Lösungen und Request-Replays bleiben durch dieselben Journalregeln geschützt. Keine neue Migration, Berechtigung oder Abhängigkeit. [Inhaltsmatrix](curriculum-number-line-5.md).

## Natur und Technik (Schema 15)

Das dritte Fach verwendet die stabile Subject-ID `nature`. Das separate Paket `nature-5-v1.json` wird zusammen mit Mathematik und Englisch eingebettet und validiert. Jeder Themenbereich erhält die Quelle und den Lehrplanstand seines eigenen Pakets. Aufgaben verwenden die bestehende Rust-Antwortprüfung und dieselbe atomare Fortschritts- und Punktebuchung; neue Commands sind nicht erforderlich.

Migration 015 erweitert die erlaubten Fächer in `learning_progress`, indem sie die Tabelle innerhalb der bestehenden Migrationstransaktion ersetzt und sämtliche bisherigen Zeilen einschließlich Zeitstempel unverändert übernimmt. Profil, Einstellungen und Punktejournale bleiben erhalten. Natur-Aufgaben vergeben einmalig 1/2/3 Punkte entsprechend ihrer Stufe; Request-Replays und wiederholte Lösungen buchen nichts zusätzlich.

Die Fächerübersicht führt zu Fragen und drei frei zugänglichen Lernspielen. Die Lernspiele verwenden lokale SVG-Modelle und fachliche Daten in `src/domain/nature-games.ts`. Sie kosten keine Punkte und vergeben keine Lernpunkte. Der Rundenzustand lebt nur in der Oberfläche und wird beim Verlassen neu gestartet; die gespeicherte globale Stufe bestimmt die angebotenen Spielaufgaben. Das ist ausdrücklich keine gespeicherte Leistungsbewertung. Die üblichen Fachfragen speichern weiterhin ihre Antworten und Fortschritte in SQLite. [Inhaltsmatrix, Quellen und Grenzen](curriculum-nature-5.md).

## Einmaleins-Welten (Schema 14)

Der Einmaleins-Trainer ergänzt den begrenzten Command `configure_multiplication` für Welt, Rechenart, einzelne Reihe, Robotermodell, Farbe, freiwillige Wiederholung und Etappenfortsetzung. Rust validiert Enumwerte, Reihenbereich, Request-ID und erwartete Revision. `get_multiplication_state` ohne Modus lädt die gespeicherte Auswahl. `answer_multiplication` prüft weiterhin die Ergebniszahl im Backend.

`multiplication_settings`, `multiplication_worlds` und `multiplication_robots` speichern Auswahl, Bauetappen und Bauregal. Acht gespeicherte Antworten ergeben eine Etappe; richtige Antworten geben weiterhin je einen Punkt, alle Antworten einen Bauschritt. Am Etappenende bleibt die Welt gesperrt, bis das Kind bewusst weiterbaut. Einstellungen und beide Weltstände bleiben unabhängig von der globalen Schwierigkeit erhalten.

`multiplication_tasks` ordnet jeden Versuch unveränderlich seinen Faktoren, seiner Welt und dem normalen Aufgabencursor oder Wiederholungsdurchlauf zu. Ein Einstellungswechsel legt eine neue Zuordnung an; alte offene Zuordnungen werden ungültig, ohne den normalen Cursor weiterzuschieben. `multiplication_cursors` verwaltet getrennte Positionen für gemischte Aufgaben, einzelne Reihen und Quadrate. `multiplication_review_queue` merkt falsche oder aufgedeckte Aufgaben pro Faktorenpaar vor. Jede erscheint einmal je freiwilligem Durchlauf; eine richtige Antwort entfernt sie. Das ist keine Planung mit Tagesabständen.

Antwort, Punkteeintrag, Bauschritt, eventueller Regalzugang und Cursoränderung liegen in derselben Immediate-Transaktion. Das vorhandene Antwortjournal verhindert Doppelbuchungen. `multiplication_configurations` speichert Einstellungsrequests und deren Payload; Wiederholungen derselben Anfrage sind idempotent, abweichende Wiederverwendung und veraltete Revisionen werden abgewiesen.

Migration 014 erhält historische Antworten und deren Faktorenpläne. Nur unbeantwortete alte Quadratzahlpläne werden ersetzt; neue Pläne verwenden Faktoren 10 bis 20. Historische Antworten bis 25² behalten ihre Lösung und ihre Punkte. Profile, Missionsdaten und bestehende Buchungsjournale werden nicht verändert. Die Oberfläche lädt ausschließlich lokal gebündelte Vektorgrafiken. [Spielregeln, Lehrplan und Grenzen](multiplication-adventures.md).

## Daten und Migrationen

Ein lokales Profil mit stabiler ID 1; Name und Jahrgangsstufe können aktualisiert werden, ohne vorhandenen Fortschritt zu löschen. Fortschritt wird pro Fach und stabiler Kompetenz-ID mit Versuchs- und Trefferzahl gespeichert. `record_attempt` ist nur noch eine interne Datenbankfunktion. Die Oberfläche sendet Antworten über `submit_answer`; Antwortprüfung, Lernfortschritt und Punkte werden gemeinsam in einer Transaktion gespeichert.

SQLite liegt im betriebssystemspezifischen Tauri-Anwendungsdatenverzeichnis. Die Verbindung wird durch einen Mutex serialisiert; SQLite regelt zusätzlich Schreibzugriffe mehrerer Prozesse. Fremdschlüssel sind aktiviert, Sperren haben ein begrenztes Zeitlimit. Die jetzigen kleinen synchronen Commands eignen sich für kurze lokale Operationen; umfangreiche spätere Importe gehören in Hintergrundaufgaben.

`PRAGMA user_version` versioniert das Schema. Migration und Versionswechsel erfolgen in einer Transaktion; höhere Versionen werden abgewiesen. Weitere Migrationen als neue Dateien hinzufügen, vorhandene veröffentlichte Migrationen nicht umschreiben. Jede Änderung mit einer älteren Datenbankfixture und erneutem Öffnen prüfen.

Die Datenbank ist nicht verschlüsselt. Es gibt noch keine Mehrbenutzerverwaltung, Synchronisierung oder integrierte Sicherung. Eine manuelle Sicherung erfolgt bei vollständig beendeter App durch Kopieren der Datenbank. Fehler beim Öffnen werden sichtbar gemeldet; es wird keine leere Ersatzdatenbank angelegt, um einen Fehler zu verdecken.

## Offline und Schnittstellen

Zehn explizite Commands sind für das lokale Hauptfenster erlaubt: `get_profile`, `save_profile`, `list_progress`, `get_learning_state`, `submit_answer`, `redeem_reward`, `set_difficulty`, `get_arcade_state`, `start_game`, `finish_game`. Ein vom Frontend geliefertes `correct`-Flag wird nicht als Antwortbewertung akzeptiert. Auch Vokabeln werden anhand der eingetippten Antwort im Backend geprüft. Rust prüft Eingaben auch dann, wenn das Frontend bereits geprüft hat. Es gibt keinen beliebigen SQL-, Shell- oder Dateisystemzugriff aus der Oberfläche. Das begrenzte Updater-Plugin lädt Versionsinformationen und signierte App-Pakete vom konfigurierten Release-Endpunkt. Produktions-CSP und lokal gebündelte Assets vermeiden externe Ressourcen. Die Entwicklungs-CSP erlaubt nur zusätzlich Vite/HMR auf der Loopback-Adresse.

## Lehrplaninhalte ergänzen

Lehrplaninhalte getrennt von Nutzerdaten als versionierte Pakete pflegen. Vor einem Import ein überprüfbares Schema einführen: stabile ID, Fach, Jahrgangsstufe, Lernbereich, Kompetenz, Quellen-URL, Lehrplanstand, Inhaltsversion und bei Englisch Fremdsprachenfolge. Offizielle Grundlage ist [LehrplanPLUS Bayern](https://www.lehrplanplus.bayern.de/). Ein technisches Beispiel stellt keine fachliche Vollständigkeit sicher.

Das erste Paket liegt in `src-tauri/content/curriculum-v1.json` und wird über `include_str!` offline eingebunden. `content.rs` liest es einmalig, validiert Metadaten, IDs und Antworten und trennt es von der Punktebuchung in `learning.rs`. Topics können zusätzlich strukturierte Lerntafeln mit Caption, Spalten, Zeilen und Erklärung enthalten. Die UI rendert daraus zugängliche HTML-Tabellen; Rust validiert nichtleere Beschriftungen und konsistente Zeilenbreiten. Das optionale Feld benötigt keine Nutzerdatenmigration. Topics tragen Jahrgangsstufe, Lehrplanbezug und ggf. Fremdsprachenfolge; Aufgaben verweisen auf Topic, Kompetenz, Stufe und eine unveränderliche Versions-ID. Quelle und Abrufstand gelten paketweit für die Mathematikzuordnung; Englisch ist ausdrücklich als Beispiel ohne vollständige Zuordnung markiert.

Die IPC-Projektion liefert Aufgaben ohne Lösungsschlüssel. Rust bewertet Zahlen über exakte Dezimalnormalisierung (keine Fließkomma-Rundung, kein `eval`), Text ohne ASCII-Großschreibung und Auswahlantworten exakt. Einheiten werden durch die Fragestellung vorgegeben. Antwort- und Requestvalidierung, Journal und Idempotenz gelten für alle Stufen. Die vier ursprünglichen Beispiel-IDs behalten ihre Antworten; die beiden Mathematikbeispiele werden in der neuen Themenauswahl nicht angezeigt, bleiben aber für alte Request-Replays erreichbar. Geänderte Antwortbedeutungen benötigen neue Aufgaben-IDs.

Die UI wählt Thema und Stufe, zeigt Tipps, Rückmeldung und lösbare Teilaufgaben. Papieraktivitäten mit Selbstkontrolle ergänzen geometrische Konstruktionen und das Erklären von Rechenwegen; sie lösen keine Punktebuchung aus. Die freie Themenauswahl hat keine adaptive Wiederholungsplanung. Die geführte Lernrunde ergänzt eine eigene begrenzte Planung (siehe unten). Audio und KI sind nicht enthalten.

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

Rust bestimmt die Prämie anhand von `exercise.difficulty`: Vorschule 1, Könner 2, Streber 3. Die aktuell gewählte Einstellung und vom Frontend übergebene Werte ändern diese Zuordnung nicht. `get_learning_state` liefert `pointsByDifficulty` für alle drei Stufen; die UI zeigt damit auch nach einem Stufenwechsel sofort die passende Prämie. Falsche Antworten oder neue Versuche auf bereits gelöste Aufgaben geben weiterhin 0 zusätzliche Punkte.

Migration 005 erweitert die erlaubten Beträge in `answer_submissions` auf 0/5/10/15. Alle alten Antworten einschließlich Request-ID, Betrag und Zeitstempel werden in derselben Transaktion erhalten. Das Journal wird nicht neu bewertet: alte 10-Punkte-Gutschriften bleiben bestehen und alte Requests liefern weiterhin ihren damals gespeicherten Betrag, ohne nochmals zu buchen. Abzeichen und Spiele behalten ihre Preise.

## Englisches Lernpaket

`english-5-v1.json` ergänzt das Mathematikpaket als separates eingebettetes Paket. Der Loader validiert beide Pakete und danach den gemeinsamen Katalog (einschließlich global eindeutiger IDs). Er ergänzt jeden Topic mit der Quelle und dem Lehrplanstand seines Pakets; Englisch zeigt dadurch seine eigene Quelle. Historische Englischbeispiele bleiben nur für alte Requests/Journalverweise erhalten. Keine Schemaänderung oder neue Berechtigung.

## Vokabeltrainer und Wiederholungen

Zwei weitere begrenzte Commands: `get_vocabulary_state(deckId)` und `review_vocabulary(input)`, insgesamt zwölf Commands. `vocabulary.rs` lädt und validiert das eingebettete Paket `vocabulary-5-v1.json`. Paketmetadaten enthalten Fach, Klasse, Fremdsprachenfolge, Quelle/Stand und Orientierung; Karten stabile IDs, Thema, Kompetenz, Übersetzung, Beispielsatz und konsistente Satzlücke. Beide Commands sind in Handler, Buildmanifest und Capability eingetragen.

Migration 006 ergänzt nur `vocabulary_progress` und `vocabulary_reviews`. Fortschrittsschlüssel: Profil + Karte + Schwierigkeit. Gespeichert werden Fach 1–5, Bewertungszähler und Fälligkeit als Unixsekunden. Falsche Antwort oder Aufdecken → Fach 1 / 60 Sekunden; richtige Antwort → nächstes Fach, maximal 5 / 1, 3, 7, 14 Tage. Backend-Systemzeit bestimmt Fälligkeit, keine vom Client gelieferte Uhr oder Fachnummer. Fällige Wiederholungen werden nach ältestem Termin vor neuen Karten gewählt, Themenfilter respektiert. Unbekannte frühere Kartenstände werden bei einer künftigen Paketänderung nicht gelöscht.

Bewertung und Request-Beleg werden in einer Immediate-Transaktion gespeichert. Eindeutige Request-ID + unveränderte Nutzlast ermöglicht gefahrlose Wiederholung nach unklaren Transportfehlern. `expectedReviews` verhindert verlorene Updates durch alte Ansichten oder mehrere Prozesse; noch nicht fällige Karten und eine abweichende globale Stufe werden abgewiesen. Karte, Thema, Profil und Requestformat werden geprüft; unbekannte Inputfelder sind nicht erlaubt. Seit Schema 7 ersetzt automatische Antwortprüfung die Selbsteinschätzung. Die UI verbirgt die deutsche/englische Lösung bis zum Prüfen oder freiwilligen Aufdecken und sperrt weitere Antworten bei einem offenen Speicherfehler. Sie zeigt das bestätigte Ergebnis vor dem Laden der nächsten Karte. Erneutes Laden liest den tatsächlichen Stand, ohne eine Bewertung nachzuholen.

Tests verwenden eine interne explizite Zeit, die nicht über IPC erreichbar ist. Migrationstests öffnen eine echte Schema-5-Datei erneut und prüfen Profil, Stufe, Fortschritt, Antwort-Replay, Abzeichen, Punkte und offene Spielrunde. Rollback wird sowohl beim Upgrade als auch bei einer fehlgeschlagenen Bewertung geprüft. Die Geräteuhr kann Fälligkeiten beeinflussen; kein manipulationssicheres System oder automatischer Hintergrunddienst.


## Geprüfte Vokabelantworten und Punkte (Schema 7)

370 Karten enthalten explizite englische und deutsche Antwortvarianten. Die bisherigen 120 Karten behalten ihre bisherigen Felder/IDs und bekommen zusätzliche Antwortlisten. `vocabulary.rs` vergleicht Großschreibung, Leerraum und Apostroph-/Bindestrichtypografie normalisiert; am Ende sind Satzzeichen `.?!` toleriert. Deutsch erlaubt zusätzlich einen vorangestellten Artikel. Keine Levenshtein-/KI-Näherung. Die vollständigen Variantenlisten werden nicht über IPC ausgegeben. Vorschule erwartet Deutsch, Könner/Streber Englisch. Die Vorschule zeigt zur Bedeutungsabgrenzung den englischen Beispielsatz. Andere passende Umschreibungen können außerhalb der hinterlegten Liste liegen.

`ReviewInput.answer` enthält eingegebenen Text oder explizit `null` für freiwilliges Aufdecken. Das bisherige `known`-Flag wird nicht mehr als Input akzeptiert. Die vorhandene Spalte `known` enthält für neue Belege das Backend-Prüfergebnis. Antworttext, 0/1 Punkte und `automatically_checked` werden durch Migration 007 ergänzt; alte Belege bleiben mit 0 Punkten und ohne automatisches Prüfsiegel erhalten. Eine neue Antwort darf keinen alten Selbstbewertungsbeleg wiederverwenden.

Migration 007 kopiert alle Spalten des Punktejournals unverändert und erlaubt zusätzlich die Buchungsart `vocabulary` ausschließlich mit Betrag +1. Der Journalschlüssel ist die Request-ID: Jede neue korrekte fällige Antwort gibt 1 Punkt, Replays geben das gespeicherte Ergebnis zurück, ohne neu zu buchen. Fortschritt, Beleg und Journal liegen in derselben Immediate-Transaktion. Ein Fehler bei irgendeinem Insert rollt alles zurück. Keine rückwirkende Neuberechnung. `ReviewResult` enthält das bestätigte Prüfergebnis und den vergebenen Betrag, der neue Kartenstatus das gemeinsame Wallet und die tatsächliche Gesamtzahl aller Karten. Bestehende Spiel-/Belohnungslogik nutzt dieses Guthaben ohne Sonderweg.

## Kleinere Lernprämien (Schema 8)

Migration 008 erlaubt zusätzlich 1/2/3 in Antwortbelegen. Alle historischen Beträge, Request-IDs und Zeitstempel bleiben erhalten. Neue richtige Lernaufgaben erhalten 1/2/3 nach Aufgabenstufe; gespeicherte Replays liefern den damaligen Betrag. Vokabeln bleiben bei 1 Punkt, Spiel- und Abzeichenpreise unverändert.

## Einmaleins-Trainer (Schema 9)

`multiplication.rs` erzeugt 100 geordnete Faktorenpaare von 1–10 und 25 Quadratzahlen von 1–25. Feste bijektive Permutationen liefern pro Runde jede Aufgabe genau einmal. Stabile fachliche IDs enthalten Rechenart, Faktoren und Inhaltsversion; Sequenznummern unterscheiden neue Übungsversuche. Metadaten enthalten Fach, Jahrgang, Kompetenz, Quelle und Zuordnungsstand. Eine Änderung der v1-Folge oder Antwortbedeutung benötigt eine neue Inhalts-/Belegversion.

Zwei weitere begrenzte Commands: `get_multiplication_state(mode)` und `answer_multiplication(input)`, in Rust-Handler, Buildmanifest und Capability eingetragen. Frontend liefert nur Rechenart, Aufgaben-Sequenz und Antwort (oder null zum Aufdecken). Backend erlaubt nur Ziffern mit äußerem Leerraum, berechnet das Produkt selbst und prüft Profil, Modus und aktuelle Sequenz. Antworttext und Richtig-Ergebnis werden in `multiplication_answers` gespeichert. Der nächste Aufgabenstand folgt aus dem letzten Beleg je Profil und Rechenart.

Belegschlüssel `(profile_id, mode, sequence)` erlaubt genau eine Bewertung je angebotenem Versuch. Identische Wiederholungen liefern das ursprüngliche Ergebnis und aktuelles Guthaben, abweichende Antworten auf alte Versuche werden abgewiesen. Jeder korrekte neue Versuch bucht +1 in `point_entries` mit Art `multiplication`; Beleg und Journal liegen in derselben Immediate-Transaktion. Zwei Verbindungen können denselben Versuch nicht doppelt buchen. Falsch/Aufdecken speichert den Versuch ohne Punkte; Korrektur nach gezeigter Lösung gibt keine Punkte für denselben Versuch.

Migration 009 erhält alle bisherigen Journalzeilen einschließlich IDs und Zeitstempel und erweitert die erlaubten Arten um `multiplication` mit exakt +1. Neues Antwortjournal getrennt vom Curriculum- und Vokabelfortschritt. UI hält die bestätigte Rückmeldung bis zum bewussten Weitergehen; Speicherfehler behalten die identische Antwort für Retry, Neuladen holt den bestätigten Stand. Profilwechsel/Unmount ignorieren veraltete Antworten. Keine zusätzlichen Abhängigkeiten, keine externe Kommunikation, keine Zeitvorgaben.
## Quadratzahlenrunden (Schema 10)

Migration 010 ergänzt `square_round_tasks` (Profil, globale Versuchsequenz, Faktor, Rundennummer und Position). Jede neue Quadratzahlenrunde materialisiert genau 20 Versuche: SQLite `random()` wählt fünf verschiedene Faktoren aus 1–25, danach werden vier Kopien jedes Faktors zufällig sortiert. Keine neue Zufallsbibliothek. Runde und Reihenfolge werden einmal innerhalb einer Immediate-Transaktion gespeichert und bei erneutem Laden unverändert gelesen. Auch parallele Verbindungen erhalten denselben Plan. Der Lese-Command kann dafür eine neue Runde anlegen; ohne Profil entstehen keine Aufgaben.

Neue Quadratzahlenaufgaben tragen Inhaltsversion v2; die v1-Folge bleibt für historische Antwort-Replays und das 100er-Einmaleins verfügbar. Vorhandene Belege/Journalzeilen werden nicht umgeschrieben. Neue Runden beginnen an der nächsten freien Versuchsequenz, Rundennummer 1 startet unabhängig von der alten Gesamtstatistik. Das Backend liefert `round`, `position` und `roundSize` pro Aufgabe; die Oberfläche berechnet die Anzeige nicht aus der historischen Sequenz. Die Rückmeldung der letzten Aufgabe bleibt bis zum Weitergehen der abgeschlossenen Runde zugeordnet.

Die letzte Antwort, ihr Punkt und die Vorbereitung der folgenden Runde werden gemeinsam atomar gespeichert. Bei einem Fehler wird alles zurückgerollt; die vorherige Aufgabe bleibt für Retry verfügbar. Bereits bestätigte Antworten erhalten bei Replay ihre ursprüngliche Lösung über den gespeicherten Faktor (v2) bzw. die v1-Permutation, ohne einen weiteren Punkt zu buchen. Alle bisher angebotenen v2-Aufgaben bleiben dafür gespeichert.

## Quadratzahlen ab 10 (Schema 11)

Neue Runden wählen fünf Faktoren aus 10–25. Migration 011 entfernt ausschließlich noch unbeantwortete Aufgabenpläne, sodass auch direkt nach dem Update keine alte offene Aufgabe unter 10 angeboten wird. Beantwortete Faktoren bleiben für Replays unverändert; Statistik und Guthaben bleiben erhalten. Die erste neu angelegte Runde startet nach der letzten beantworteten Sequenz mit einer neuen Rundennummer. Die sichtbare Bezeichnung des unveränderten kleinen Einmaleins lautet „10er-Einmaleins“.


## Sternenlabyrinth (Schema 12)

Migration 012 erweitert die Spiel-IDs um `maze` und erhält sämtliche alten Sessions mit IDs, Scores und Zeitstempeln sowie den Index für genau eine offene Runde. `runner` darf nur als bereits bezahlte Session wiederholt werden; neue Käufe sind gesperrt. Neue Labyrinth-Bestwerte sind von historischen Läufer-Scores getrennt. Keine Änderung an Eintritt oder Punktekonto.

Ein deterministisch gesetzter Zufallsgenerator erstellt pro neuem Spielstart ein verbundenes 15×15-Labyrinth mit zusätzlichen Rundwegen. Alle Sterne, Roboter und der Ausgang liegen auf erreichbaren freien Zellen; die Karte berechnet einen kürzesten Weg zum nächsten Stern. Die Engine validiert Kollisionen und Sichtlinien; Blasen treffen keine Roboter durch Wände. Der Canvas zeichnet Wände per Raycasting und verdeckt Sprites anhand der Wandtiefe. Eigene lokale Vektorgrafik, keine Bibliothek und keine Originalassets. Spielstände bleiben wie bisher nur als Eintritt/Abschluss gespeichert; ein wiederaufgenommenes Spiel beginnt mit neuer Welt.

Zeitlimits: Blöcke 240 Sekunden, Hühner 90 Sekunden, Labyrinth 240 Sekunden. Sternenwache hat sechs statt drei Wellen, jedoch keine feste Zeitbegrenzung. Animation und Zeit laufen ausschließlich bei aktivem, fokussiertem Spiel.

## Kompakte Ansichten

`InfoPanel` verwendet native modale HTML-Dialoge mit Escape, Fokus-Rückgabe und optionaler Seitennavigation. Erklärungen/Mitmachaufgaben werden in getrennten Seiten angeboten; `LearningTable` zeigt acht Zeilen pro Abschnitt. Fehler beim Einlösen bleiben im geöffneten Belohnungsfenster sichtbar. Automatisch geöffnete Antwort-Rückmeldungen führen den Fokus nach Weitergehen zurück zur stabilen Übungsregion, auch wenn sich die Aufgabe ändert.

Desktop-Layouts stellen Einstellungen und Übung nebeneinander und begrenzen die Canvasgröße anhand der Fensterhöhe. Keine globale Scrollsperre: kleine Fenster, Zoom und außergewöhnlich lange Fehler behalten einen zugänglichen Overflow-Fallback. Standardfenster 1100×750, bisherige Mindestgröße bleibt erhalten. Keine Änderung an Datenbank oder Commands durch die Layoutumstellung; Profilhinweise im Backend verweisen nun auf den oberen Profilknopf.

## Geführte Lernrunde (Schema 13)

`mission.rs` liest das offline eingebundene Inhaltspaket `mission-garden-v1.json`. Drei Stufen mit je drei Varianten bilden ein erstes Thema, den Rechteckumfang. Antwortschlüssel, Tipps vor ihrer Anforderung und Lösungswege vor der Rückmeldung bleiben im Backend. Das Frontend erhält die Metadaten, das Themenalbum, die Wiederholungsfälligkeit, das gemeinsame Guthaben und den aktuellen Schritt.

Drei begrenzte Commands sind in Handler, Buildmanifest und Capability registriert: `get_mission_state`, `start_mission(input)` und `act_mission(input)`. Aktionen sind Antworten, Tipp, Aufdecken, Weiter und Überspringen der optionalen Mitmachaufgabe. Rust prüft Profil, globale Stufe, Session-ID, Schrittnummer, erlaubte Aktion und Antwort. Nur passende Übergänge sind möglich. Die UI behält bei einem unklaren Speicherfehler dieselbe Request-ID und Nutzlast für den Retry oder lädt ausdrücklich den bestätigten Stand neu.

Migration 013 ergänzt vier Tabellen: `mission_progress` für beobachtete Selbstlösungen und Fälligkeiten, `mission_sessions` für den Rundenstand je Thema und Stufe, `mission_steps` für Hilfen und bestätigte Ergebnisse sowie `mission_requests` für idempotente Aktionsbelege. Ein Index erlaubt je Thema und Stufe nur eine offene Runde. Die bestehenden Tabellen und Buchungen werden nicht neu bewertet. Ein Stufenwechsel setzt die offene Runde der anderen Stufe nicht zurück.

Jede Aktion, ihr Beleg, der Fortschritt und etwaige Punkte werden gemeinsam in einer Immediate-Transaktion gespeichert. Die gemeinsame Funktion `learning::record_exercise_result` erhält die Erstlösungsregel des bestehenden Punktejournals. Wiederholte Antworten auf dieselbe stabile Aufgaben-ID bringen keine zusätzlichen Punkte; ein identischer Request bucht weder einen weiteren Versuch noch einen weiteren Schritt. Derselbe Request mit abweichenden Argumenten wird abgewiesen. Der Replay liefert den aktuellen bestätigten Rundenstand, auch wenn inzwischen weitergearbeitet wurde.

Die Runde beginnt mit einem Abruf vor dem Beispiel. Zeitversetzter Erfolg verlangt eine selbstständige erste Antwort auf eine andere Variante, eine frühere Selbstlösung und mindestens einen Tag Abstand zur letzten Lernaktion auf dieser Stufe. Tipps und Aufdecken werden gespeichert, bevor sie angezeigt werden. Ein bloßer Rundenabschluss oder eine Mitmach-Selbstauskunft ist kein automatischer Kompetenznachweis. Die Wiederholungsplanung nutzt die Gerätezeit; eine Manipulation der lokalen Uhr ist nicht abgesichert.

Weitere Hinweise zu Inhalt, Bedienung und Forschungsgrenzen: [Geführte Lernrunde](learning-missions.md).

## Signierte App-Updates

`AppUpdates` bleibt über Ansichtswechsel hinweg aktiv. Es prüft einmal beim Start, sofern die lokal in der Webview gespeicherte Einstellung das erlaubt. `lib/updater.ts` kapselt die offiziellen Tauri-Updater-/Process-APIs, begrenzt Prüfungen auf 15 Sekunden und Downloads auf drei Minuten. Die feste HTTPS-URL und der öffentliche Signaturschlüssel liegen in `tauri.conf.json`. Downloads/Installation und Neustart benötigen ausdrückliche Bedienaktionen; der Lernbetrieb funktioniert ohne Netzwerk. Profil, SQLite-Daten und Lernantworten werden nicht übertragen. Der Release-Workflow veröffentlicht erst nach drei erfolgreichen Plattformbuilds ein vollständiges Manifest. [Ablauf und Grenzen](app-updates.md).

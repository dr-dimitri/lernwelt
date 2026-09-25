# Review zu Issue #72

## Umfang und Reviewart

Separater unabhängiger Agentenreview durch `audit_persistence` am 25.09.2026. Der Reviewer war nicht an der Produktimplementierung dieses Issues beteiligt. Geprüft wurde der vollständige Arbeitsdiff gegen `origin/main`, einschließlich der neu angelegten Dateien: Migration 014, Adventure-Backend und Tests, React-Oberfläche, SVG-Grafiken, CSS, IPC-Typen und Berechtigungen sowie README und Fachdokumentation.

Grundlage sind die Akzeptanzkriterien von Issue #72 und die Projektvorgaben. Der Review umfasst beide Welten, acht Aufgaben je Bauetappe, freie Reihen-/Moduswahl, optionale Bildhilfen, freiwillige Wiederholung, Personalisierung, Punkte, historische Daten, Tastaturabläufe und Fehlerbehandlung.

## Datenhaltung und fachliche Prüfung

- Migration 014 erweitert das Schema innerhalb der vorhandenen Migrationstransaktion. Historische Antworten, Buchungen, Profile und Missionsdaten bleiben erhalten. Ausschließlich unbeantwortete alte Quadratpläne werden entfernt; neue Pläne enthalten Faktoren von 10 bis 20. Ein gespeichertes historisches `25 × 25 = 625` bleibt unverändert wiederholbar. Der Migrationstest prüft auch den Erhalt einer vorhandenen Mission; ein provozierter Migrationsfehler erhält Schema 13 und den alten offenen Quadratplan.
- Neue Versuchssequenzen und fachliche Cursor sind getrennt. Ein Welt-, Reihen- oder Gestaltungswechsel macht die offene Zuordnung ungültig, ohne die normale Aufgabenfolge voranzuschieben. Wiederholungen verändern ebenfalls nicht den normalen Cursor. Getrennte Reihen enthalten jeweils alle zehn rechten Faktoren, der gemischte Durchlauf weiterhin alle 100 Paare. Zufällige Quadratpläne bleiben beim Wiederöffnen und bei Umwegen über Weltwechsel bzw. Wiederholung stabil.
- Antwortbeleg, Lernpunkt, Bauschritt, Regalzugang und nächste Zuordnung liegen in derselben Immediate-Transaktion. Nur eine neue richtige Antwort vergibt einen Punkt. Falsche und aufgedeckte Antworten bauen ohne Punkt weiter. Identische Replays ändern weder Guthaben noch Weltstand oder Roboterzahl. Rollbacktests decken Fehler beim Journal und beim achten Bauschritt ab; vorhandene Tests prüfen konkurrierende Verbindungen.
- Einstellungen validieren Enums, Reihe, Request-ID und erwartete Revision. Derselbe Konfigurationsrequest ist idempotent; andere Nutzlast bei gleicher ID und veraltete Änderungen werden abgewiesen. Fehlgeschlagene Konfigurationen erhalten die bisherige Aufgabe und Auswahl.
- Beide Welten speichern ihren Fortschritt separat. Nach acht Versuchen ist eine bewusste Fortsetzung erforderlich, auch nach Neustart. Fertige Roboter behalten Modell und Farbe. Die dokumentierten Lernziele unterscheiden Übungsfortschritt von Kompetenzbeherrschung; neue Inhalte sind Mathematik 5 zugeordnet, ohne vollständige Lehrplanabdeckung zu behaupten.

## Oberfläche, Inhalte und Fehlerpfade

Die Hauptansicht zeigt eine Aufgabe, eine Bauwelt und acht auch textlich zugängliche Bauschritte. Bauplan, Bauregal und optionale Rechentipps nutzen Dialoge. Die lokal gerenderten SVG-Grafiken benötigen keine externen Ressourcen oder Animationen. CSS lässt schmale Ansichten umbrechen und berücksichtigt reduzierte Bewegung. Gruppen-/Teilflächenbilder und ihre Beschriftungen erklären die Faktoren bzw. das Zerlegen; das Produkt wird vor dem Prüfen nicht als Lösung ausgegeben.

Der Tastaturablauf führt von Enter zur Rückmeldung und über die nächste Aufgabe zurück ins Eingabefeld. Erstladen übernimmt nicht den Fokus der App-Navigation. Pause, Abschlusszustand, Neuladen und erfolgreiche Bauplanänderungen erhalten passende Fokusziele. Lade-/Speicherfehler bleiben sichtbar; ein offener Retry sperrt konkurrierende Änderungen und verwendet unveränderte Argumente. Konfigurationsfehler stehen im geöffneten Dialog und bleiben nach dessen Schließen außerhalb erreichbar. Veraltete Lade-/Speicherantworten nach Profilaktualisierung werden verworfen.

## Befunde und Korrekturen vor Freigabe

1. **P2, im noch unfertigen Implementierungsstand:** Der Knopf „Pause machen“ entfernte sich nach Aktivierung, ohne den angeforderten Fokusübergang auszulösen. `paused` wurde in die Effektabhängigkeiten aufgenommen. Der Regressionstest verlangt nun Fokus auf „Dein Bauwerk wartet auf dich.“.
2. **P2, Integrationsbefund:** Panel und Inselgrafik verwendeten unterschiedliche Bauwerkslisten. Panel, Bauregal und Grafik verwenden jetzt dieselbe exportierte Liste. Etappenüberschrift und Bildbeschreibung stimmen überein.
3. Zusätzlich im Implementierungsdurchgang korrigiert und im Gesamtreview geprüft: Die Szene einer gerade abgeschlossenen Roboteretappe darf bei Wahl des nächsten Designs nicht rückwirkend ihr Aussehen ändern. Gespeicherte Angaben zum zuletzt fertigen Roboter und entsprechende Backend-/Frontendtests sichern dies ab. Der Fokus nach Schließen eines fehlgeschlagenen Bauplans führt zum erreichbaren Fehler samt Retry.

Diese Korrekturen vervollständigen Issue #72; sie betreffen keine separat vorgefundenen Produktfehler auf `main`. Im final geprüften Stand bestehen keine offenen Reviewbefunde.

## Eigenständig ausgeführte Prüfungen

- `npm run test`: zunächst 124 Frontendtests; nach den unten dokumentierten Ergänzungen 125 Frontendtests in 15 Dateien und 2 Workflowtests erfolgreich.
- `npm run format:check`: erfolgreich. Ein erster Prüflauf fand Formatierungsreste in den beiden Panel-Dateien; nach Korrektur durch den Implementierungsagenten erneut erfolgreich geprüft.
- `npm run build`: TypeScript-Prüfung und Vite-Produktionsbuild erfolgreich.
- `cargo test --manifest-path src-tauri/Cargo.toml --locked`: 92 Tests erfolgreich, darunter 14 neue Adventuretests.
- `cargo fmt --manifest-path src-tauri/Cargo.toml --check`: erfolgreich.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings`: erfolgreich.
- `git diff --check`: erfolgreich.

## Nachreview der abschließenden Ergänzungen

Der unabhängige Reviewer hat anschließend die folgenden Änderungen erneut geprüft und freigegeben:

- Die Übungsstatistik verwendet bei genau einer Antwort „1 Aufgabe geübt“, ansonsten den Plural. Zahlenwerte und Buchungen ändern sich nicht.
- Der optionale Dialog „Rechenweg ansehen“ ist erst nach bestätigter Antwort bzw. bewusstem Aufdecken vorhanden. Er zeigt das Gruppen-/Teilflächenbild und ausgerechnete Teilprodukte. Die gemeinsame Funktion `multiplicationParts` hält Bild und Rechenzeile konsistent, einschließlich des Falls mit nur einer Gruppe. Die letzte Zahl stammt aus der bestätigten Backend-Lösung. Der neue Regressionstest prüft nach einer falschen Antwort `6 × 7 = 5 × 7 + 1 × 7 = 35 + 7 = 42`, den fehlenden Lösungsdialog vor dem Prüfen, keine zweite Antwortbuchung und den Fokus nach dem Schließen.
- Der Bauplan stellt die drei Modelle bei höchstens 680 CSS-Pixeln in zwei Spalten dar. `min-width: 0`, `overflow-wrap: anywhere` und automatische Silbentrennung erlauben lange Modellnamen auch im schmalen Dialog. Die Änderung betrifft ausschließlich das Layout. Der koordinierende Agent prüft den abschließenden nativen Stand zusätzlich bei 420 × 600 Pixeln.

Nach diesen Änderungen führte der Reviewer `npm run check` vollständig erneut aus: Formatierung, 125 Frontendtests, 2 Workflowtests, TypeScript und Produktionsbuild erfolgreich. `git diff --check` bleibt fehlerfrei. Keine neuen oder offenen Befunde; die Freigabe umfasst diese Ergänzungen. Die unveränderten Rust-Dateien benötigten keinen erneuten Lauf der bereits erfolgreichen Backend-Prüfungen.

## Freigabe und Grenzen

Der unabhängige Quellcode-, Verhaltens- und Datenhaltungsreview ist abgeschlossen und gibt den geprüften Stand frei. Nativer Build/Starttest, native Sichtprüfung und CI-Ergebnisse werden vom koordinierenden Agenten vor dem Merge ergänzt und müssen erfolgreich sein. Der Reviewer hat selbst keine zusätzliche native macOS-/Windows-Sichtprüfung durchgeführt. jsdom bildet die echte modale Fokussperre nicht vollständig ab. Es gab keine Prüfung mit Kindern und keine Untersuchung langfristiger Lerneffekte. Der Issueabschluss setzt den Merge voraus.

## Native Ergänzung durch den koordinierenden Agenten

Am 25.09.2026 wurde ein macOS-Release mit getrenntem Bezeichner `de.lernwelt.review72` und ausschließlich synthetischem Profil gebaut und nativ gestartet. Die bestehenden Lernwelt-Nutzerdaten wurden nicht verwendet.

- Bei 1100 × 750 Pixeln Werkstatt, originale SVG-Grafik und optionalen Tipp geprüft; Escape führte zum Antwortfeld. Acht Aufgaben einschließlich einer falschen Antwort ergaben einen fertigen Roboter und genau sieben Punkte. Pause erhielt den Fokus auf der Pausenüberschrift.
- Neuer Bauplan mit Gartenmodell, violetter Farbe und 7er-Reihe ließ den fertigen mintgrünen Entdecker unverändert. Das Bauregal zeigte genau diesen Roboter.
- Wechsel zur Insel begann mit eigenem Stand. Acht Aufgaben einschließlich einmaligem Aufdecken bauten die Brücke und ergaben sieben weitere Punkte. Die vorgemerkte Aufgabe 7 × 4 erschien in der freiwilligen Wiederholung, eine richtige Antwort beendete den Durchlauf. Die normale Folge setzte anschließend bei 7 × 10 fort.
- Quadratzahlenmodus zeigte 19 × 19; der Tipp zerlegte in 10 × 19 und 9 × 19. Antwort 361 vergab genau einen Punkt. Nach App-Ende und Neustart blieben 16 Punkte, Inselstand, Gestaltung und die nächste Aufgabe 15 × 15 erhalten.
- Release erneut bei 420 × 600 Pixeln gestartet. Navigation, Aufgabe, Dialoge und ihre unteren Bedienelemente waren per vertikalem Scrollen erreichbar. Zu lange Modellnamen im ersten schmalen Bauplan wurden mit zwei Spalten und Wortumbruch korrigiert; final nativ ohne abgeschnittene Modellnamen geprüft.
- Abschließender Rechenwegdialog nach absichtlich falscher Antwort 0 zu 15 × 15 zeigte die passenden Teilflächen sowie `10 × 15 + 5 × 15 = 150 + 75 = 225`. Keine Punktegutschrift, ein Bauschritt; Escape gab den Fokus an „Rechenweg ansehen“ zurück. Der letzte Stand wurde als nativer Release gebaut und gestartet.

125 Frontendtests und 2 Workflowtests sowie TypeScript/Vite und Formatierung sind nach den letzten Ergänzungen erneut grün. 92 Rusttests, Rustfmt und Clippy sind für den unveränderten finalen Backendstand grün. Die erforderlichen macOS-/Windows-CI-Jobs werden vor dem Merge am PR kontrolliert; nur ein vollständig grüner Stand darf gemergt werden. Eine zusätzliche interaktive Windows-Prüfung und eine gesonderte Prüfung mit vergrößerter Systemschrift wurden nicht durchgeführt. Die Anpassung an schmale Fenster und die CSS-Regeln wurden wie oben beschrieben geprüft.

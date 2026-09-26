# Review zu Issue #80

## Umfang und Reviewart

Separater unabhängiger Review durch Agent `review` am 26.09.2026. Der Reviewer war nicht an der Produktimplementierung beteiligt. Geprüft wurden der vollständige Diff gegen `origin/main`, sämtliche neuen Dateien und die Akzeptanzkriterien von [Issue #80](https://github.com/dr-dimitri/lernwelt/issues/80). Dazu gehören Zahlenlinienkomponente, Einbindung in die Fachfragen, Rust-Diagrammvalidierung und IPC-Projektion, 36 neue Aufgaben, drei Mitmachaufgaben, Tests und Dokumentation.

Die Zahlenstrahl-Werkstatt ergänzt ein neuntes Mathematikthema. Jede Stufe enthält zwölf Aufgaben, davon vier zum Markieren. Die Darstellung entsteht lokal aus begrenzten Diagrammdaten. Antwortprüfung und einmalige 1/2/3-Punktebuchung verwenden die bestehenden Rust-Commands. Es gibt keine neue Abhängigkeit, Berechtigung, Datenbankmigration oder Netzwerkfunktion. Bestehende Inhaltsdateien und Aufgaben-IDs bleiben unverändert.

## Fachlicher Einzelreview

Der Reviewer hat die [offizielle LehrplanPLUS-Quelle für Mathematik 5](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik) unabhängig geöffnet. Die Zuordnung zu M5 1.1 und die ergänzende Veranschaulichung von Bewegungen nach M5 1.2 sind nachvollziehbar. Alle 36 Aufgaben wurden einzeln anhand von Grenzen, Schrittweite, Beschriftungen und Markerpositionen nachgerechnet. Frage beziehungsweise Markierauftrag, Tipp und Lösungsweg wurden zusammen auf Vollständigkeit, Eindeutigkeit, Verständlichkeit und unbeabsichtigte Lösungshinweise geprüft. Alle Antworten stimmen.

Die Inhalte unterscheiden Zahlenstrahlen ab 0 von beidseitig fortgesetzten Zahlengeraden und deren Ausschnitten. Ablesen, Platzieren, Skala, Abstand, Anzahl kleiner Abstände, Vergleichen und Bewegungen sind vertreten. Negative Zahlen, große Zahlen bis eine Million und unterschiedlich skalierte Ausschnitte steigern den mathematischen Anspruch. Die drei nummerierten Mitmachaufgaben ergänzen eigenes Zeichnen, Bewegen einer Figur und Erklären einer Skala. Sie werden selbst geprüft und vergeben keine Punkte.

## Befunde und Korrekturen

- **Abstand und Anzahl der Abstände:** Der Begriff „Zahlenschritt“ war gegenüber einem gezeichneten kleinen Abstand nicht unmittelbar eindeutig. Die Hinweise zu allen drei Abstandsfragen erklären jetzt ausdrücklich: Ein Zahlenschritt bedeutet 1. Lerntext, Großzahlenhinweis und Mitmachkontrolle verwenden für unterschiedliche Skalen konsistent „Zahlenunterschied“. Nachprüfung: keine widersprüchliche Verwendung mehr; die Antworten bleiben unverändert.
- **Aufgabenzählung in der Inhaltsdokumentation:** Die ursprüngliche Beschreibung der letzten Streber-Aufgabe passte nicht zur tatsächlichen Verteilung. Sie beschreibt nun richtig die Verbindung von Wegberechnung und anschließendem Markieren. Alle Stufen besitzen weiterhin vier Markieraufgaben.
- **Große Beschriftungen und Eingabeformat:** Der implementierende Agent hat vor dem Abschluss Randabstände und Mindestabstände an die Beschriftungslänge angepasst. Tausender werden mit geschützten Leerzeichen statt Punkten dargestellt und passen damit zur bestehenden numerischen Eingabeprüfung. Die unabhängige Code-Nachprüfung und der Großzahlentest bestätigen die Darstellung und Textalternative.
- **Tastaturwahl am schmalen rechten Rand:** Die mobile Sichtprüfung des Hauptagenten zeigte, dass der automatische Fokusscroll zwar den letzten Teilstrich, aber nicht dessen komplette große Randbeschriftung sichtbar machte. Die finale Tastaturbehandlung fokussiert ohne automatischen Scrollsprung und scrollt den gewählten Teilstrich ausdrücklich horizontal mittig beziehungsweise bis zum erreichbaren Rand. Die unabhängige Nachprüfung bestätigt die begrenzte Änderung; der Tastaturtest prüft die Anforderung für beide Ränder. Die tatsächliche sichtbare Scrollposition wird zusätzlich im Browser geprüft, da jsdom kein Layout berechnet.

Alle genannten Befunde betreffen die neue Umsetzung. Es bestehen nach Nachprüfung keine offenen blockierenden Inhalts- oder Codebefunde.

## Technik, Bedienung und Praxisprüfung des Vorbestands

Rust prüft die numerischen Grenzen vor der weiteren Arithmetik, positive Schrittweiten, Rasterteilbarkeit und höchstens zehn Intervalle. Mindestens zwei geordnete unterschiedliche Beschriftungen müssen auf dem Raster liegen. Marker haben begrenzte eindeutige Bezeichnungen und Positionen; sie liegen auf unbeschrifteten Strichen. Markieraufgaben enthalten keine vorgegebenen Marker und benötigen eine richtige Antwort innerhalb des Rasters. Unbekannte Diagrammfelder und nicht ganzzahlige Koordinaten werden abgewiesen. Die IPC-Projektion liefert Darstellungsdaten, keinen separaten Antwortschlüssel oder Lösungsweg. Eine gezeichnete Markerkoordinate ist für die Darstellung erforderlich und kein Sicherheitsgeheimnis.

Die Punktwahl beginnt ohne ausgewählte Antwort. Ein einzelner Klick oder Tap, Pfeiltasten, Pos1/Ende sowie Enter/Leertaste bedienen die Schaltflächen ohne Ziehen. Nur die ausdrückliche Antwortprüfung löst einen Schreibrequest aus. Ränder werden eingehalten, Aufgaben- und Stufenwechsel leeren die Auswahl. Falsche Punkte bleiben zur Korrektur sichtbar. Ohne Profil und während einer Buchung ist die Auswahl gesperrt. Speicherfehler behalten bei unveränderter Antwort dieselbe Request-ID. Quellenhinweise nutzen den eigenen Quellenstand des ergänzenden Pakets.

Die unabhängige Vorprüfung betrachtete zusätzlich den bestehenden `LearningPanel`-, `InfoPanel`- und Antwortpersistenz-Code: Antwort-Retries, veraltete Ladeantworten, fehlendes Profil, fehlgeschlagener Stufenwechsel, verschachtelte Dialoge mit Escape sowie atomare Buchung von Fortschritt, Punkten und Beleg. Dabei wurde kein zusätzlicher praktisch reproduzierbarer Produktbug im bestehenden `main` festgestellt. Eine allgemeine Garantie der Fehlerfreiheit ist damit nicht verbunden. Bekannte anderweitige Dokumentationsarbeiten wurden nicht in diesen Diff aufgenommen.

## Prüfergebnisse

Vom unabhängigen Reviewer ausgeführt:

- `npx vitest run src/components/LearningPanel.number-line.test.tsx src/components/LearningPanel.test.tsx src/components/InfoPanel.test.tsx`: 29 Tests grün.
- `npx vitest run src/components/NumberLine.test.tsx`: sieben Tests grün. Abgedeckt sind Textalternativen ohne vorgesagten Ablesewert, leere Erstauswahl, Maus, Tastatur, Randwerte, negative Koordinaten, kontrolliertes Zurücksetzen, deaktivierte Felder und große Zahlen.
- Nach der Scrollkorrektur: `npx vitest run src/components/NumberLine.test.tsx src/components/LearningPanel.number-line.test.tsx`: zwölf Tests erneut grün.
- `cargo test --manifest-path src-tauri/Cargo.toml --locked number_line`: sieben Tests grün. Die Backendprüfung beantwortet alle 36 neuen Aufgaben falsch, richtig, als Request-Replay, mit abweichender Retry-Nutzlast und erneut; nach Wiederöffnung bleiben 72 Punkte und die richtigen Versuchszahlen erhalten. Weitere Tests prüfen ungültige Diagramme, die beschränkte IPC-Ausgabe und erhaltene bestehende Aufgaben.
- `git diff --check`: grün.

Vom Hauptagenten ausgeführt und für den Review berichtet; das Protokoll des Gesamtlaufs wurde zusätzlich vom Reviewer eingesehen:

- `npm run check:all` nach sämtlichen Korrekturen: Formatierung, 169 Vitest-Tests, zwei Workflowtests, TypeScript, Vite-Produktionsbuild, Rustfmt, Clippy und 106 Rusttests erfolgreich. Keine fehlgeschlagenen Main- oder Doctests.
- Browser-Sichtprüfung der echten Komponente mit Katalogdaten und synthetischem Prüfzustand bei 420 × 600 Pixeln: Seitenbreite und `scrollWidth` jeweils 420 Pixel, kein horizontaler Seitenüberlauf. Der begrenzte Diagrammbereich hatte 298 Pixel sichtbare und 554 Pixel gesamte Breite. Nach Ende lag `scrollLeft` am Maximum von 256 Pixeln, die Beschriftung „1 000 000“ war vollständig sichtbar; Pos1 führte zurück auf 0. Die Aufnahme wurde visuell geprüft. Diese Prüfung belegt Layout und Scrollverhalten, keine native Speicherung.
- Native Start- und Funktionsprüfung in der isolierten App `de.lernwelt.review80`: Testprofil angelegt, neun Mathematikthemen und Zahlenstrahl-Werkstatt erreichbar. Die erste Könner-Aufgabe mit Antwort 70 gab zwei Punkte. Die zweite Aufgabe begann ohne gewählten Punkt und mit deaktivierter Antwortprüfung. Ein falscher Punkt bei 120 gab null Punkte und ließ das Guthaben bei zwei; die Tastaturkorrektur per Tab/Pfeil rechts auf 140 gab weitere zwei Punkte. Guthaben danach vier Punkte.

- Finaler nativer Release-Build und erneuter Start erfolgreich. Nach Neustart blieben vier Punkte und zwei von zwölf gelösten Könner-Aufgaben erhalten. Die erneute Antwort 70 auf die erste Aufgabe wurde als bereits gelöst erkannt und brachte keine weiteren Punkte. Beim Wechsel zu Streber war die neue Antwort leer; die Markieraufgabe zu −75 begann ebenfalls ohne Auswahl. Die korrekte Wahl des zweiten Teilstrichs gab drei Punkte. Das finale Pos1-/Ende-Scrollverhalten wurde im Browser erneut bestätigt.

## Grenzen und Status

Automatisierte UI-Tests verwenden jsdom und den vorhandenen gemockten Desktop-Adapter. Sie ersetzen weder native Sicht- und Persistenzprüfungen noch eine Erprobung mit Screenreadern oder Kindern. Die Diagramme bieten zusätzlich eine textliche Beschreibung; schmale Fenster verwenden einen gezielt seitlich scrollbar gehaltenen Diagrammbereich. Die fachliche Durchsicht ist ein unabhängiger Agentenreview, keine amtliche Freigabe oder behauptete Verständlichkeitsprüfung mit Kindern.

Code und Inhalte sind nach Nachprüfung freigegeben; Gesamtlauf, nativer Build, Neustart und Persistenz sowie die ergänzende Browser-Sichtprüfung sind dokumentiert. Es bestehen keine offenen blockierenden Befunde. Der Merge setzt grüne erforderliche PR-Checks voraus; die Windows-Prüfung erfolgt dort, eine lokale Windows-Startprüfung wurde nicht durchgeführt. Issue #80 ist erst nach dem Merge abgeschlossen.

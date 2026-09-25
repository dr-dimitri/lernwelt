# Roboterwerkstatt und Einmaleins-Insel

Beide Welten gehören zum Einmaleins-Trainer. Sie sind kostenlose Lernspiele ohne Zeitlimit. Eine Etappe umfasst acht geübte Aufgaben. Jede gespeicherte Antwort – auch eine falsche Antwort oder das bewusste Aufdecken – führt einen Bauschritt weiter. Eine automatisch richtig geprüfte Antwort bringt zusätzlich genau einen Lernpunkt. Baufortschritt beschreibt damit das Üben, nicht die Beherrschung einer Kompetenz.

## Zwei eigene Welten

In der **Roboterwerkstatt** entstehen Roboter mit Rädern, Pflanzenaufsatz oder Tauchausrüstung. Drei Farbpaletten und drei Modelle lassen sich kombinieren. Fertige Roboter bleiben nach Modell und Farbe im persönlichen Bauregal erhalten.

Auf der **Einmaleins-Insel** entstehen nacheinander Brücke, Baumhaus, Garten, Werkstatt, Sternwarte und Leuchtturm. Danach folgen weitere Ausbauetappen. Die Insel hat sechs feste Motive; weitere Etappen erzeugen keine beliebig vielen neuen Gebäude. Jede Welt speichert ihre eigenen Bauschritte. Ein Wechsel kostet keine Punkte und löscht keinen Fortschritt.

Die Grafiken sind eigene, lokal gerenderte SVG-Illustrationen: perspektivische Gebäude, Küste, Palmen und Segelboot auf der Insel; beleuchtete Werkbank, Werkzeuge und schrittweise montierte Roboter in der Werkstatt. Vektorgrafiken bleiben auch bei größerer Darstellung scharf. Es gibt keine externen Assets, Schriften, Grafikdienste oder neuen Laufzeitabhängigkeiten.

## Aufgaben und Hilfe

Wählbar sind das gemischte Einmaleins mit allen Produkten von 1 × 1 bis 10 × 10, einzelne Reihen von 1 bis 10 und Quadratzahlen von 10² bis 20². Die kurzen Bauetappen sind unabhängig von einer mathematischen Übungsrunde. Gemischte Runden enthalten 100 Aufgaben, einzelne Reihen zehn und Quadratrunden fünf zufällig ausgewählte Quadratzahlen mit je vier Wiederholungen.

Aufgaben zum Zusammenstellen von Energiezellen oder Solarmodulen verbinden die Faktoren mit gleich großen Gruppen. Die Eingabe bleibt eine einzelne Ergebniszahl. Bilder zeigen das Gesamtergebnis vor dem Prüfen nicht an. Ein ausdrücklich angeforderter Tipp zeigt Gruppen bzw. zwei Teilflächen und den dazu passenden Rechenweg. Beispielsweise wird 6 × 7 in 5 × 7 und 1 × 7 zerlegt, 13² in 10 × 13 und 3 × 13. Bei größeren Faktoren zeigt das Bild Teilflächen statt Hunderter einzelner Punkte. Auch der Alternativtext verrät die Summe nicht.

Nach der Rückmeldung öffnet **Rechenweg ansehen** dasselbe Bild zusammen mit den ausgerechneten Teilprodukten und der bestätigten Lösung. Das ist auch nach falschen Antworten und nach dem Aufdecken verfügbar.

Falsche und aufgedeckte Aufgaben werden für eine freiwillige Wiederholungsrunde vorgemerkt. Jede vorgemerkte Aufgabe erscheint innerhalb eines Durchlaufs höchstens einmal. Noch nicht richtig gelöste Aufgaben bleiben für einen späteren Durchlauf erhalten. Die normale Aufgabenfolge bleibt bestehen. Diese Warteschlange ist keine zeitgesteuerte Wiederholungsplanung und keine vollständige adaptive Lernstandsdiagnose.

## Lehrplan Klasse 5

Grundlage ist [LehrplanPLUS, Gymnasium Bayern, Mathematik 5](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik), geprüft am **25.09.2026**:

| Angebot | Bezug und Grenze |
| --- | --- |
| Produkte mit Faktoren 1–10 | Festigung von Grundfertigkeiten für M5 3.1, insbesondere sicheres Multiplizieren; keine Behauptung, dass das kleine Einmaleins erst in Klasse 5 eingeführt wird. |
| Quadratzahlen 10²–20² | M5 3.1 nennt automatisiertes Wissen bis 400. Kleinere Quadrate werden bereits im Einmaleins geübt; die Lerntafel des Themenpakets enthält die Reihe 0²–20². |
| Zerlegen in Teilprodukte | M5 3.2: Distributivgesetz und Rechenvorteile. Der Tipp erklärt die konkrete Rechnung in kurzen Sätzen. |
| Reihen und Teilflächen | Unterstützende Darstellung, anschlussfähig an M5 4.2; keine eigene automatische Bewertung des Flächenverständnisses. |

Neue Aufgaben tragen stabile IDs, Fach Mathematik, Jahrgangsstufe 5, Kompetenzbezug sowie Quellen- und Inhaltsstand. Frühere Aufgaben über 20² bleiben ausschließlich für gespeicherte historische Antworten auflösbar. Bereits erworbene Punkte ändern sich durch die Begrenzung nicht. Das Spiel ergänzt den Mathematikunterricht; es deckt weder das gesamte Schuljahr noch alle Kompetenzanforderungen ab.

## Lernen und Bedienung

Die Verknüpfung zwischen Zahl, Gruppe und Bild orientiert sich an der EEF-Empfehlung, mathematische Darstellungen gezielt einzusetzen und ihren Bezug zur Rechnung ausdrücklich zu machen ([Improving Mathematics in Key Stages Two and Three](https://files.eric.ed.gov/fulltext/ED612294.pdf)). Die Bildhilfe bleibt freiwillig und kann wieder geschlossen werden. Eigenes Abrufen und späteres Wiederholen ergänzen das angeleitete Rechnen. Ein Bauschritt ist keine fachliche Zertifizierung; die konkrete Etappenlänge und Spielwelt sind Designentscheidungen. Verständlichkeit, Motivation und langfristiger Lernerfolg wurden noch nicht mit Kindern untersucht.

Die Oberfläche nutzt eine klare Hauptaufgabe, beschriftete Steuerelemente, sichtbaren Tastaturfokus und Dialoge mit Escape und Fokusrückgabe. Kleine Fenster und vergrößerte Schrift dürfen scrollen. Die Szenen benötigen keine dauernden Animationen, Geräusche oder Reaktionsgeschwindigkeit. Orientierung sind Apples [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) und [Layout](https://developer.apple.com/design/human-interface-guidelines/layout); es handelt sich um eine Tauri-Oberfläche, keine Apple-Zertifizierung.

## Speicherung

Rust verwaltet Aufgabenpläne, Einstellungen, Wiederholungen, Baufortschritt und Punktetransaktionen in SQLite. Bestätigte Änderungen bleiben beim Neustart erhalten. Eine Etappe endet nach acht Antworten und wartet auf eine bewusste Fortsetzung. Die Auswahl der Welt, des Roboters, der Farbe und der Rechenart wird ebenfalls gespeichert. Nicht abgeschickte Texteingaben werden nicht gespeichert.

Doppelt übertragene Antworten oder Einstellungsänderungen erzeugen keine weiteren Punkte, Bauteile oder Roboter. Nach einem Speicherfehler kann dieselbe Anfrage wiederholt oder der bestätigte Stand neu geladen werden. Vorhandene Profile, Missionsdaten, alte Antworten und Punkte bleiben durch die additive Migration erhalten.

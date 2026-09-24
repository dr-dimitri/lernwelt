# Mathematik 5 · Inhaltsstand 24.09.2026

Grundlage: [LehrplanPLUS Bayern, Gymnasium, Mathematik 5](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik). Eigene Aufgaben und didaktische Zuordnung, keine amtliche Freigabe. Die Quelle wurde am 24.09.2026 gelesen; die URL wird beim Üben nicht aufgerufen. Das Paket wird mit der Anwendung ausgeliefert.

**Status: Der komplette Lehrplan ist noch nicht lückenlos umgesetzt.** Die bisherige Zuordnung zu sieben Bereichen belegt nur, dass jeder Bereich vertreten ist. Sie war kein Nachweis für jede einzelne Kompetenzerwartung. Issue #13 ergänzt den zuvor fehlenden Mengenbegriff und dokumentiert den genaueren Abgleich unten.

Zusätzliche offizielle Erläuterung: [Mengenbegriff zu M5 1.1](https://www.lehrplanplus.bayern.de/serviceinformation/l76991), geprüft am 24.09.2026. Die Erläuterung konkretisiert den Einstieg mit Mengen, Elementen, ∈ und ∉. Sie ist als ergänzende Information gekennzeichnet. Abstrakte Schnitt-, Vereinigungs- und Teilmengen werden dort späteren Klassen zugeordnet. In Lernwelt wird die verwendete Konvention ausdrücklich genannt: ℕ ab 1, ℕ₀ einschließlich 0.

## Themen und Abdeckung

| Themen-ID | Lehrplanbezug | Automatische Aufgaben | Ergänzende Tätigkeiten |
| --- | --- | ---: | --- |
| `sets` | M5 1.1, Erläuterung Mengenbegriff | 21 | Elemente sortieren; Zugehörigkeit und Zahlenmengen erklären |
| `numbers` | M5 1.1 | 21 | Zahlengerade zeichnen; Unbegrenztheit begründen |
| `add` | M5 1.2 | 21 | Rechenwege vergleichen; schriftliche Addition und Überschlag |
| `geometry` | M5 2 | 21 | Koordinaten, Kreis/Tangente, Winkel messen/zeichnen, Vierecke, Lot und Lagebeziehungen |
| `multiply` | M5 3.1 | 24 | Baumdiagramm, Primfaktorzerlegung, schriftliche Multiplikation |
| `terms` | M5 3.2 | 21 | Rechengesetze erklären; Vorwärts-/Rückwärtsketten |
| `units` | M5 4.1 | 24 | Größen schätzen/messen; Maßstabszeichnung |
| `area` | M5 4.2 | 21 | Einheitsquadrate, Flächenzerlegung, Quadernetz/Schrägbild, zusammengesetzter Körper |

Insgesamt **174 Bildschirmaufgaben** (58 pro Stufe) und **22 Mitmachaufgaben**. Jeder Kompetenzstrang hat genau drei Aufgaben mit eigenen stabilen IDs: Vorschule, Könner, Streber. Die Mitmachaufgaben gelten für alle Stufen und ergänzen die Bildschirmaufgaben ohne Punktevergabe.

Die leichten Aufgaben aktivieren Voraussetzungen (beispielsweise kleine natürliche Zahlen), Könner orientiert sich am normalen Üben in Klasse 5, Streber verlangt Transfer oder mehrere Schritte innerhalb des jeweiligen Lernbereichs. Die Namen sagen nichts über Alter oder Begabung aus. Keine Zeitmessung und keine Strafe für Fehler. Auch leichte Aufgaben geben bei erstmaligem Erfolg 10 Punkte.

## Fachlicher Umfang

- `sets`: Mengen als Sammlungen, Elemente, Aufzählung, ∈/∉, natürliche Zahlen, Null, ganze Zahlen und unendliche Fortsetzung.
- `numbers`: Dezimalsystem einschließlich großer Zahlen, Vergleich mit römischer Darstellung, Rundung und deren Zweck, Skalierung, Ordnung ganzer Zahlen, Betrag, Gegenbeispiele und Vorgänger/Nachfolger.
- `add`: schriftliche Verfahren über eine Million, Überschläge, vorzeichenbehaftete Addition/Subtraktion, die drei einfachen Gleichungsformen, Rechenvorteile und Bezeichnungen.
- `geometry`: Punkte/Strecken/Geraden und Kreis, Koordinaten, parallel/senkrecht, kürzester Abstand und Lotfuß, Kreislinie/Kreisscheibe und Abstandsmengen, Tangenten, zwei Kreise, Winkel bis 360°, Quadrat/Rechteck/Parallelogramm/Raute/Drachen/Trapez. Trapez wird inklusiv als Viereck mit mindestens einem parallelen Seitenpaar verwendet.
- `multiply`: schriftliche Verfahren mit mehrstelligen Faktoren/Divisoren, Teilbarkeit durch 2/3/5/10, Primzahlen/Primfaktoren, Zählprinzip/Baumdiagramm, Vorzeichen, Potenzen mit ganzen Basen, Zehnerpotenzen, Verdopplung, Quadratzahlen bis 400 und einfache Gleichungen.
- `terms`: Termstruktur, Fachbegriffe, Rangfolge/Klammern, Kommutativ-/Assoziativ-/Distributivgesetz und Grenzen, Vorwärts-/Rückwärtsarbeiten, Modelle und Plausibilität.
- `units`: Geld, alle vorgesehenen Längen- und Masseneinheiten, Zeit h/min/s, Dezimalschreibweise, Umrechnen/Rechnen, Vergleich mit realen Größen, Dreisatz und Maßstab.
- `area`: Einheitsquadrate, Rechteckformel, Umfang vs. Fläche, Flächeneinheiten von mm² bis km² einschließlich a/ha, Dezimalschreibweise, Zerlegung/Ergänzung, Quaderoberfläche, Netz/Schrägbild und einfache zusammengesetzte Körper.

Die automatischen Aufgaben prüfen einzelne Ergebnisse und Entscheidungen. Schriftliche Verfahren, selbst erstellte Zeichnungen, Argumentationsqualität und räumliches Vorstellungsvermögen lassen sich so nur teilweise erfassen; dazu gibt es Mitmachaufträge mit Kontrollkriterien und bei Bedarf Unterstützung durch Erwachsene. Die App behauptet weder eine vollständige Prüfung jeder Kompetenz noch eine unbegrenzte Aufgabenvielfalt. Alle Lernbereiche sind vertreten; didaktische Erprobung mit Kindern und fachpädagogische Freigabe stehen noch aus.

## Inhaltsformat und Änderungen

`src-tauri/content/curriculum-v1.json` enthält Paketversion, Quellen-URL, Abrufstand, Topics und Übungen. Pro Topic: Fach, Klasse, Lehrplanreferenz, eigene Erklärung und Papieraktivitäten; bei Englisch Fremdsprachenfolge. Pro Aufgabe: stabile Versions-ID, Topic- und Kompetenz-ID, Stufe, Fragetext, Antworttyp, Antwort, Tipp und Lösungsweg. Metadaten werden über Topic/Paket vererbt, nicht bei jeder Aufgabe dupliziert.

IDs sind fachlich unveränderlich. Wenn sich die Bedeutung oder richtige Antwort ändert, eine neue ID verwenden und bereits veröffentlichte IDs für alte Buchungen/Request-Replays weiter auflösen. Reine Formulierungsverbesserungen ohne Bedeutungswechsel dürfen die ID behalten. Antwortschlüssel werden nicht mit `get_learning_state` ausgegeben. Mitmachlösungen sind bewusst jederzeit zur Selbstkontrolle aufklappbar.

Die sechs Englischbeispiele sind kein weiterer implementierter Lehrplan. Die ursprünglichen zwei Englisch-IDs und zwei intern weiter auflösbaren Mathematik-IDs behalten ihre Antwortbedeutung und Punktehistorie.


## Abgleich der einzelnen Kompetenzerwartungen

Die Nummern nach dem Schrägstrich bezeichnen die Reihenfolge der Kompetenzabsätze auf der offiziellen Fachlehrplanseite (7 + 5 + 5 + 7 + 5 + 5 + 5 = 39). Die Kurzbezeichnungen sind eigene Arbeitslabels. Aufgabenbelege nennen den Teil der ID nach `by.math.5.` und vor der Stufe/Version. „Übung“ bedeutet eine vorhandene Auswahl automatisch bewerteter Aufgaben, keine vollständig entwickelte Unterrichtseinheit oder nachgewiesene Beherrschung. „Teilweise“ benennt konkret fehlende bzw. nur manuell abgedeckte Teile.

| Bezug | Kurzlabel | Belege | Status / Grenze |
| --- | --- | --- | --- |
| 1.1/1 | Zahlbereich | `numbers.place-value`, `numbers.successor`, `sets.*`; Aktivität „Unendlich weiter“ | Übung; Zahlwörter großer Zahlen noch nicht systematisch trainiert |
| 1.1/2 | Stellenwert | `numbers.place-value`, `numbers.roman` | Übung und Erklärung; eigene Begründungen nur mündlich |
| 1.1/3 | Zahlenstrahl | `numbers.number-line`; „Deine Zahlengerade“ | Teilweise: vorgegebene Skalierung geprüft, eigene Skalierung noch nicht angeleitet |
| 1.1/4 | Runden | `numbers.rounding` | Übung mit Alltagsentscheidung |
| 1.1/5 | Zahlbereich erweitern | `sets.integers`, `add.signed`, `add.context` | Übung und Erklärung |
| 1.1/6 | Ordnung/Betrag | `numbers.ordering`, `numbers.absolute`; „Deine Zahlengerade“ | Übung; Zeichnung mit Selbstkontrolle |
| 1.1/7 | Gegenbeispiel | `numbers.absolute.streber`, `sets.infinite` | Auswahlübung; eigene Gegenbeispiele noch nicht systematisch angeleitet |
| 1.2/1 | Schriftlich +/− | `add.written`, `add.estimate`; „Große Zahlen untereinander“ | Teilweise: Resultate geprüft, schriftliche Rechenschritte nicht erfasst |
| 1.2/2 | Vorzeichen +/− | `add.signed`, `add.context` | Teilweise: Rechnen vorhanden, Vorzeichen/Rechenzeichen nicht eigens gegenübergestellt |
| 1.2/3 | Gleichungen +/− | `add.equations` | Alle drei Formen mit Beispielen; keine breite Variantenbank |
| 1.2/4 | Rechenvorteile +/− | `add.strategy`; „Rechenwege vergleichen“ | Übung und Selbstkontrolle |
| 1.2/5 | Termaufbau +/− | `add.terms`, `add.signed`; „Rechenwege vergleichen“ | Teilweise: Fachwörter/Resultate, keine strukturierte Eingabe ganzer Rechnungen |
| 2/1 | Geometrisch darstellen | `geometry.coordinates`, `geometry.lines`; „Punkte verbinden“ | Teilweise: Zeichnen auf Papier; abkürzende Strecken-/Geraden-/Kreisschreibweisen nicht systematisch trainiert |
| 2/2 | Lagebeziehungen | `geometry.lines`, `geometry.distance`, `geometry.circles`; „Abstand messen“ | Teilweise: ausgewählte Fälle; nicht alle Kreis-/Geradenlagen als eigene Aufgaben |
| 2/3 | Abstandsbedingungen | `geometry.distance.streber`; „Zirkel-Detektiv“ | Teilweise: Kreisbedingungen, noch keine angeleitete Alltagsentscheidung mit mehreren Bedingungen |
| 2/4 | Winkel | `geometry.angle-types`, `geometry.angles`; „Winkel bauen“ | Übung und Papierkonstruktion; Messgenauigkeit nicht automatisch geprüft |
| 2/5 | Vierecke | `geometry.quadrilaterals`; „Viereck-Forscher“ | Teilweise: Eigenschaften/Zeichnen; wenig Umfeldzuordnung und Kopfgeometrie |
| 3.1/1 | Schriftlich ×/: | `multiply.written`; „Schriftlich und geschätzt“ | Teilweise: Ergebnisse und Überschlag, Division nicht schrittweise angeleitet |
| 3.1/2 | Faktoren | `multiply.prime`, `multiply.divisibility`; „Primzahl-Werkstatt“ | Teilweise: Zerlegen/Teilbarkeit; Eindeutigkeit noch nicht eigens erklärt |
| 3.1/3 | Möglichkeiten | `multiply.counting`; „Dein Eisladen“ | Übung und Baumdiagramm; Grenzen des Zählprinzips nicht eigens trainiert |
| 3.1/4 | Vorzeichen ×/: | `multiply.signs` | Teilweise: Regeln anwenden, ihre Herleitung fehlt |
| 3.1/5 | Rechenvorteile × | `terms.associate`; „Erkläre deinen Trick“ | Übung und Erklärung |
| 3.1/6 | Potenzen | `multiply.powers`, `multiply.growth` | Teilweise: keine vollständige Übungsreihe aller Quadratzahlen bis 400; große Zahlen als Zehnerpotenzen nur kurz |
| 3.1/7 | Gleichungen ×/: | `multiply.equations` | Alle drei Formen mit Beispielen |
| 3.2/1 | Termstruktur | `terms.structure` | Auswahlübung; keine freie Termgliederung |
| 3.2/2 | Rechenreihenfolge | `terms.precedence`, `terms.brackets` | Übung; Prüfung des Endwerts statt einzelner Rechenschritte |
| 3.2/3 | Rechengesetze | `terms.distribute`, `terms.associate`; „Erkläre deinen Trick“ | Übung und eigener Vergleich auf Papier |
| 3.2/4 | Lösungsstrategien | `terms.reverse`; „Vorwärts und rückwärts“ | Übung und Rechenkette |
| 3.2/5 | Sachaufgaben | `terms.model`; „Erkläre deinen Trick“ | Teilweise: Modell/Ergebnis; Präsentation und Reflexion nicht automatisch bewertet |
| 4.1/1 | Messen/Einheiten | `units.money`, `units.length`, `units.mass`, `units.time`, `units.small-lengths`; „Schätzmeister“ | Teilweise: Umrechnung vorhanden, Einheitentafeln fehlen |
| 4.1/2 | Größenrechnung | `units.money`, `units.length`, `units.mass`, `units.time`, `units.small-lengths` | Übung; nicht alle Kombinationen von Operation/Einheit |
| 4.1/3 | Schätzen | `units.estimate`; „Schätzmeister“ | Teilweise: Vergleich und Nachmessen; Recherche/Präsentation nicht angeleitet |
| 4.1/4 | Dreisatz | `units.unitary` | Drei Beispiele mit Lösungsweg; keine freie schrittweise Eingabe |
| 4.1/5 | Maßstab | `units.scale`; „Dein Zimmer als Plan“ | Übung und Planzeichnung |
| 4.2/1 | Flächenformel | `area.squares`; „Kästchen zählen“ | Übung und anschauliche Herleitung |
| 4.2/2 | Flächeneinheiten | `area.conversion`, `area.land`; „Kästchen zählen“ | Teilweise: Umrechnung, keine Einheitentafel/ausführliche Herleitung aller Übergänge |
| 4.2/3 | Umfang/Fläche | `area.perimeter`, `area.compare`, `area.squares` | Teilweise: exakte Rechtecke vorhanden, Näherung beliebiger Flächen durch Rechtecke fehlt |
| 4.2/4 | Flächen zerlegen | `area.compound`; „Eine L-Form, zwei Wege“ | Übung und Vergleich zweier Lösungswege |
| 4.2/5 | Oberflächen | `area.surface`; „Schachtel-Werkstatt“, „Würfel zusammenbauen“ | Übung, Netz/Schrägbild auf Papier; keine automatische Zeichnungsprüfung |

Diese Matrix ersetzt den früheren pauschalen Vollständigkeitseindruck. Die offenen Teile sind keine bloßen Testlücken: Ein vollständiger Lehrgang benötigt zusätzliche Erklärungen, Aufgabenvarianten und angeleitete Tätigkeiten. Die Menge der Aufgaben allein ist dafür kein Qualitätsmaß. Der Mengenbegriff wird ab Issue #13 ausdrücklich angeboten; Sprache und Auftragsgestaltung wurden in Issue #14 überarbeitet: kurze Sätze, getrennte Angaben und Fragen, erklärte Fachbegriffe und sichtbare Schritte bei mehrteiligen Mitmachaufträgen. Die fachliche Schwierigkeit bleibt erhalten.

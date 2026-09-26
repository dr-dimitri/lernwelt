# Zahlenstrahl-Werkstatt – Mathematik 5

Die Werkstatt ergänzt 36 eigene Bildschirmaufgaben und drei Mitmachaufgaben für Klasse 5. Jede Stufe enthält zwölf Aufgaben, darunter vier Aufgaben zum Markieren einer Zahl. Die Stufen sind frei wählbar; Vorschule, Könner und Streber bezeichnen den Schwierigkeitsgrad innerhalb des Themas.

Grundlage ist der [LehrplanPLUS Bayern, Gymnasium, Mathematik 5](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik), abgerufen am 26.09.2026. M5 1.1 umfasst das Ablesen und Darstellen natürlicher Zahlen mit geeigneter Skalierung sowie das Ordnen und Darstellen ganzer Zahlen an der Zahlengeraden. Aufgaben zu Bewegungen nach links und rechts unterstützen zusätzlich das Veranschaulichen von Addition und Subtraktion nach M5 1.2. Die Aufgaben sind selbst erstellt; es werden keine Originalaufgaben übernommen.

| Stufe | Zahlenräume und Darstellungen | Lernangebote |
| --- | --- | --- |
| Vorschule | Zahlenstrahlen ab 0 bis höchstens 100; Abstände 1, 2, 5 oder 10 | Ablesen, Markieren, Skala erkennen, Abstände zählen, Zahlen vergleichen, einfache Schritte nach rechts |
| Könner | Zahlenstrahlen bis 200; Zahlengeraden mit negativen Zahlen und positive Ausschnitte bis 2000 | Ablesen und Markieren mit wechselnder Skala, Abstände über 0, Anzahl der Schritte und Zahlunterschied unterscheiden |
| Streber | Zahlengeraden mit negativen Zahlen, verschobene Ausschnitte und Zahlenstrahlen bis 1000000 | Skala aus inneren Beschriftungen bestimmen, große Zahlen, Schritte in beide Richtungen, gleich große Abstände zur 0 |

Pro Stufe gibt es vier Markieraufgaben. Die übrigen Aufgaben behandeln Ablesen, Skala, Abstand, Anzahl kleiner Abstände, Vergleich und Bewegung. Bei Streber verlangt die zwölfte Aufgabe, erst einen Weg zu berechnen und dann das Ziel zu markieren. Alle Bildschirmaufgaben enthalten einen Tipp und einen erklärten Lösungsweg. Jede Aufgabe stellt eine Frage beziehungsweise einen klaren Markierauftrag; Abstand und Anzahl kleiner Abstände werden ausdrücklich unterschieden.

Die stabilen IDs folgen `by.math.5.number-line.<1–12>.<stufe>.v1`. Das Paket ist `src-tauri/content/number-line-5-v1.json`; das neue Thema heißt `number-line`. Alle bisherigen Aufgaben und IDs bleiben erhalten. Gemeinsam enthalten die Mathematikpakete jetzt 399 Bildschirmaufgaben in neun Themen.

## Diagramme und Antwortprüfung

Das optionale Feld `numberLine` enthält ausschließlich Darstellungsdaten: `kind`, `mode`, `min`, `max`, `step`, `labels` und `markers`. Ein Zahlenstrahl (`ray`) beginnt bei 0; eine Zahlengerade (`line`) darf auch negative oder verschobene positive Ausschnitte zeigen. Sichtbare Pfeile kennzeichnen die Fortsetzung außerhalb des Bilds. Die gleichmäßig angeordneten Striche stellen höchstens zehn Intervalle dar. Mindestens zwei Zahlenbeschriftungen machen die Skala bestimmbar. Marker liegen auf unbeschrifteten Strichen; bei Markieraufgaben gibt es keine vorgegebenen Marker.

Rust prüft Zahlenbereich, Raster, Beschriftungen, Marker und Antworttyp beim Laden. Unbekannte Diagrammfelder und nicht ganzzahlige Koordinaten werden abgewiesen. Für Markieraufgaben muss die richtige Koordinate im gezeigten Raster liegen. Bei Ableseaufgaben kann eine Antwort auch eine Schrittzahl, ein Abstand oder eine Skalengröße sein; solche Ergebnisse müssen keine Koordinate im gezeigten Ausschnitt sein.

Die Oberfläche erhält keinen separaten Lösungsschlüssel. Die Koordinate eines sichtbaren Ablesemarkers ist notwendiger Teil der Zeichnung, kein Sicherheitsgeheimnis. Die Bewertung und Punktebuchung bleiben im Backend. Neue richtige Lösungen vergeben 1/2/3 Punkte nach Aufgabenstufe, falsche Antworten und neue Versuche bereits gelöster Aufgaben keine weiteren Punkte. Identische Request-Wiederholungen erzeugen weder einen weiteren Versuch noch eine weitere Buchung. Es gibt keine neue Datenbankmigration und keinen neuen Command.

## Grenzen

Das Angebot ist eine feste Aufgabenbank, kein beliebiger Aufgabengenerator. Freies Zeichnen, eigenes Erklären und die Wahl einer eigenen Skala ergänzen drei Mitmachaufgaben mit Selbstkontrolle und ohne automatische Bewertung. Das Paket ist keine vollständige Lernstandserhebung, kein Ersatz für Unterricht und nicht amtlich freigegeben. Eine Verständlichkeitsprüfung mit Kindern wurde nicht durchgeführt.

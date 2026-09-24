# Mathematik 5 · Inhaltsstand 24.09.2026

Grundlage: [LehrplanPLUS Bayern, Gymnasium, Mathematik 5](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik). Eigene Aufgaben und didaktische Zuordnung, keine amtliche Freigabe. Die Quelle wurde am 24.09.2026 gelesen; die URL wird beim Üben nicht aufgerufen. Das Paket wird mit der Anwendung ausgeliefert.

## Themen und Abdeckung

| Themen-ID | Lehrplanbezug | Automatische Aufgaben | Ergänzende Tätigkeiten |
| --- | --- | ---: | --- |
| `numbers` | M5 1.1 | 21 | Zahlengerade zeichnen; Unbegrenztheit begründen |
| `add` | M5 1.2 | 21 | Rechenwege vergleichen; schriftliche Addition und Überschlag |
| `geometry` | M5 2 | 21 | Koordinaten, Kreis/Tangente, Winkel messen/zeichnen, Vierecke, Lot und Lagebeziehungen |
| `multiply` | M5 3.1 | 24 | Baumdiagramm, Primfaktorzerlegung, schriftliche Multiplikation |
| `terms` | M5 3.2 | 21 | Rechengesetze erklären; Vorwärts-/Rückwärtsketten |
| `units` | M5 4.1 | 24 | Größen schätzen/messen; Maßstabszeichnung |
| `area` | M5 4.2 | 21 | Einheitsquadrate, Flächenzerlegung, Quadernetz/Schrägbild, zusammengesetzter Körper |

Insgesamt **153 Bildschirmaufgaben** (51 pro Stufe) und **20 Mitmachaufgaben**. Jeder Kompetenzstrang hat genau drei Aufgaben mit eigenen stabilen IDs: Vorschule, Könner, Streber. Die Mitmachaufgaben gelten für alle Stufen und ergänzen die Bildschirmaufgaben ohne Punktevergabe.

Die leichten Aufgaben aktivieren Voraussetzungen (beispielsweise kleine natürliche Zahlen), Könner orientiert sich am normalen Üben in Klasse 5, Streber verlangt Transfer oder mehrere Schritte innerhalb des jeweiligen Lernbereichs. Die Namen sagen nichts über Alter oder Begabung aus. Keine Zeitmessung und keine Strafe für Fehler. Auch leichte Aufgaben geben bei erstmaligem Erfolg 10 Punkte.

## Fachlicher Umfang

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

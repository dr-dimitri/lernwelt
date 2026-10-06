# Vokabeltrainer Englisch 5

370 eigene Karten in 18 Themen; Stand 24.09.2026. Grundlage sind die Wortfelder des [LehrplanPLUS Englisch 5, erste Fremdsprache](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/englisch/1-fremdsprache). Thematische Orientierung am [öffentlichen Green-Line-Bayern-1-Verteilungsplan](https://assets.klett.de/assets/43500837/StoffverteilungsplanBd1.pdf), Ausgabe ab 2017. Die Auswahl enthält Grundwortschatz und weitere alltagsnahe Wörter; sie ist keine amtliche Pflichtwortliste oder vollständige Buchwortliste. Eigene Beispielsätze, keine Lehrbuchübernahme.

## Umfang

Die zwölf bisherigen Themen haben jetzt je 20 Karten: Begrüßung/Farben, Familie, Wohnen, Schule, Alltag, Freizeit, Einkaufen, Geburtstag, Vergangenheit, Geschichten, Unterwegs und Wörter-Werkstatt. Hinzu kommen Tierfreunde, Kleiderschrank, Körper, Wetter und Kalender mit je 20 Karten sowie Zahlen mit 30 Karten. Die übrigen Zahlen elf/zwölf und erste/zweite sowie Wochentage/Monate aus dem bisherigen Paket bleiben in ihren ursprünglichen Themen. Keine absichtlichen doppelten Wortkarten; Varianten wie colour/color teilen sich eine Karte.

Alle bisherigen IDs, Übersetzungen, Beispielsätze und Lücken bleiben erhalten. Fortschritt wird weiterhin nach Karte und Schwierigkeit gespeichert. Neue Karten beginnen ohne alten Lernstand. Das Paket enthält Klasse, Fremdsprachenfolge, Quelle/Stand und Kompetenzbezug; jede Karte verweist auf ein Thema und E5 1.2 / E5 4.

## Automatische Antwortprüfung im Schreibmodus

- Vorschule: englisches Wort mit Beispielsatz → eine deutsche Übersetzung.
- Könner: deutsche Bedeutung → englisches Wort oder Wortgruppe.
- Streber: englischer Lückensatz und deutsche Bedeutung → fehlendes englisches Wort oder Wortgruppe.

Hinterlegte Varianten berücksichtigen unter anderem Großschreibung, Leerraum, typografische Apostrophe, häufige Synonyme und ausgewählte britische/amerikanische Schreibweisen. Bei Zahlen ist in deutscher Richtung auch die Ziffernschreibweise erlaubt. Deutsche Nomen dürfen mit Artikel eingegeben werden. Es gibt keine allgemeine Übersetzungs-KI und keine unscharfe Toleranz für beliebige Schreibfehler. Nicht jede richtige Umschreibung kann erkannt werden; auf die angegebene Bedeutung achten. Die Rückmeldung zeigt eine passende Musterlösung und den Beispielsatz.

## Punkte und Karteifächer

Eine korrekte Antwort gibt in jeder Stufe 1 Punkt in das vorhandene Lernpunktekonto und verschiebt die Karte ein Fach weiter. Auch eine spätere fällige Wiederholung kann 1 Punkt verdienen. Falsche Antworten und „Weiß ich noch nicht · Lösung zeigen“ geben 0 Punkte und setzen die Karte für eine Wiederholung nach einer Minute in Fach 1. Fach 2–5 haben Abstände von 1/3/7/14 Tagen. Die Lösung bleibt nach dem Prüfen sichtbar, bis „Nächste Karte“ gewählt wird.

Doppelklicks, Transport-Retries und veraltete Ansichten dürfen dieselbe Bewertung nicht erneut vergüten. Historische Selbsteinschätzungen erhalten keine nachträglichen Punkte. Alle Buchungen und Lernstände bleiben offline auf dem Gerät. Die Punkte lassen sich wie bisher für Spiele und Abzeichen einsetzen.

## Buchstabensalat (Ergänzung 06.10.2026)

Die Übungsart **Buchstabensalat** fragt auf jeder Stufe das englische Wort ab: deutsche Bedeutung plus gemischte Buchstaben, in Streber zusätzlich der vorhandene Lückensatz. Vorschule bevorzugt kurze Wörter und bietet freiwillig den Anfangsbuchstaben; Könner verwendet die normale Mischung, Streber bevorzugt längere Wörter/Wortgruppen. Gibt es im Thema keine bevorzugten Wörter, bleiben die anderen geeigneten Karten erreichbar.

Tippen und einzeln anklickbare, mit Tab/Enter erreichbare Buchstabenkärtchen sind gleichwertige Bedienwege. Doppelte Buchstaben besitzen einzelne Kärtchen-IDs. Entfernen und Zurücksetzen ändern nur die Eingabe. Leerzeichen, Bindestriche und Apostrophe bleiben an ihren Positionen; nur Wortteile ab drei Buchstaben werden gemischt. Geeignet sind 3–16 alphabetische Buchstaben, höchstens drei Wörter, zwei verschiedene Buchstaben und ein mischbarer Wortteil. Zufallsversuche sind begrenzt; ein Tausch verschiedener Buchstaben liefert bei Bedarf garantiert eine veränderte Mischung.

Rust wählt zufällig aus geeigneten fälligen Karten vor geeigneten neuen Karten. Bei mehreren Kandidaten wird die unmittelbar vorige Karte vermieden. Thema und „Alle Themen“ werden respektiert; kein Ersatzwort aus fremden Themen. Zählwerte und nächster Termin betreffen den geeigneten Pool. Eine eben im Vorschule-Schreibmodus offen gezeigte englische Vokabel wird beim direkten Salatwechsel vorübergehend ausgelassen. Die unbewertete Karte bleibt unverändert. Wenn kein anderer Kandidat verfügbar ist, erklärt die Ansicht die Ausnahme und bietet über die sichtbaren Kontrollen einen Themen- oder Moduswechsel.

**Schreiben und Salat teilen dieselben stufenbezogenen Karteifächer, Reviewzähler und Termine.** Eine richtige Salatantwort ist auch in Vorschule ein englischer Abruf; Vorschule-Schreiben bleibt englisch → deutsch. Moduswechsel, Neustart und Kartenladen geben keine zusätzliche Fälligkeit oder Punkte. Bestätigte und aufgedeckte Rückmeldungen bleiben beim Moduswechsel erhalten. Überspringen bewertet und speichert nichts. Jede neue korrekte automatische Bewertung bringt weiterhin genau 1 Punkt, auch wenn die Karte später wieder fällig ist; Fehler/Aufdecken 0 Punkte.

„Benutze hier alle Buchstaben“ bezieht sich auf die dargestellte Schreibweise. Salat akzeptiert die kanonische englische Form und hinterlegte englische Varianten nur mit gleichem Buchstabenbestand. Daher passt `colour` zum Salat für `colour`; `color` verwendet einen Buchstaben weniger. Im Schreibmodus bleiben beide hinterlegten Varianten gültig. Großschreibung, harmlose Leerzeichen und typografische Apostrophe werden weiterhin normalisiert. Die App bewertet keine beliebigen Anagrammwörter.

Vor Prüfen/Aufdecken erscheinen weder die englische Zielvokabel noch ihr Beispiel oder Audio; ein ausdrücklich angeforderter Anfangsbuchstabe bleibt freiwillig. Danach stehen Musterlösung, deutsche Bedeutung, eigener Beispielsatz und lokale Audios bereit. Alle Ressourcen funktionieren offline.

Migration 019 ergänzt ausschließlich den Prüfmodus in den Bewertungsbelegen; historische Belege erhalten `write`. Keine neue Fortschrittstabelle, keine Umschreibung von IDs/Fächern/Punkten. Modus, Antwort, Karte, Thema, Stufe und erwarteter Reviewzähler werden serverseitig geprüft. Fortschritt, Beleg und etwaiger Punkt werden atomar gebucht; identische Retries verwenden dieselbe Request-ID.

# Gestufte Hilfen für Fachaufgaben

Stand: 02.10.2026 · Issues #83 und #101

## Bedienung

**Gib mir einen Tipp** öffnet den bisherigen Aufgabentipp. **Nächster Tipp** ergänzt einen konkreten Denkschritt, ein Vergleichsbeispiel oder eine Prüffrage. Der erste Tipp bleibt zum Nachlesen sichtbar. Schließen und erneutes Öffnen derselben Aufgabe behält die geöffneten Schritte; eine andere Aufgabe, ein anderes Thema, eine andere Stufe oder ein anderes Fach beginnt wieder mit Tipp 1. Die offenen Tipps sind ein vorübergehender Ansichtsstand und werden nicht in SQLite gespeichert.

Die 3.675 sichtbaren Fachaufgaben haben jeweils einen zusätzlichen Tipp. Bei einer falschen Antwort kann außerdem ein passender Hinweis erscheinen, etwa zur Verwechslung von Umfang und Fläche, einer falschen Zeiteinheit oder einer doppelten Vergangenheitsform. 151 ausdrücklich formulierte Regeln unterstützen 148 Aufgaben. Für andere falsche Antworten bleibt die allgemeine ermutigende Rückmeldung. Der vollständige Lösungsweg öffnet sich nach einer Antwort weiterhin nur auf Wunsch; nach einer richtigen Antwort steht er direkt in der Rückmeldung.

Tipps lesen kostet nichts und bucht keinen Versuch. Die Antwortprüfung und die unveränderte Erstlösungsregel vergeben weiterhin 1/2/3 Punkte. Die vorhandenen Aufgaben-IDs, Fragen, ersten Tipps, Lösungsschlüssel, Erklärungen und Lehrplanverweise wurden beibehalten. Historische Beispielaufgaben bleiben für gespeicherte Antworten erreichbar.

## Inhaltsmodell und Grenzen

Die vier Grundpakete und die neue lokale Themenbank ergänzen pro Aufgabe:

- `furtherHints`: ein bis zwei zusätzliche Texte, jeweils höchstens 500 Zeichen. Aktuell ist bei allen sichtbaren Aufgaben genau ein weiterer Tipp hinterlegt.
- `commonMistakes`: optional höchstens vier Regeln mit jeweils ein bis vier konkreten falschen Antworten und einem Hinweis von höchstens 500 Zeichen. Antworttexte haben dieselbe Grenze von 120 Zeichen wie die Eingabe.

Rust prüft Vollständigkeit, Textgrenzen, doppelte Hilfen, doppelte normalisierte Fehlerantworten und Widersprüche zum Lösungsschlüssel. Auswahlregeln dürfen sich nur auf tatsächlich angebotene Optionen beziehen. Historische, nicht mehr sichtbare Aufgaben benötigen keine nachträglich erfundenen Tipps.

Die Zuordnung verwendet dieselbe exakte Zahlen-, Text- und Auswahlbedeutung wie die vorhandene Antwortprüfung: etwa `24,0` = `24`, Text ohne ASCII-Großschreibung, Auswahltexte exakt. Es gibt keine regulären Ausdrücke, unscharfe Ähnlichkeit, KI-Auswertung oder Änderung der akzeptierten Antworten. Unbekannte falsche Antworten erhalten keinen erfundenen speziellen Fehlergrund. Einige einfache Wissensfragen lassen sich nur begrenzt in Teilschritte zerlegen; der zweite Tipp bietet dort ein Beispiel oder grenzt Begriffe gegeneinander ab. Die vorhandenen ersten Tipps sind unverändert und können bereits sehr deutlich sein.

`get_learning_state` liefert die Tipps über die bestehende begrenzte Projektion. Lösungsschlüssel, Fehlerantwortlisten und Lösungserklärungen bleiben dabei im Backend. `submit_answer` ergänzt den zur tatsächlich geprüften Antwort passenden optionalen `mistakeHint`. Die Anwendung benötigt keine neue Berechtigung, keinen neuen Command, keine Migration und keine neue Abhängigkeit.

Der Umfang betrifft die Fachaufgaben in Mathematik, Englisch sowie Natur und Technik. Die eigenen Abläufe von Lernmissionen, Vokabelkarten, Einmaleins und freien Naturspielen verwenden weiterhin ihre jeweiligen Hilfen.

## Inhaltlicher Umfang

Jede Zeile ist in allen drei frei wählbaren Stufen enthalten. „Mit Fehlerhinweis“ zählt Aufgaben mit mindestens einer gezielten Regel, nicht automatisch erkannte Arten von Lernschwierigkeiten.

| Grundthema / Erklärungsbereich | Aufgaben mit zweitem Tipp | Mit Fehlerhinweis |
| --- | ---: | ---: |
| Mengen & Zahlenmengen | 57 | 0 |
| Zahlen entdecken | 180 | 4 |
| Plus & Minus | 180 | 3 |
| Geometrie-Werkstatt | 228 | 3 |
| Mal, Geteilt & Potenzen | 360 | 28 |
| Rechentricks & Terme | 210 | 4 |
| Größen im Alltag | 336 | 31 |
| Flächen-Abenteuer | 180 | 9 |
| Hello! Das bin ich | 189 | 4 |
| Meine bunte Familie | 117 | 4 |
| Zimmer-Safari | 117 | 3 |
| Mission Schultag | 117 | 2 |
| Ein Tag voller Ideen | 81 | 19 |
| Freizeit mit Freunden | 45 | 2 |
| Im Snackladen | 117 | 3 |
| Geburtstag & Regeln | 117 | 2 |
| Gestern war ein Abenteuer | 81 | 6 |
| Geschichten-Detektive | 45 | 0 |
| Unterwegs in Großbritannien | 81 | 0 |
| Wörter-Werkstatt | 261 | 0 |
| Die Forscherwerkstatt | 45 | 2 |
| Wasser auf Reisen | 45 | 3 |
| Licht und Energie entdecken | 45 | 0 |
| Luft, Boden und Stoffdetektive | 45 | 1 |
| Die winzige Welt der Zellen | 45 | 3 |
| Sinne auf Entdeckungstour | 45 | 0 |
| Knochen, Gelenke, Muskeln | 45 | 0 |
| Dem Essen auf der Spur | 45 | 1 |
| Luft und Blut im Team | 45 | 1 |
| Wachsen und sich verändern | 45 | 0 |
| Das Geheimnis der Blüten | 45 | 0 |
| Expedition Wiese | 45 | 2 |
| Zahlenstrahl-Werkstatt | 36 | 8 |

Die feinere Auswahl und die Anzahl je Stufe stehen in der [Unterthemenmatrix](study-catalog.md). Neue gezielte Fehlerhinweise ergänzen vor allem Längenumrechnung und Simple Present.

## Prüfungen

- Bei der Umsetzung wurden Frage, bisheriger Tipp, Lösung und zusätzlicher Schritt aufeinander abgestimmt. Wiederkehrende Quadratzahlaufgaben nutzen geprüfte Vorlagen mit den tatsächlichen Faktoren. Es gibt keinen inhaltsleeren Fallback für fehlende Aufgaben.
- Ein struktureller Vergleich der vier JSON-Pakete gegen die Ausgangsversion bestätigt: Nach Entfernen der zwei neuen Felder sind sämtliche bisherigen Inhaltsdaten identisch.
- Rusttests prüfen alle Fehlerregeln gegen die jeweilige Bewertung, Eingaben mit Dezimalkomma, Gruppierungsleerzeichen und Großschreibung, unbekannte Antworten, ungültige Inhaltsregeln, Punktetreue sowie Request-Wiederholungen über neue Datenbankverbindungen.
- Frontendtests prüfen das freiwillige Öffnen einzelner Hilfestufen, Schließen per Escape, Fokus-Rückgabe, Aufgaben-/Themen-/Stufen-/Fachwechsel und die Trennung zwischen Fehlerhinweis und vollständigem Lösungsweg.
- Der unabhängige Review und seine tatsächlichen Prüfgrenzen werden in [Issue-83-Review](reviews/issue-83.md) dokumentiert. Eine Verständlichkeitsprüfung mit Kindern hat nicht stattgefunden.

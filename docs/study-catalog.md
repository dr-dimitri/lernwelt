# Gezielte Lehrplanthemen · Klasse 5

Quellenstand: 02.10.2026, Sonnensystem-Ergänzung 03.10.2026. Eigene didaktische Gliederung nach LehrplanPLUS Gymnasium Bayern. Keine amtliche Freigabe. Die Zuordnung erfasst vorhandene Lernangebote, keine vollständige Beherrschung oder Lernstandsdiagnose.

Der Katalog `src-tauri/content/study-catalog-v1.json` ist die maschinenlesbare Inhaltsmatrix. Jede sichtbare Fachaufgabe ist genau einem Unterthema zugeordnet. Weitere Zugänge wie Trainer und Lernrunden verlinken ihre eigenen unveränderten Lernstände. Der Themenkatalog benötigt keine eigene Nutzerdatenmigration. Das neue Fach Geographie erweitert die Fachliste über Migration 016 ohne Datenverlust.

## Auswahl und Runden

In Mathematik, Englisch sowie Natur und Technik startet Meine Fächer → Fach → Lernbereich → Unterthema direkt eine Runde mit höchstens sechs Aufgaben. Die Suche durchsucht Unterthema, Lernziel, Lernbereich und Stichwörter; Großschreibung und Umlaute werden normalisiert. Die Stufen bleiben frei wählbar. Noch nicht gelöste Aufgaben kommen zuerst. Nach der letzten Aufgabe endet die Runde ausdrücklich; übersprungene und falsch gelöste Aufgaben bleiben für neue Runden verfügbar. Gelöste Aufgaben können wiederholt werden, ohne erneute Erstlösungspunkte.

Der Rückweg führt zur Themenübersicht und setzt den Tastaturfokus auf ihre Überschrift. Hinweise, Quellen und weitere Angebote öffnen bei Bedarf. Der Einmaleins-Link zu Quadratzahlen öffnet diesen Rechenmodus; Lernrunden öffnen das konkrete Thema. Wortschatz-Unterthemen öffnen ihr konkretes Wortthema im Vokabeltrainer; dort bleibt die eigene Themenwahl verfügbar. Hörübungen verwenden bereits gebündelte Wort- und Satz-Audios.

Geographie öffnet eine [eigene Sonnensystemwelt](solar-system.md) mit Entdeckungsmodus, NASA-Bildern und acht Rätseln pro Stufe. Die Aufgabe ist auch in der Katalogmatrix unter „Planet Erde“ zugeordnet.

Im Unterthema „Römische Zahlen“ ergänzt eine [Zufallsübung von 1 bis 9999](roman-practice.md) die festen Katalogaufgaben. Beide Richtungen sind frei wählbar. Dynamische Aufgaben sind kein Teil der unten gezählten festen Inhaltsbank; Erstlösungen und Wiederholungen verwenden die bisherigen Punktregeln.

## Tatsächliches Angebot

Der Katalog enthält **88 Unterthemen in 18 Lernbereichen** und **3.699 Fachaufgaben**: 1.767 Mathematik, 1.368 Englisch, 540 Natur und Technik sowie 24 Geographie. Die bisherigen Unterthemen bieten mindestens zwölf Aufgaben je Stufe; Sonnensystem enthält genau acht Planetenrätsel je Stufe. Die bisherigen 615 Aufgaben bleiben erhalten; `topic-practice-v1.json` ergänzt 3.060 eigene Aufgaben. Kein Unterthema hat mehr eine leere Stufe.

Die Erweiterung ist eine endliche, vorab erstellte Aufgabenbank. Zahlvarianten, Auswahlfragen, Fehlerdetektiv-Aufgaben und kurze Anwendungssituationen ergänzen sich. Einige Grundlagen werden über Stufen hinweg wiederholt; die Anzahl ist keine Zahl vollständig unabhängiger Kompetenzen. Vorschule nutzt kleinere Schritte oder weniger Antwortmöglichkeiten; Könner reguläre Aufgaben; Streber ergänzt mehrschrittige Mathematik, Fehlerprüfung, Textanwendung, Satzlücken und Schreiben gehörter Wörter. Es gibt keine KI-Erzeugung oder KI-Antwortprüfung zur Laufzeit.

`scripts/build-topic-practice.py` ist ein Entwicklungswerkzeug, das aus dem Repository-Hauptverzeichnis die endliche Bank und die Zuordnung reproduzierbar erstellt. Die App führt es nicht aus. Nach Veröffentlichung dürfen Bedeutung und Lösung einer v1-ID nicht geändert werden; dafür sind neue IDs/Versionen nötig. Quellen, Jahrgang, Kompetenzbezug, Fremdsprachenfolge und Quellenstand stehen in den zugeordneten Themen- und Unterthemenmetadaten.

| Fach | Lernbereich | Unterthema | Bezug | Vorschule | Könner | Streber |
| --- | --- | --- | --- | ---: | ---: | ---: |
| Mathematik | Zahlen verstehen | Mengen und Zahlenmengen | M5 1.1 | 19 | 19 | 19 |
| Mathematik | Zahlen verstehen | Stellenwerte und große Zahlen | M5 1.1 | 16 | 16 | 16 |
| Mathematik | Zahlen verstehen | Römische Zahlen | M5 1.1 | 13 | 13 | 13 |
| Mathematik | Zahlen verstehen | Zahlen runden | M5 1.1 | 13 | 13 | 13 |
| Mathematik | Zahlen verstehen | Zahlenstrahl und Zahlengerade | M5 1.1 | 14 | 14 | 14 |
| Mathematik | Zahlen verstehen | Negative Zahlen und Betrag | M5 1.1 | 16 | 16 | 16 |
| Mathematik | Plus und Minus | Schriftlich addieren und subtrahieren | M5 1.2 | 15 | 15 | 15 |
| Mathematik | Plus und Minus | Plus und Minus mit negativen Zahlen | M5 1.2 | 16 | 16 | 16 |
| Mathematik | Plus und Minus | Gleichungen mit Plus und Minus | M5 1.2 | 13 | 13 | 13 |
| Mathematik | Plus und Minus | Rechenwege und Überschlag | M5 1.2 | 16 | 16 | 16 |
| Mathematik | Geometrie | Punkte im Koordinatensystem | M5 2 | 14 | 14 | 14 |
| Mathematik | Geometrie | Geraden und Abstände | M5 2 | 17 | 17 | 17 |
| Mathematik | Geometrie | Kreise und ihre Lage | M5 2 | 16 | 16 | 16 |
| Mathematik | Geometrie | Winkel messen und bestimmen | M5 2 | 14 | 14 | 14 |
| Mathematik | Geometrie | Vierecke erkennen | M5 2 | 15 | 15 | 15 |
| Mathematik | Mal und Geteilt | Schriftlich multiplizieren | M5 3.1 | 14 | 14 | 14 |
| Mathematik | Mal und Geteilt | Schriftlich dividieren | M5 3.1 | 13 | 13 | 13 |
| Mathematik | Mal und Geteilt | Teilbarkeit und Primfaktoren | M5 3.1 | 15 | 15 | 15 |
| Mathematik | Mal und Geteilt | Möglichkeiten zählen | M5 3.1 | 14 | 14 | 14 |
| Mathematik | Mal und Geteilt | Mal und Geteilt mit Vorzeichen | M5 3.1 | 15 | 15 | 15 |
| Mathematik | Mal und Geteilt | Potenzen und Verdopplung | M5 3.1 | 15 | 15 | 15 |
| Mathematik | Mal und Geteilt | Quadratzahlen bis 400 | M5 3.1 | 21 | 21 | 21 |
| Mathematik | Mal und Geteilt | Gleichungen mit Mal und Geteilt | M5 3.1 | 13 | 13 | 13 |
| Mathematik | Terme und Rechentricks | Punkt vor Strich und Klammern | M5 3.2 | 15 | 15 | 15 |
| Mathematik | Terme und Rechentricks | Rechengesetze nutzen | M5 3.2 | 14 | 14 | 14 |
| Mathematik | Terme und Rechentricks | Terme und Rechenbäume | M5 3.2 | 14 | 14 | 14 |
| Mathematik | Terme und Rechentricks | Rückwärts rechnen | M5 3.2 | 13 | 13 | 13 |
| Mathematik | Terme und Rechentricks | Sachaufgaben lösen | M5 3.2 | 14 | 14 | 14 |
| Mathematik | Größen und Einheiten | Geldbeträge umrechnen | M5 4.1 | 14 | 14 | 14 |
| Mathematik | Größen und Einheiten | Längen umrechnen | M5 4.1 | 15 | 15 | 15 |
| Mathematik | Größen und Einheiten | Massen umrechnen | M5 4.1 | 14 | 14 | 14 |
| Mathematik | Größen und Einheiten | Zeit und Uhrzeit | M5 4.1 | 14 | 14 | 14 |
| Mathematik | Größen und Einheiten | Größen schätzen | M5 4.1 | 13 | 13 | 13 |
| Mathematik | Größen und Einheiten | Dreisatz | M5 4.1 | 13 | 13 | 13 |
| Mathematik | Größen und Einheiten | Maßstab | M5 4.1 | 13 | 13 | 13 |
| Mathematik | Größen und Einheiten | Mit Größen rechnen | M5 4.1 | 16 | 16 | 16 |
| Mathematik | Flächen und Körper | Umfang und Rechteckfläche | M5 4.2 | 15 | 15 | 15 |
| Mathematik | Flächen und Körper | Flächeneinheiten umrechnen | M5 4.2 | 17 | 17 | 17 |
| Mathematik | Flächen und Körper | Flächen zerlegen und schätzen | M5 4.2 | 15 | 15 | 15 |
| Mathematik | Flächen und Körper | Quaderoberfläche | M5 4.2 | 13 | 13 | 13 |
| Englisch | Grammatik gezielt üben | be: am, is und are | E5 1.2 Grammatik | 14 | 15 | 13 |
| Englisch | Grammatik gezielt üben | Nomen, Plural und Genitiv | E5 1.2 Grammatik | 13 | 14 | 14 |
| Englisch | Grammatik gezielt üben | Begleiter und Pronomen | E5 1.2 Grammatik | 14 | 16 | 16 |
| Englisch | Grammatik gezielt üben | Orte und Präpositionen | E5 1.2 Grammatik | 13 | 12 | 12 |
| Englisch | Grammatik gezielt üben | Artikel und have got | E5 1.2 Grammatik | 14 | 14 | 14 |
| Englisch | Grammatik gezielt üben | Simple Present | E5 1.2 Grammatik | 13 | 15 | 16 |
| Englisch | Grammatik gezielt üben | Fragewörter und Fragen | E5 1.2 Grammatik | 13 | 14 | 15 |
| Englisch | Grammatik gezielt üben | Present Progressive | E5 1.2 Grammatik | 13 | 12 | 13 |
| Englisch | Grammatik gezielt üben | Mengen: much, many, some und any | E5 1.2 Grammatik | 13 | 15 | 13 |
| Englisch | Grammatik gezielt üben | can, must und needn’t | E5 1.2 Grammatik | 13 | 15 | 14 |
| Englisch | Grammatik gezielt üben | Simple Past | E5 1.2 Grammatik | 14 | 15 | 15 |
| Englisch | Grammatik gezielt üben | Sätze verbinden und ordnen | E5 1.2 Grammatik | 13 | 13 | 15 |
| Englisch | Wörter im Alltag | Hello! Das bin ich | E5 1.2 Wortschatz; E5 5 | 12 | 12 | 12 |
| Englisch | Wörter im Alltag | Meine bunte Familie | E5 1.2 Wortschatz; E5 5 | 13 | 12 | 12 |
| Englisch | Wörter im Alltag | Zimmer-Safari | E5 1.2 Wortschatz; E5 5 | 13 | 12 | 12 |
| Englisch | Wörter im Alltag | Mission Schultag | E5 1.2 Wortschatz; E5 5 | 12 | 12 | 12 |
| Englisch | Wörter im Alltag | Ein Tag voller Ideen | E5 1.2 Wortschatz; E5 5 | 14 | 12 | 12 |
| Englisch | Wörter im Alltag | Freizeit mit Freunden | E5 1.2 Wortschatz; E5 5 | 12 | 12 | 12 |
| Englisch | Wörter im Alltag | Im Snackladen | E5 1.2 Wortschatz; E5 5 | 13 | 12 | 12 |
| Englisch | Wörter im Alltag | Geburtstag & Regeln | E5 1.2 Wortschatz; E5 5 | 12 | 12 | 12 |
| Englisch | Wörter im Alltag | Gestern war ein Abenteuer | E5 1.2 Wortschatz; E5 5 | 13 | 12 | 12 |
| Englisch | Wörter im Alltag | Geschichten-Detektive | E5 1.2 Wortschatz; E5 5 | 12 | 12 | 12 |
| Englisch | Wörter im Alltag | Unterwegs in Großbritannien | E5 1.2 Wortschatz; E5 5 | 12 | 12 | 12 |
| Englisch | Wörter im Alltag | Wörter-Werkstatt | E5 1.2 Wortschatz; E5 5 | 12 | 12 | 12 |
| Englisch | Wörter im Alltag | Tierfreunde | E5 1.2 Wortschatz; E5 5 | 12 | 12 | 12 |
| Englisch | Wörter im Alltag | Kleiderschrank | E5 1.2 Wortschatz; E5 5 | 12 | 12 | 12 |
| Englisch | Wörter im Alltag | Von Kopf bis Fuß | E5 1.2 Wortschatz; E5 5 | 12 | 12 | 12 |
| Englisch | Wörter im Alltag | Wind & Wetter | E5 1.2 Wortschatz; E5 5 | 12 | 12 | 12 |
| Englisch | Wörter im Alltag | Durch das Jahr | E5 1.2 Wortschatz; E5 5 | 13 | 12 | 13 |
| Englisch | Wörter im Alltag | Zahlen entdecken | E5 1.2 Wortschatz; E5 5 | 14 | 12 | 12 |
| Englisch | Lesen, sprechen und schreiben | Begrüßen und höflich bitten | E5 1.1; E5 3 | 15 | 14 | 14 |
| Englisch | Lesen, sprechen und schreiben | Kurze Texte verstehen | E5 1.1; E5 3 | 14 | 14 | 13 |
| Englisch | Lesen, sprechen und schreiben | Englische Wörter hören | E5 1.1 Hörverstehen; E5 1.2 Aussprache | 12 | 12 | 12 |
| Englisch | Land, Leute und Lernideen | Großbritannien und Sprachmittlung | E5 2; E5 4; E5 5 | 15 | 15 | 15 |
| Englisch | Land, Leute und Lernideen | Wörter lernen und Aussprache entdecken | E5 2; E5 4; E5 5 | 15 | 15 | 15 |
| Natur und Technik | Forschen und Messen | Versuche fair vergleichen | NT5 1.1; NT5 2.1 | 15 | 15 | 15 |
| Natur und Technik | Stoffe und Naturphänomene | Wasser und Stoffzustände | NT5 1.2 | 15 | 15 | 15 |
| Natur und Technik | Stoffe und Naturphänomene | Licht, Schatten und Energie | NT5 1.2 | 15 | 15 | 15 |
| Natur und Technik | Stoffe und Naturphänomene | Luft, Boden und Stoffe | NT5 1.2 | 15 | 15 | 15 |
| Natur und Technik | Lebewesen und Zellen | Zellen und Lebewesen | NT5 2.2 | 15 | 15 | 15 |
| Natur und Technik | Der menschliche Körper | Sinne und Reaktionen | NT5 2.3 | 15 | 15 | 15 |
| Natur und Technik | Der menschliche Körper | Knochen, Gelenke und Muskeln | NT5 2.3 | 15 | 15 | 15 |
| Natur und Technik | Der menschliche Körper | Nahrung und Verdauung | NT5 2.3 | 15 | 15 | 15 |
| Natur und Technik | Der menschliche Körper | Atmung und Blutkreislauf | NT5 2.3 | 15 | 15 | 15 |
| Natur und Technik | Der menschliche Körper | Wachsen und sich verändern | NT5 2.3 | 15 | 15 | 15 |
| Natur und Technik | Samenpflanzen | Blüten und Bestäubung | NT5 2.4 | 15 | 15 | 15 |
| Natur und Technik | Lebensraum Wiese | Die Wiese als Ökosystem | NT5 2.5 | 15 | 15 | 15 |
| Geographie | Planet Erde | Reise durchs Sonnensystem | Geo5 2 | 8 | 8 | 8 |

## Quellen und Grenzen

- https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik
- https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/englisch/1-fremdsprache
- https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/nt_gym
- https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/geographie

Englisch richtet sich an die erste Fremdsprache. Zeichnen, freies Schreiben und Sprechen, Messpraxis und Versuchsaufbau werden über angeleitete Mitmachangebote mit Selbstkontrolle unterstützt. Automatische Bewertung bleibt auf eindeutig prüfbare Antworten begrenzt. Die ursprünglichen Mathematikangebote zu allen 39 Kompetenzerwartungen bleiben erhalten; neue Navigation ist keine weitergehende Vollständigkeitsbehauptung.

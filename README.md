# Lernwelt

Eine lokal laufende Desktop-Lernanwendung für Mathematik und Englisch am bayerischen Gymnasium.

## Technische Richtung

Tauri 2 · React · TypeScript · Vite · SQLite. Der Kernbetrieb funktioniert offline; Lernprofile und Lernfortschritt bleiben lokal. Die Lehrplanstruktur orientiert sich an [LehrplanPLUS Bayern](https://www.lehrplanplus.bayern.de/).

## Mitarbeit

Die verbindlichen Projektregeln stehen in [AGENTS.md](AGENTS.md). Jede Umsetzung benötigt ein GitHub-Issue, einen eigenen Branch, einen dokumentierten Review und einen anschließenden Merge nach `main`. Neu entdeckte Bugs werden als eigene Issues erfasst.

Projektskills: [Issue-Workflow](.agents/skills/lernwelt-issue-workflow/SKILL.md) und [Desktop-Entwicklung](.agents/skills/lernwelt-desktop/SKILL.md).

## Lokal entwickeln

Voraussetzungen: Node.js ab 22.12, npm, stabiles Rust und die [Tauri-Systemvoraussetzungen](https://v2.tauri.app/start/prerequisites/) für die jeweilige Plattform (macOS: Xcode Command Line Tools; Windows: C++ Build Tools und WebView2).

```sh
npm ci
npm run desktop:dev
```

`npm run dev` öffnet nur die Browser-Vorschau; die eigenständige Anwendung startet über `desktop:dev`.

```sh
npm run build
npm run desktop:build -- --bundles app  # macOS .app
npm run desktop:build -- --bundles nsis # Windows Installer, auf Windows ausführen
```

Native Artefakte liegen unter `src-tauri/target/release/bundle/`. Die lokale macOS-App ist noch nicht signiert oder notarisiert. Mathematik Klasse 5 enthält ein offline gebündeltes Übungspaket für alle sieben Lernbereiche; Englisch Klasse 5 bietet zwölf eigene Themen für die erste Fremdsprache.

## Lokale Daten

Das Lernprofil (Spitzname und Jahrgangsstufe 5–13) wird in `lernwelt.sqlite3` im Tauri-Anwendungsdatenverzeichnis `de.lernwelt.desktop` gespeichert. Auf macOS ist dies `~/Library/Application Support/de.lernwelt.desktop/`, auf Windows unter `%APPDATA%\\de.lernwelt.desktop\\`. Die Browser-Vorschau zeigt einen Hinweis statt Speicherung zu simulieren.

Die Datenbank enthält außerdem eine Grundlage für fach- und kompetenzbezogenen Lernfortschritt. Mathematik- und Englischaufgaben sind an das Punktesystem angeschlossen. Eine fachübergreifende Stufenauswahl wird ebenfalls lokal gespeichert. Änderungen am Profil erhalten vorhandenen Fortschritt. Für eine manuelle Sicherung die App vollständig beenden und die Datenbankdatei kopieren; es gibt noch keinen integrierten Export und keine Synchronisierung.

```sh
cargo test --manifest-path src-tauri/Cargo.toml
```

## Qualität prüfen

```sh
npm run check:all       # Formatierung, Frontend-Tests, TypeScript, Build, Rust-Checks und -Tests
npm run test:watch      # Frontend-Tests während der Entwicklung
npm run format         # Frontend- und Konfigurationsformatierung anwenden
```

Rust-Prüfungen benötigen `rustfmt` und `clippy`. In CI wird Rust 1.98.1 mit Node.js 24 verwendet. GitHub Actions prüft Pull Requests auf macOS und Windows und erstellt native Debug-Programme als kurzlebige Prüfartefakte. Diese sind keine signierten Installer. `npm run desktop:build` baut lokal ein Release-Artefakt.

Der CI-Workflow kontrolliert bei Pull Requests den Issue-Branch, die passende `Closes #…`-Verknüpfung und die Reviewdatei. Das ersetzt nicht den inhaltlichen Review. Branch Protection ist nicht automatisch eingerichtet.

Details: [Architektur](docs/architecture.md), [Reviewnachweise](docs/reviews/).

## Punkte und Abzeichen

Nach dem Speichern eines Lernprofils können die Aufgaben in Mathematik und Englisch beantwortet werden. Jede Lernaufgabe in den Themenbereichen bringt bei der ersten korrekten Lösung **1 Punkt in Vorschule**, **2 Punkte in Könner** oder **3 Punkte in Streber**. Maßgeblich ist die Stufe der Aufgabe. Falsche Antworten und Wiederholungen ziehen nichts ab; bereits gelöste Aufgaben geben keine weiteren Punkte. Bestehender Fortschritt aus älteren Versionen bleibt erhalten, erhält aber keine rückwirkenden Punkte.

Das Punktekonto zeigt verfügbares Guthaben und insgesamt verdiente Punkte. Die Abzeichen **Sternsammler** und **Lernfuchs** kosten jeweils **20 Punkte**, sind einmalig einlösbar und bleiben nach einem Neustart in der Sammlung. Bereits gebuchte Punkte bleiben bei Regeländerungen erhalten; es gibt keine rückwirkende Neuberechnung. Weitere Belohnungen lassen sich ergänzen.

Antworten werden lokal im Rust-Backend geprüft. Gutschrift und Lernfortschritt werden gemeinsam gespeichert; Einlösen prüft das Guthaben und bucht atomar ab. Doppelte Requests erzeugen keine doppelten Buchungen. Das lokale System bietet keine manipulationssichere Währung und hat keinen Geldwert.

Die Aufgaben stehen getrennt von Antwortprüfung und Punktebuchung in `src-tauri/content/curriculum-v1.json`. Bestehende Aufgaben-IDs behalten ihre Bedeutung; alte Beispielaufgaben beider Fächer bleiben für gespeicherte Buchungen und Wiederholungsrequests intern auflösbar.


## Mathematik Klasse 5

363 eigene Aufgaben nach [LehrplanPLUS Gymnasium Bayern, Mathematik 5](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik), Quellenstand 24.09.2026. Zu allen 39 Kompetenzerwartungen gibt es in acht Themen konkrete Lernangebote aus Bildschirmübungen und angeleiteten Tätigkeiten. Die Inhaltsmatrix belegt jede Zuordnung und benennt Grenzen der automatischen Bewertung.

- Mengen & Zahlenmengen: Elemente, Mengenschreibweise, ∈/∉ und natürliche/ganze Zahlen.

- Zahlen entdecken: Stellenwerte, römische Zahlen, Runden, Zahlengerade, ganze Zahlen und Betrag.
- Plus & Minus: schriftliches Rechnen, Überschläge, Vorzeichen, Gleichungen und Rechenwege.
- Geometrie-Werkstatt: Koordinaten, Geraden, Abstände, Kreise, Winkel und Vierecke.
- Mal, Geteilt & Potenzen: schriftliches Rechnen, Teilbarkeit, Primfaktoren, Zählprinzip, Vorzeichen, Potenzen und Gleichungen.
- Rechentricks & Terme: Rechenreihenfolge, Klammern, Rechengesetze, Termstruktur und Sachaufgaben.
- Größen im Alltag: Geld, Längen, Massen, Zeit, Schätzen, Dreisatz und Maßstäbe.
- Flächen-Abenteuer: Flächeninhalt, Umfang, Einheiten, zusammengesetzte Flächen und Quaderoberflächen.

**Vorschule** bietet einen leichten Einstieg, **Könner** reguläre Übungen und **Streber** anspruchsvollere Knobelaufgaben. Es sind spielerische Bezeichnungen, keine Altersstufen. Die Wahl bleibt über Fachwechsel, Profiländerung und Neustart erhalten; Standard ist Könner. Englisch bietet ebenfalls alle drei Stufen (1. Fremdsprache). Die angebotene Mathematik bleibt Klasse 5, auch wenn im Profil eine andere Klasse steht.

Jede Bildschirmaufgabe bietet einen Tipp und nach der Antwort einen erklärten Lösungsweg. Auswahlfragen, ganze Zahlen und exakte Dezimalzahlen werden im Backend bewertet. Komma oder Punkt gelten als Dezimaltrennzeichen, normale/geschützte Leerzeichen als Dreiergruppierung: `25 000` oder `25000`; `25.000` bedeutet 25. Einheiten stehen in der Frage und werden nicht mit eingegeben. Englischwörter werden ohne Beachtung der Großschreibung verglichen.

51 Mitmachaufgaben ergänzen Zeichnen, Messen, Schätzen und Begründen mit Selbstkontrollhinweisen. Sie gelten für alle Stufen, vergeben keine Punkte und werden nicht automatisch bewertet. Einheitentafeln für Geld, Länge, Masse und Fläche sowie die vollständige Quadratzahlreihe bis 400 ergänzen die Übungen. Das Paket enthält Lernangebote zu allen Kompetenzerwartungen, ist aber kein unbegrenzter Aufgabengenerator, keine vollständige Lernstandserhebung und kein Ersatz für Unterricht. Es gibt keine amtliche Freigabe. Weitere Hinweise und die Inhaltsmatrix stehen in [docs/curriculum-math-5.md](docs/curriculum-math-5.md).

## Spielhalle

Verdiente Lernpunkte lassen sich für vier eigene Offline-Spiele einlösen. Eine Runde kostet **10 Lernpunkte**, unabhängig vom Lern-Schwierigkeitsgrad:

- **Klötzchen-Kosmos:** fallende Formen drehen und vollständige Reihen bilden (bis zu vier Minuten).
- **Sternenlabyrinth:** ein buntes Abenteuer in der Ich-Perspektive mit zufälligem Labyrinth, fünf Sternen, Blasenwerfer und Ausgangsportal (bis zu vier Minuten).
- **Sternenwache:** sechs Wellen frecher Weltraumroboter mit Lichtblitzen abwehren.
- **Hühner-Rummel:** fliegende Hühner mit Konfetti erwischen (90 Sekunden).

Eine bereits bezahlte Wolkenflitzer-Runde bleibt kostenlos spielbar, neue Runden nutzen das Sternenlabyrinth mit eigenen Bestwerten. Seine Karte zeigt den Weg zum nächsten Stern und danach zum Portal. Die Welten sind zusammenhängend; jeder Neustart erzeugt eine neue Welt. Die verlängerten Zeitlimits ändern nichts daran, dass eine Runde durch Zielerreichung oder verlorene Herzen früher enden kann.

Jedes Spiel bietet deutsche Anleitungen, Tastatur- und Bildschirmtasten, Pause und ein sichtbares Rundenende. Hühner können zusätzlich direkt angetippt werden. Beim Fokusverlust pausiert das Spiel. **Spielpunkte und Bestwerte sind getrennt von Lernpunkten** und bringen kein neues Guthaben. Keine automatische kostenpflichtige Wiederholung.

Eintritt, offene Runde und abgeschlossene Bestwerte werden lokal gespeichert. Nach Verlassen oder App-Neustart lässt sich eine offene bezahlte Runde kostenlos von vorn starten; die genaue Spielposition wird nicht gespeichert. Erst nach Abschluss dieser Runde ist ein neues Spiel auswählbar. Ein Speicherfehler lässt sich ohne weitere Abbuchung erneut versuchen. Die Spielauswahl zeigt statische Vorschauen der echten Spielgrafik. Kristallblöcke, ein perspektivisches Sternenlabyrinth mit freundlichen Robotern, Raumschiffe mit Triebwerken und flatternde Hühner auf dem Bauernhof werden lokal im Canvas gezeichnet, auf hochauflösenden Displays mit bis zu doppelter interner Auflösung. Animationen folgen der aktiven Spielzeit; in der Pause ruht die Zeichenschleife. Es werden keine Original-Assets der bekannten Spiele und keine neuen Bibliotheken eingebunden.

## Englisch Klasse 5

108 eigene Aufgaben in zwölf Themen, je drei pro Thema und Stufe, dazu 24 Mitmachaufgaben. Begrüßung, Familie, Wohnen, Schule, Tagesablauf, Freizeit, Einkaufen, Geburtstag, Vergangenheit, Lesen, Landeskunde und Lernstrategien verbinden Wortschatz mit Grammatik. Die Aufgaben sind kurz formuliert und enthalten Tipps und Erklärungen. Neue korrekte Lösungen bringen wie in Mathematik 1/2/3 Punkte.

Grundlage: [LehrplanPLUS Englisch 5, erste Fremdsprache](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/englisch/1-fremdsprache). Thematische Orientierung: [öffentlicher Stoffverteilungsplan Green Line Bayern 1](https://assets.klett.de/assets/43500837/StoffverteilungsplanBd1.pdf), Bayern-Ausgabe ab 2017, ISBN 978-3-12-803010-4. Quellenstand 24.09.2026. Eigene Texte und Aufgaben; kein Klett-Lehrbuchimport und keine vom Verlag freigegebene Begleitsoftware.

Sprechen, freies Schreiben und Hörverstehen werden durch angeleitete Aktivitäten mit Selbstkontrolle bzw. Vorleseperson geübt. Keine Audioaufnahmen, keine automatische Aussprache- oder Freitextbewertung. Das begrenzte Paket ist keine vollständige Abdeckung jedes Lehrbuchinhalts und keine vollständige Lernstandserhebung. Die Themen bleiben Klasse 5, auch bei einer anderen Profilklasse. [Inhaltsübersicht und Grenzen](docs/curriculum-english-5.md).

## Vokabeltrainer

Der eigene Bereich **Vokabeltrainer** enthält 370 selbst erstellte Wortkarten in 18 Themen, mit deutscher Bedeutung und englischem Beispielsatz. Die Wortauswahl orientiert sich thematisch an Green Line Bayern 1 ab 2017, ist aber keine vollständige Buchwortliste. **Vorschule** fragt Englisch → Deutsch ab, **Könner** Deutsch → Englisch, **Streber** das englische Wort in einer Satzlücke mit deutscher Bedeutungshilfe. Jede Stufe hat ihren eigenen Kartenfortschritt; die Auswahl der Stufe bleibt fachübergreifend.

Tippe deine Übersetzung ein und wähle **Antwort prüfen** (oder drücke Enter). Rust prüft die Antwort gegen hinterlegte Übersetzungen und häufige Varianten. Groß-/Kleinschreibung, zusätzliche Leerzeichen und gerade/typografische Apostrophe werden normalisiert; bei deutschen Antworten sind begleitende Artikel erlaubt. Es gibt keine unscharfe KI-Prüfung: nicht jede mögliche Umschreibung wird erkannt. Die angezeigte Lösung ist ein Beispiel, keine Liste aller akzeptierten Varianten.

**Jede richtige Vokabelantwort bringt 1 Lernpunkt**, unabhängig von der Stufe und auch bei einer später fälligen Wiederholung. Doppelte Übertragungen derselben Antwort geben keine weiteren Punkte. Falsche Antworten und **Weiß ich noch nicht · Lösung zeigen** geben 0 Punkte; es gibt keinen Abzug. Die Belohnung gehört zum gemeinsamen Guthaben für Spiele und Abzeichen. Frühere Selbsteinschätzungen erhalten keine rückwirkenden Punkte. Die Englisch-Lernaufgaben vergeben weiterhin 1/2/3 Punkte.

Fünf Karteifächer planen die Wiederholung: Bei einer richtigen Antwort wandert die Karte ein Fach weiter (höchstens Fach 5), mit 1, 3, 7 oder 14 Tagen Abstand. Bei einer falschen Antwort oder freiwilligem Aufdecken geht sie zurück in Fach 1 und wird nach einer Minute wieder fällig. Bereits fällige Karten werden vor neuen Karten angeboten. Sind alle Karten des gewählten Themas für später geplant, zeigt die App den nächsten Termin. Über **Fällige Karten laden** wird die Auswahl aktualisiert; bei jeder Bewertung und jedem Themenwechsel ebenfalls. Kein Zeitdruck, keine automatische Benachrichtigung.

Neu hinzugekommen sind unter anderem Tiere, Kleidung, Körper, Wetter, Kalender und Zahlen. Alle ursprünglichen 120 Karten behalten ihre IDs und Inhalte; ergänzt wurden 250 Karten und Antwortvarianten. [Wortschatzumfang und Prüfung](docs/vocabulary-5.md).

Kartenstand und Wiederholungstermine bleiben lokal in SQLite gespeichert. Die Geräteuhr bestimmt die Termine. Neue Profilnamen oder Klassen ändern den vorhandenen Fortschritt nicht. Es gibt noch keinen Import eigener Karten, keine Ausspracheaufnahmen und keine Synchronisierung.

## Einmaleins-Trainer

Neben dem Vokabeltrainer gibt es einen eigenen Bereich für **10er-Einmaleins (1 × 1 bis 10 × 10)** und **Quadratzahlen (10 × 10 bis 25 × 25)**. Beim 10er-Einmaleins enthält jede Runde weiterhin alle 100 Aufgaben. Bei den Quadratzahlen werden pro Runde fünf verschiedene Aufgaben zufällig aus 10 × 10 bis 25 × 25 gewählt. Jede davon kommt viermal vor: insgesamt 20 zufällig gemischte Aufgaben. Für die nächste Runde werden fünf Aufgaben neu ausgewählt; Überschneidungen mit früheren Runden sind möglich. Es gibt keinen Timer. Rechentipps helfen beim Üben.

Ergebnis eintippen und Enter oder **Antwort prüfen** drücken. Jede richtige neue Antwort gibt **1 Lernpunkt**, auch in weiteren Runden und unabhängig von der globalen Stufe. Falsche Antworten und **Lösung zeigen** geben 0 Punkte ohne Abzug. Nach der Rückmeldung führt **Nächste Aufgabe** weiter. Die Punkte sind im gemeinsamen Guthaben für Spiele und Abzeichen verfügbar.

Aufgabenstand und Anzahl richtiger Antworten bleiben pro Rechenart in SQLite erhalten. Beim erneuten Öffnen geht es nach der zuletzt gespeicherten Antwort weiter; noch nicht gesendete Eingaben bleiben nicht erhalten. Doppelte Übertragungen derselben Antwort buchen nichts zusätzlich. Bei einem Speicherfehler lässt sich dieselbe Antwort erneut speichern oder der bestätigte Stand neu laden.

Eigene prozedurale Aufgaben mit stabilen Inhalts-IDs, Fach Mathematik, Zuordnung Klasse 5 / M5 3.1 (Grundfertigkeiten beim Multiplizieren und Quadratzahlen), Inhaltsstand 24.09.2026. Ergänzendes Üben, keine vollständige Lehrplanabdeckung oder Lernstandsdiagnose. Das 10er-Einmaleins verwendet weiterhin eine feste gemischte Folge. Die zufällige Auswahl und Reihenfolge einer Quadratzahlenrunde werden vollständig gespeichert und bleiben bei Moduswechsel, Neuladen und Neustart erhalten. Beim Update auf Faktoren ab 10 wird eine offene Quadratzahlenrunde neu zusammengestellt; bereits beantwortete Versuche bleiben gespeichert. Ohne bisher beantwortete Runde beginnt die Rundennummer bei 1; die bisherige Gesamtstatistik, Antworten und Punkte bleiben erhalten. Historische Antworten verwenden beim erneuten Übertragen weiterhin ihre ursprüngliche Aufgabe. Noch nicht gespeicherte Eingaben aus der alten Version werden nicht übernommen. Keine adaptive Aufgabenwahl.

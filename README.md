# Lernwelt

Eine lokal laufende Desktop-Lernanwendung für Mathematik, Englisch sowie Natur und Technik am bayerischen Gymnasium.

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

## Bedienung

Die Startseite **Meine Fächer** bietet eine durchsuchbare Fächerübersicht. Eine feste Seitennavigation führt zu Fächern, Trainern und Spielhalle; im schmalen Fenster öffnet **Menü öffnen** dieselben Bereiche. **Alle Fächer** führt aus einer Übung zurück zur Auswahl, **Dein Profil** bleibt oben erreichbar. [Gestaltung und Apple-HIG-Bezug](docs/interface.md).

## Lokale Daten

Das Lernprofil (Spitzname und Klasse 5) wird in `lernwelt.sqlite3` im Tauri-Anwendungsdatenverzeichnis `de.lernwelt.desktop` gespeichert. Auf macOS ist dies `~/Library/Application Support/de.lernwelt.desktop/`, auf Windows unter `%APPDATA%\\de.lernwelt.desktop\\`. Die Browser-Vorschau zeigt einen Hinweis statt Speicherung zu simulieren.

In der Klassenauswahl steht ausschließlich Klasse 5 zur Verfügung. Ältere Profile mit einer anderen Klasse bleiben lesbar und werden beim Laden nicht verändert. Ein Hinweis erklärt die bisherige Klasse; erst **Profil speichern** stellt sie auf Klasse 5 um. Der Lernfortschritt bleibt erhalten.

Die Datenbank enthält außerdem eine Grundlage für fach- und kompetenzbezogenen Lernfortschritt. Aufgaben in allen drei Fächern sind an das Punktesystem angeschlossen. Eine fachübergreifende Stufenauswahl wird ebenfalls lokal gespeichert. Änderungen am Profil erhalten vorhandenen Fortschritt. Für eine manuelle Sicherung die App vollständig beenden und die Datenbankdatei kopieren; es gibt noch keinen integrierten Export und keine Synchronisierung.

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

## Deine Lernrunde

Auf **Meine Fächer** führt die Karte **Deine Lernrunde** zum ersten Lernabenteuer über den Rechteckumfang: **Ein Zaun für unseren Garten**. Fünf kurze Schritte verbinden Erinnern, ein anschauliches Beispiel, eigenes Lösen, Fehlerdetektiv und eine freiwillige Mitmachaufgabe. Alle drei Stufen sind wählbar; bestätigte Schritte bleiben bei Unterbrechung und Neustart erhalten.

Die App plant Wiederholungen lokal und bietet drei geprüfte Varianten je Stufe. Tipps, Aufdecken und selbstständige erste Antworten werden unterschieden. Der Themenfortschritt zeigt **ausprobiert**, **selbst gelöst** und **später wieder geschafft**. Neue automatisch geprüfte Erstlösungen erhalten die üblichen 1/2/3 Punkte; Beispiele und Mitmachen vergeben keine Punkte. Es gibt kein Zeitlimit. Das erste Thema ist ein begrenztes Angebot, keine vollständige Lernstandsdiagnose. [Ablauf, Forschungsbezug und Grenzen](docs/learning-missions.md).

## Punkte und Abzeichen

Nach dem Speichern eines Lernprofils können die Aufgaben in Mathematik, Englisch sowie Natur und Technik beantwortet werden. Jede Lernaufgabe in den Themenbereichen bringt bei der ersten korrekten Lösung **1 Punkt in Vorschule**, **2 Punkte in Könner** oder **3 Punkte in Streber**. Maßgeblich ist die Stufe der Aufgabe. Falsche Antworten und Wiederholungen ziehen nichts ab; bereits gelöste Aufgaben geben keine weiteren Punkte. Bestehender Fortschritt aus älteren Versionen bleibt erhalten, erhält aber keine rückwirkenden Punkte.

Das Punktekonto zeigt verfügbares Guthaben und insgesamt verdiente Punkte. Die Abzeichen **Sternsammler** und **Lernfuchs** kosten jeweils **20 Punkte**, sind einmalig einlösbar und bleiben nach einem Neustart in der Sammlung. Bereits gebuchte Punkte bleiben bei Regeländerungen erhalten; es gibt keine rückwirkende Neuberechnung. Weitere Belohnungen lassen sich ergänzen.

Antworten werden lokal im Rust-Backend geprüft. Gutschrift und Lernfortschritt werden gemeinsam gespeichert; Einlösen prüft das Guthaben und bucht atomar ab. Doppelte Requests erzeugen keine doppelten Buchungen. Das lokale System bietet keine manipulationssichere Währung und hat keinen Geldwert.

Die Aufgaben stehen getrennt von Antwortprüfung und Punktebuchung in `src-tauri/content/curriculum-v1.json`. Bestehende Aufgaben-IDs behalten ihre Bedeutung; alte Beispielaufgaben beider Fächer bleiben für gespeicherte Buchungen und Wiederholungsrequests intern auflösbar.


## Mathematik Klasse 5

399 eigene Aufgaben nach [LehrplanPLUS Gymnasium Bayern, Mathematik 5](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik), Quellenstand des Grundpakets 24.09.2026, Zahlenstrahl-Ergänzung 26.09.2026. Zu allen 39 Kompetenzerwartungen gibt es in neun Themen konkrete Lernangebote aus Bildschirmübungen und angeleiteten Tätigkeiten. Die Inhaltsmatrix belegt jede Zuordnung und benennt Grenzen der automatischen Bewertung.

- Mengen & Zahlenmengen: Elemente, Mengenschreibweise, ∈/∉ und natürliche/ganze Zahlen.

- Zahlen entdecken: Stellenwerte, römische Zahlen, Runden, Zahlengerade, ganze Zahlen und Betrag.
- Plus & Minus: schriftliches Rechnen, Überschläge, Vorzeichen, Gleichungen und Rechenwege.
- Geometrie-Werkstatt: Koordinaten, Geraden, Abstände, Kreise, Winkel und Vierecke.
- Mal, Geteilt & Potenzen: schriftliches Rechnen, Teilbarkeit, Primfaktoren, Zählprinzip, Vorzeichen, Potenzen und Gleichungen.
- Rechentricks & Terme: Rechenreihenfolge, Klammern, Rechengesetze, Termstruktur und Sachaufgaben.
- Größen im Alltag: Geld, Längen, Massen, Zeit, Schätzen, Dreisatz und Maßstäbe.
- Flächen-Abenteuer: Flächeninhalt, Umfang, Einheiten, zusammengesetzte Flächen und Quaderoberflächen.
- Zahlenstrahl-Werkstatt: Zahlen ablesen und markieren, Skalen erkennen, Abstände und Schritte untersuchen.

Die **Zahlenstrahl-Werkstatt** bietet 36 zusätzliche Übungen, zwölf pro Stufe. Über **Mathematik → Thema wählen → Zahlenstrahl-Werkstatt** erscheinen beschriftete Zahlenstrahlen und Zahlengeraden. Zum Markieren einen Teilstrich anklicken oder per Tab erreichen und mit den Pfeiltasten wählen; Pos1/Ende wählen den ersten/letzten Teilstrich. Erst **Antwort prüfen** bewertet die Auswahl. Ohne Zeitlimit, mit Tipps, Lösungswegen und Textbeschreibung zur Grafik. Auf schmalen Fenstern lässt sich die Achse seitlich verschieben. Die gewohnte Punktevergabe und der gespeicherte Fortschritt gelten auch hier. [Inhalte, Lehrplanbezug und Grenzen](docs/curriculum-number-line-5.md).

**Vorschule** bietet einen leichten Einstieg, **Könner** reguläre Übungen und **Streber** anspruchsvollere Knobelaufgaben. Es sind spielerische Bezeichnungen, keine Altersstufen. Die Wahl bleibt über Fachwechsel, Profiländerung und Neustart erhalten; Standard ist Könner. Englisch bietet ebenfalls alle drei Stufen (1. Fremdsprache). Die angebotene Mathematik bleibt Klasse 5, auch wenn ein älteres Profil noch eine andere Klasse enthält.

Jede Bildschirmaufgabe bietet einen Tipp und nach der Antwort einen erklärten Lösungsweg. Auswahlfragen, ganze Zahlen und exakte Dezimalzahlen werden im Backend bewertet. Komma oder Punkt gelten als Dezimaltrennzeichen, normale/geschützte Leerzeichen als Dreiergruppierung: `25 000` oder `25000`; `25.000` bedeutet 25. Einheiten stehen in der Frage und werden nicht mit eingegeben. Englischwörter werden ohne Beachtung der Großschreibung verglichen.

54 Mitmachaufgaben ergänzen Zeichnen, Messen, Schätzen und Begründen mit Selbstkontrollhinweisen. Sie gelten für alle Stufen, vergeben keine Punkte und werden nicht automatisch bewertet. Einheitentafeln für Geld, Länge, Masse und Fläche sowie die vollständige Quadratzahlreihe bis 400 ergänzen die Übungen. Das Paket enthält Lernangebote zu allen Kompetenzerwartungen, ist aber kein unbegrenzter Aufgabengenerator, keine vollständige Lernstandserhebung und kein Ersatz für Unterricht. Es gibt keine amtliche Freigabe. Weitere Hinweise und die Inhaltsmatrix stehen in [docs/curriculum-math-5.md](docs/curriculum-math-5.md).

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

Sprechen, freies Schreiben und Hörverstehen werden durch angeleitete Aktivitäten mit Selbstkontrolle bzw. Vorleseperson geübt. Keine Audioaufnahmen, keine automatische Aussprache- oder Freitextbewertung. Das begrenzte Paket ist keine vollständige Abdeckung jedes Lehrbuchinhalts und keine vollständige Lernstandserhebung. Die Themen bleiben Klasse 5, auch wenn ein älteres Profil noch eine andere Klasse enthält. [Inhaltsübersicht und Grenzen](docs/curriculum-english-5.md).

## Vokabeltrainer

Der eigene Bereich **Vokabeltrainer** enthält 370 selbst erstellte Wortkarten in 18 Themen, mit deutscher Bedeutung und englischem Beispielsatz. Die Wortauswahl orientiert sich thematisch an Green Line Bayern 1 ab 2017, ist aber keine vollständige Buchwortliste. **Vorschule** fragt Englisch → Deutsch ab, **Könner** Deutsch → Englisch, **Streber** das englische Wort in einer Satzlücke mit deutscher Bedeutungshilfe. Jede Stufe hat ihren eigenen Kartenfortschritt; die Auswahl der Stufe bleibt fachübergreifend.

Tippe deine Übersetzung ein und wähle **Antwort prüfen** (oder drücke Enter). Rust prüft die Antwort gegen hinterlegte Übersetzungen und häufige Varianten. Groß-/Kleinschreibung, zusätzliche Leerzeichen und gerade/typografische Apostrophe werden normalisiert; bei deutschen Antworten sind begleitende Artikel erlaubt. Es gibt keine unscharfe KI-Prüfung: nicht jede mögliche Umschreibung wird erkannt. Die angezeigte Lösung ist ein Beispiel, keine Liste aller akzeptierten Varianten.

**Jede richtige Vokabelantwort bringt 1 Lernpunkt**, unabhängig von der Stufe und auch bei einer später fälligen Wiederholung. Doppelte Übertragungen derselben Antwort geben keine weiteren Punkte. Falsche Antworten und **Weiß ich noch nicht · Lösung zeigen** geben 0 Punkte; es gibt keinen Abzug. Die Belohnung gehört zum gemeinsamen Guthaben für Spiele und Abzeichen. Frühere Selbsteinschätzungen erhalten keine rückwirkenden Punkte. Die Englisch-Lernaufgaben vergeben weiterhin 1/2/3 Punkte.

Fünf Karteifächer planen die Wiederholung: Bei einer richtigen Antwort wandert die Karte ein Fach weiter (höchstens Fach 5), mit 1, 3, 7 oder 14 Tagen Abstand. Bei einer falschen Antwort oder freiwilligem Aufdecken geht sie zurück in Fach 1 und wird nach einer Minute wieder fällig. Bereits fällige Karten werden vor neuen Karten angeboten. Sind alle Karten des gewählten Themas für später geplant, zeigt die App den nächsten Termin. Über **Fällige Karten laden** wird die Auswahl aktualisiert; bei jeder Bewertung und jedem Themenwechsel ebenfalls. Kein Zeitdruck, keine automatische Benachrichtigung.

Neu hinzugekommen sind unter anderem Tiere, Kleidung, Körper, Wetter, Kalender und Zahlen. Alle ursprünglichen 120 Karten behalten ihre IDs und Inhalte; ergänzt wurden 250 Karten und Antwortvarianten. [Wortschatzumfang und Prüfung](docs/vocabulary-5.md).

Kartenstand und Wiederholungstermine bleiben lokal in SQLite gespeichert. Die Geräteuhr bestimmt die Termine. Neue Profilnamen oder das Umstellen eines älteren Profils auf Klasse 5 ändern den vorhandenen Fortschritt nicht. Es gibt noch keinen Import eigener Karten, keine Ausspracheaufnahmen und keine Synchronisierung.

## Einmaleins-Trainer: Werkstatt und Insel

In der **Roboterwerkstatt** baust du eigene Roboter in drei Modellen und Farben. Auf der **Einmaleins-Insel** entstehen Brücke, Baumhaus, Garten, Werkstatt, Sternwarte und Leuchtturm. Eigene skalierbare Grafiken zeigen den Baufortschritt. Beide Lernspiele sind kostenlos und funktionieren offline.

Eine Etappe dauert **acht geübte Aufgaben**. Jede gespeicherte Antwort baut weiter; automatisch richtige Antworten bringen zusätzlich je **1 Lernpunkt**, falsche Antworten und Aufdecken 0 Punkte. Kein Timer, kein Abzug, keine verlorenen Bauteile. Nach der Etappe entscheidest du, ob du weiterbauen oder eine Pause machen möchtest. Fertige Roboter bleiben im Bauregal; beide Welten behalten eigene Fortschritte.

Wähle das gemischte Einmaleins (1 × 1 bis 10 × 10), eine einzelne Reihe oder Quadratzahlen **10² bis 20²**. Gemischte Runden enthalten 100 Aufgaben, einzelne Reihen zehn. Eine Quadratrunde enthält fünf zufällig ausgewählte Aufgaben je viermal. Die kurzen Bauetappen laufen unabhängig davon. Auf Wunsch zeigen Rechentipps Gruppen und Teilflächen. Falsche oder aufgedeckte Aufgaben kannst du später in einer freiwilligen Wiederholungsrunde üben.

Welt, Rechenart, Gestaltung und bestätigte Antworten bleiben lokal gespeichert. Wiederholte Übertragungen zählen nicht doppelt. Bei Speicherfehlern lässt sich erneut speichern oder der bestätigte Stand laden. Historische Antworten und Punkte bleiben unverändert; neue Quadratzahlaufgaben halten sich an den im Lehrplan genannten Automatisierungsumfang bis 400. Eigene Inhalte zu Klasse 5 / M5 3.1 und M5 3.2, Quellenstand 25.09.2026; keine vollständige Lehrplanabdeckung oder Lernstandsdiagnose. [Lehrplanbezug, Spielregeln und Grenzen](docs/multiplication-adventures.md).

## Kompakte Bedienung

Die Hauptansichten sind für ein Laptopfenster von 1100 × 750 Pixeln ausgelegt. Navigation, Stufenwahl und aktuelle Aufgabe stehen kompakt beieinander. **Dein Profil** ist oben erreichbar. Themenwahl, Tipps, Erklärungen, Abzeichen und Quellen öffnen eigene Fenster; Escape oder **Schließen** führt zurück. Umfangreiche Mitmachangebote und Tabellen lassen sich durchblättern. Die Rückmeldung erscheint nach einer Antwort direkt mit einem Knopf zum Weiterüben.

Die Spielsteuerung und Pause stehen neben dem Spielfeld; nach dem Ende erscheint eine kompakte Ergebnisansicht. Auf kleineren Fenstern bzw. bei vergrößerter Schrift darf weiterhin gescrollt werden, damit keine Inhalte oder Bedienelemente abgeschnitten werden.

## Natur und Technik Klasse 5

**108 eigene Fragen in zwölf Themen**, je drei Aufgaben pro Stufe und Thema, sowie **24 Mitmachaufgaben** für Kinder von 10–12 Jahren. Die Inhalte orientieren sich am [LehrplanPLUS Natur und Technik 5, Gymnasium Bayern](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/nt_gym), Quellenstand 25.09.2026. Naturwissenschaftliches Arbeiten und Biologie werden verbunden: Forschen, Wasser und Teilchen, Licht und Energie, Luft und Materialien, Zellen, Sinne, Bewegung, Ernährung, Atmung und Kreislauf, Entwicklung, Samenpflanzen und Grünland.

Über **Meine Fächer → Natur und Technik** lassen sich Fragen und Lernspiele auswählen. Kurze Fragen mit Alltagssituationen, Beobachtungen und Messwerten bieten Tipps und erklärte Lösungen. Ein Blütenschnitt und Teilchenbilder helfen beim Verstehen; Mitmachaufgaben ergänzen Zeichnen, Beobachten und Erklären. Für neue richtige Fachantworten gelten dieselben gespeicherten **1/2/3 Lernpunkte** und dieselbe freie Stufenauswahl wie in den anderen Fächern.

Drei lokal gezeichnete Lernspiele bieten zusätzlich freies Üben ohne Zeitdruck:

- **Stoff-Labor:** Stoffzustände und Veränderungen mit Teilchenbildern verbinden.
- **Pflanzen-Werkstatt:** Teile und Funktionen einer Blüte erkunden.
- **Wiesen-Netz:** Nahrungsbeziehungen einer vereinfachten Wiesengemeinschaft aufbauen.

Die Spiele sind kostenlos, vergeben keine Lernpunkte und funktionieren auch ohne gespeichertes Profil. Alle Aktionen sind per Tastatur möglich. Vorschule, Könner und Streber bieten unterschiedliche Aufgaben; beim Verlassen oder Stufenwechsel beginnt die lokale Spielrunde neu. Die Fragen speichern ihren Fortschritt dagegen dauerhaft in SQLite.

Das Paket ist ein begrenztes Lernangebot zu ausgewählten Kompetenzen, **keine vollständige Lehrplanabdeckung**, keine amtlich freigegebene Lernsoftware und kein Ersatz für Unterricht. Praktische Fertigkeiten werden über Mitmachaufgaben mit Selbstkontrolle geübt. Quellenzuordnung, fachliche Grenzen und Hinweise zu den Modellen: [Inhaltsmatrix Natur und Technik](docs/curriculum-nature-5.md).

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

Native Artefakte liegen unter `src-tauri/target/release/bundle/`. Die lokale macOS-App ist noch nicht signiert oder notarisiert. Mathematik Klasse 5 enthält ein offline gebündeltes Übungspaket für alle sieben Lernbereiche; Englisch enthält weiterhin Beispiele.

## Lokale Daten

Das Lernprofil (Spitzname und Jahrgangsstufe 5–13) wird in `lernwelt.sqlite3` im Tauri-Anwendungsdatenverzeichnis `de.lernwelt.desktop` gespeichert. Auf macOS ist dies `~/Library/Application Support/de.lernwelt.desktop/`, auf Windows unter `%APPDATA%\\de.lernwelt.desktop\\`. Die Browser-Vorschau zeigt einen Hinweis statt Speicherung zu simulieren.

Die Datenbank enthält außerdem eine Grundlage für fach- und kompetenzbezogenen Lernfortschritt. Mathematikaufgaben und Englischbeispiele sind an das Punktesystem angeschlossen. Eine fachübergreifende Stufenauswahl wird ebenfalls lokal gespeichert. Änderungen am Profil erhalten vorhandenen Fortschritt. Für eine manuelle Sicherung die App vollständig beenden und die Datenbankdatei kopieren; es gibt noch keinen integrierten Export und keine Synchronisierung.

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

Nach dem Speichern eines Lernprofils können die Aufgaben in Mathematik und Englisch beantwortet werden. Jede Aufgabe bringt bei der ersten korrekten Lösung **10 Punkte**. Falsche Antworten und Wiederholungen ziehen nichts ab; bereits gelöste Aufgaben geben keine weiteren Punkte. Bestehender Fortschritt aus älteren Versionen bleibt erhalten, erhält aber keine rückwirkenden Punkte.

Das Punktekonto zeigt verfügbares Guthaben und insgesamt verdiente Punkte. Die Abzeichen **Sternsammler** und **Lernfuchs** kosten jeweils **20 Punkte**, sind einmalig einlösbar und bleiben nach einem Neustart in der Sammlung. Die Stufen bringen gleich viele Punkte pro neuer Aufgabe. Weitere Belohnungen lassen sich ergänzen.

Antworten werden lokal im Rust-Backend geprüft. Gutschrift und Lernfortschritt werden gemeinsam gespeichert; Einlösen prüft das Guthaben und bucht atomar ab. Doppelte Requests erzeugen keine doppelten Buchungen. Das lokale System bietet keine manipulationssichere Währung und hat keinen Geldwert.

Die Aufgaben stehen getrennt von Antwortprüfung und Punktebuchung in `src-tauri/content/curriculum-v1.json`. Bestehende Aufgaben-IDs behalten ihre Bedeutung; alte Beispiel-Mathematikaufgaben bleiben für gespeicherte Buchungen und Wiederholungsrequests intern auflösbar.


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

**Vorschule** bietet einen leichten Einstieg, **Könner** reguläre Übungen und **Streber** anspruchsvollere Knobelaufgaben. Es sind spielerische Bezeichnungen, keine Altersstufen. Die Wahl bleibt über Fachwechsel, Profiländerung und Neustart erhalten; Standard ist Könner. Für Englisch gibt es zwei ausdrücklich als Beispiele gekennzeichnete Aufgaben pro Stufe (1. Fremdsprache), noch keinen vollständigen Englischlehrplan. Die angebotene Mathematik bleibt Klasse 5, auch wenn im Profil eine andere Klasse steht.

Jede Bildschirmaufgabe bietet einen Tipp und nach der Antwort einen erklärten Lösungsweg. Auswahlfragen, ganze Zahlen und exakte Dezimalzahlen werden im Backend bewertet. Komma oder Punkt gelten als Dezimaltrennzeichen, normale/geschützte Leerzeichen als Dreiergruppierung: `25 000` oder `25000`; `25.000` bedeutet 25. Einheiten stehen in der Frage und werden nicht mit eingegeben. Englischwörter werden ohne Beachtung der Großschreibung verglichen.

51 Mitmachaufgaben ergänzen Zeichnen, Messen, Schätzen und Begründen mit Selbstkontrollhinweisen. Sie gelten für alle Stufen, vergeben keine Punkte und werden nicht automatisch bewertet. Einheitentafeln für Geld, Länge, Masse und Fläche sowie die vollständige Quadratzahlreihe bis 400 ergänzen die Übungen. Das Paket enthält Lernangebote zu allen Kompetenzerwartungen, ist aber kein unbegrenzter Aufgabengenerator, keine vollständige Lernstandserhebung und kein Ersatz für Unterricht. Es gibt keine amtliche Freigabe. Weitere Hinweise und die Inhaltsmatrix stehen in [docs/curriculum-math-5.md](docs/curriculum-math-5.md).

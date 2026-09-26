# Review zu Issue #83: Gestufte Fachhilfen

## Umfang und Reviewart

- Issue: #83 · Branch: `codex/issue-83-gestufte-hilfen`.
- Umsetzung: 615 zusätzliche Tipps für alle sichtbaren Fachaufgaben sowie 111 konkrete Fehlerregeln für 108 Aufgaben. Begrenztes Inhaltsmodell, Zuordnung im Rust-Backend und freiwilliges Öffnen weiterer Hilfestufen in der Oberfläche.
- Unabhängiger Code- und Persistenzreview: Agent `/root`. Geprüft wurden Inhaltsvalidierung, normalisierte Fehlerzuordnung, begrenzte IPC-Projektion, Reset beim Aufgabenwechsel sowie Wiederholungsrequests, Punkte und Tests über neue Datenbankverbindungen. Keine offenen blockierenden Befunde.
- Unabhängiger vollständiger Inhaltsreview: Agent `/root/audio` las 108 Englischaufgaben, 108 Naturaufgaben und 133 Mathematikaufgaben der Stufe Vorschule (121 aus dem Grundpaket und zwölf Zahlenstrahlaufgaben). Agent `/root/missions` las alle 133 Könner- und alle 133 Streber-Mathematikaufgaben. Damit wurden alle 615 Aufgabensätze im Zusammenhang gelesen: Frage, bisheriger Tipp, neuer Zusatzhinweis, richtige Antwort, Lösungsweg, Fehlerregeln sowie gegebenenfalls Auswahloptionen und Zahlenstrahldaten. Beide Reviewer änderten keine Dateien und prüften sämtliche anschließend korrigierten Hinweise gezielt nach. Keine offenen Befunde.
- Die Implementierung wurde zusätzlich durch den umsetzenden Agenten `/root/learning_suggestions` selbst geprüft. Das ist keine weitere unabhängige Freigabe.

## Befunde und Korrekturen

1. Einige neue englische Hinweise enthielten bereits die vollständige Antwort: `hello.5`, `school.5`, `day.8`, `past.6`, `words.5`; außerdem wurden `home.8` und `words.4` beanstandet. Diese Hinweise verlangen nun einen eigenen Vergleich oder Übertragungsschritt. `hello.4` wurde vorsorglich ebenfalls umformuliert.
2. In `terms.brackets.streber` wurde der unerklärte Begriff „Nenner“ durch „Du teilst also durch 2 × 3“ ersetzt. `units.estimate.streber` fragt nun verständlich nach dem Laufen der Strecke in einer Sekunde.
3. Die Eigenkontrolle verbesserte zusätzlich `add.context.koenner` und `multiply.divisibility.streber`, damit das gesuchte Ergebnis nicht vorweggenommen wird. Alle zwölf geänderten IDs wurden unabhängig nachgeprüft und freigegeben.
4. Die erste technische Prüfung zeigte, dass historische Beispielaufgaben teilweise keinen Tipp besitzen. Die neue Validierung verlangt zusätzliche Hilfen deshalb nur für sichtbare Aufgaben und erhält historische Requests unverändert. Ein Clippy-Hinweis in einem neuen Test wurde korrigiert; der vollständige Rustlauf war danach grün.
5. Der bereits bestehende widersprüchliche Tipp zu `2²` wurde als separates Issue #87 erfasst und dort korrigiert. Diese Korrektur wird beim Abgleich mit `main` erhalten; sie ist kein Nebenfix dieses Issues.

6. Ein ergänzender vollständiger Kontextreview korrigierte weitere 31 neue Tipptexte:
   - Vorschule: Der Geodreieck-Tipp in `geometry.distance` nennt jetzt die lange Kante und die senkrechte Mittellinie. Bei `multiply.square-02` bis `square-20` sollen ausdrücklich die Punkte in den Reihen gezählt werden, nicht die Reihen selbst. `terms.explain-model` lässt das Kind den Term aus den wiederholten und einmaligen Kosten selbst bilden.
   - Könner: `geometry.circle-circle-cases` lässt gemeinsame Punkte markieren und zählen, ohne ihre Anzahl zu nennen.
   - Streber: `area.square-unit-reason` zählt ausdrücklich alle Hektarquadrate in den Reihen. `geometry.circle-line-cases` verrät die Anzahl der Schnittpunkte nicht. `terms.structure` lässt die angebotenen Terme anhand „Klammern zuerst, dann Punkt vor Strich“ prüfen. Die Zahlenstrahlaufgaben 2 und 8 lassen die Zielposition über die Schrittweite selbst bestimmen, ohne die exakte Anzahl anzuklickender Schritte vorzugeben.
   - Natur: `breathing.2`, `breathing.7`, `development.7` und `grassland.4` geben den gesuchten Gasnamen beziehungsweise die vollständige Aussage nicht mehr im zweiten Tipp vor. Die Hinweise erfordern einen Vergleich oder eine Zuordnung.
   - Alle 31 Korrekturen wurden unabhängig nachgeprüft. Der zusätzliche Vergleich gegen den vorherigen PR-Stand bestätigt, dass ausschließlich `furtherHints` geändert wurden. Bestehende Fragen, erste Tipps, Antworten, Lösungswege und Fehlerregeln bleiben unverändert.

## Datenhaltung und Bewertung

Ein struktureller Vergleich aller vier Inhaltspakete mit dem Ausgangsstand `fc8c77f` bestätigte unabhängig: Nach Entfernen der neuen Felder `furtherHints` und `commonMistakes` waren alle bisherigen Felder identisch. Aufgaben-IDs, Antworten und Punktebedeutung bleiben erhalten. Der Abgleich mit `main` bei `0e244d5` übernahm Updater, Offline-Audio und die 2²-Tippkorrektur. Der einzige Mergekonflikt betraf die am Dokumentende ergänzten Architekturabschnitte; beide Abschnitte wurden erhalten. Der strukturelle Vergleich aller vier Inhaltspakete wurde danach gegen dieses aktuelle `main` erfolgreich wiederholt. Anschließend wurde `main` bei `52fcd2f` mit den drei Lernmissionen integriert; auch dabei betraf der einzige Konflikt die Architektur-Anhänge. Fachhilfen-, Missions- und Updaterabschnitt wurden vollständig erhalten.

Die bestehenden Commands liefern zusätzliche typisierte Felder. Lösungsschlüssel und Fehlerantwortlisten bleiben im Backend. Richtig/falsch, Fortschrittsbuchung und Erstlösungspunkte ändern sich nicht. Tipps öffnen löst keinen Schreibbefehl aus. Keine neue Migration, Abhängigkeit, Netzwerkverbindung oder Capability.

## Prüfergebnisse

- `npm run check` vor dem main-Abgleich: erfolgreich; Formatierung, 172 Vitest-Tests, zwei Workflowtests, TypeScript und Vite-Produktionsbuild.
- `npm run check:rust` vor dem main-Abgleich: erfolgreich; Rustfmt, Clippy ohne Warnungen und 111 Rusttests; Main-/Doctests ohne Fehler.
- Die neuen Tests prüfen Hilfestufen, freiwilliges Nachladen im Dialog, Escape/Fokusrückgabe, Aufgaben-/Themen-/Stufen-/Fachwechsel, verborgenen Lösungsweg, Inhaltsgrenzen, alle Fehlerregeln, exakte Normalisierung und unveränderte Buchung bei Retries und neuer Datenbankverbindung.
- Separater nativer macOS-Debug-Appbuild erfolgreich: `npm run desktop:build -- --debug --bundles app --config /tmp/issue83-tauri.json`, mit eigenem Bezeichner `de.lernwelt.review83`. Die normale Nutzerdatenbank wurde nicht verwendet.
- Die anschließende native Bedienprüfung konnte nicht abgeschlossen werden: Der Aufruf zum Auswählen der separaten App im CUA-Werkzeug lieferte über rund 875 Sekunden keine Rückgabe und wurde abgebrochen. Deshalb wird kein nativer Bedien- oder Startnachweis behauptet. Die Dialogabläufe wurden durch die genannten Frontendtests geprüft.
- Nach dem ersten main-Abgleich bestanden zusätzlich 30 gezielte Lernpaneltests, die Typprüfung und die fünf neuen Rust-Hilfetests.
- Abschließende reine Tippkorrekturen: Prettier-Prüfung aller vier Inhaltspakete erfolgreich; `cargo test --manifest-path src-tauri/Cargo.toml --locked content::` mit allen 19 Inhaltstests erfolgreich. Es wurden keine künstlichen Tests für Textformulierungen ergänzt.
- `git diff --check`: erfolgreich.

## Grenzen und Abschluss

Alle 615 Aufgabensätze wurden unabhängig vollständig im Zusammenhang gelesen. Es gab keine Verständlichkeitsprüfung mit Kindern. Bestehende erste Tipps bleiben grundsätzlich erhalten und können bei einfachen Wissensfragen bereits deutlich sein. Die speziellen Fehlerhinweise erfassen nur ausdrücklich hinterlegte Antworten; sie sind keine Lernstandsdiagnose.

Die unabhängigen Reviews sind abgeschlossen. Der Merge bleibt bis zu grünen erforderlichen PR-Checks und der Koordination durch `/root` offen. Issue #83 ist erst nach dem Merge abgeschlossen.

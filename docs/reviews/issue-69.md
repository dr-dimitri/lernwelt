# Review zu Issue #69

## Umfang und Reviewart

Geführte Lernrunde „Ein Zaun für unseren Garten“: Startkarte, fünf Lernschritte, drei Stufen mit je drei Varianten, lokales Themenalbum und Wiederholungsplanung, Migration 013 und drei begrenzte Tauri-Commands. Grundlage sind die Akzeptanzkriterien von [Issue #69](https://github.com/dr-dimitri/lernwelt/issues/69).

Separater Agentenreview durch `/root/learning_content` des gesamten Diffs gegen `origin/main`, einschließlich neuer Dateien. Der Reviewer hat UI und Backend nicht implementiert und im Review keine Dateien verändert; er war zuvor am fachlichen Inhaltsentwurf beteiligt. Der Inhaltsreview ist daher keine vollständig unabhängige fachpädagogische Freigabe. Zusätzlich hat der implementierende Root-Agent Integration, Browserdarstellung und native Abläufe geprüft; diese Prüfungen sind kein unabhängiger Review.

Geprüft wurden Akzeptanzkriterien, Commands und Berechtigungen, SQL/Migration, Zustandsübergänge, Replays und veraltete Requests, Stufenwechsel, Hilfen, Zeitplanung, Punktehistorie, UI-Fehlerpfade und Fokus, Inhalte und Dokumentation.

## Befunde und Korrekturen

1. **Fokusverlust nach ausdrücklich angefordertem Neuladen:** Der fokussierte Recoveryknopf verschwand nach erfolgreichem Laden. Betroffen waren Startkarte und Lernrunde. Drei Regressionen wurden zunächst rot reproduziert. Ein einmaliger Reload-Fokuswunsch führt nun zur bestätigten Aufgabe, Rückmeldung oder Abschlussüberschrift beziehungsweise zum Start-/Fortsetzenknopf. Initiales Laden und Profilaktualisierung bleiben fokusneutral. Die Korrektur wurde im abschließenden Review gelesen und getestet.
2. **Rechteck-Hinweis präzisiert:** Statt der allgemeinen Behauptung über zwei lange und zwei kurze Seiten nennen die betreffenden Hinweise die gleich langen gegenüberliegenden Seiten des dargestellten Rechtecks.
3. **Rundentitel vereinheitlicht:** Dokumentation, Inhalte und Ladezustände verwenden denselben Titel.
4. **Zahleneingabe während der Umsetzung abgeglichen:** Aufgaben verwenden dieselbe exakte Zahlennormalisierung wie die bestehenden Fachübungen. Komma, Punkt und führende Nullen werden korrekt behandelt; Ausdrücke werden nicht ausgewertet. Die Oberfläche lässt ungültige Eingaben vor der Übertragung korrigieren.

Nach den Korrekturen bestehen keine offenen blockierenden Befunde.

## Prüfergebnisse

Vom Reviewer selbst ausgeführt:

- `cargo test --manifest-path src-tauri/Cargo.toml --locked mission::tests`: **15 Tests bestanden**.
- `npx vitest run src/components/MissionPanel.test.tsx src/components/MissionCard.test.tsx src/App.test.tsx`: **31 Tests bestanden**.
- `git diff --check origin/main`: bestanden.
- Alle 27 bewerteten Aufgaben, Tipps, Lösungen, Beispiele und Mitmachhinweise gelesen; 18 numerische Antworten selbst nachgerechnet. Alle neun Begründungsfragen besitzen genau eine richtige Option. Bewertete Streberdiagramme verraten die gesuchte Länge nicht.

Vom Root-Agenten ausgeführt:

- Finales `npm run check:all`: **113 Frontendtests, 2 Workflowtests, 78 Rusttests bestanden**; Prettier, TypeScript, Vite-Build, rustfmt und Clippy mit `-D warnings` grün.
- `git diff --check`: bestanden.
- Finales `npm run desktop:build -- --bundles app`: nativer macOS-Release-Build erfolgreich.
- Chromium und WebKit mit echten Inhaltstexten und einem gemockten Desktop-Adapter: Start, vollständige fünf Schritte in allen drei Stufen, Hilfe und Wiederaufnahme, Begründungsauswahl, Selbstkontrolle, Feedback-/Abschlussfokus. Keine Laufzeitfehler oder horizontalen Überläufe bei 1100 × 750, 420 × 600 und vergrößerter Grundschrift; Screenshots visuell geprüft. Dieser Test ersetzt keine Persistenzprüfung.
- Native macOS-App mit isolierter Kennung `de.lernwelt.review69`: Testprofil angelegt, Runde gestartet, erste Antwort gespeichert, App beendet/neu gestartet, bestätigte Rückmeldung und zwei Punkte wiedergefunden; Beispiel, eigene Antwort `28,0`, Begründungsauswahl, freiwilliges Überspringen und Abschluss erfolgreich. Wiederholungstermin wurde angezeigt. Wechsel auf Streber, verdeckte gesuchte Länge, gespeicherter Tipp, richtige Antwort und drei Punkte geprüft; das Album behauptet bei Hilfegebrauch keine selbstständige Lösung. Produktive Lerndaten wurden nicht verwendet.

Die native Ablaufprüfung erfolgte vor der letzten, ausschließlich den Recoveryfokus betreffenden Korrektur. Diese Korrektur wurde durch Regressionstests und erneuten separaten Review geprüft; der finale native Build enthält sie. Ein erster nativer Zwischenbuild enthielt noch die vorläufige Ziffernvalidierung; nach Aktualisierung wurde `28,0` nativ erfolgreich geprüft.

## Datenhaltung und Grenzen

Schema 13 ergänzt Tabellen transaktional; bestehende Daten und Buchungen bleiben erhalten. SQL ist parametrisiert. Antwort, Hilfe, Fortschritt, Punkte und Requestbeleg werden atomar geschrieben. Tests prüfen Wiederöffnen, Rollback, zwei Verbindungen, Retries, veraltete Schritte, Stufenwechsel und verzögerte Wiederholungen. Historische Daten erhalten keine erfundenen Angaben zu Hilfen oder Beherrschung.

Ein Thema mit drei Varianten je Stufe; kein vollständiger adaptiver Lehrgang. Der Wiederholungsplan richtet sich nach dem Abrufschritt und der lokalen Gerätezeit. Das Album beschreibt beobachtete Ereignisse, keine vollständige Beherrschung. Keine Studie zur Verständlichkeit oder Wirksamkeit mit Kindern und keine Hemisphären-/Lerntypenversprechen.

Der Reviewer hat keinen eigenen nativen Start bestätigt. Sein zusätzlicher Browser-Recoveryversuch erreichte den simulierten Fehlerzustand nicht und wird nicht als bestandene Prüfung gewertet. Windows wurde lokal nicht ausgeführt; dafür ist die PR-CI maßgeblich. Die bestehenden Dokumentationsfehler sind separat als [Issue #70](https://github.com/dr-dimitri/lernwelt/issues/70) erfasst.

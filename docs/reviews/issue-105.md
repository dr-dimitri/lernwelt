# Abschlussreview und Releasevorbereitung zu Issue #105

## Reviewart und Umfang

Separater Selbstreview durch Codex nach Abschluss der Umsetzung; keine unabhängige Freigabe. Gesamtdiff seit `v0.2.2` sowie der Release-Diff gegen aktuelles `main` geprüft. Themenauswahl (#100), Übungspakete (#101) und Fokusfix (#103) wurden zusätzlich jeweils separat reviewt. Alle drei Issues sind vor dem Release nach `main` gemergt.

## Ergebnis des Gesamtchecks

- 17 Lernbereiche und 87 gezielt auswählbare Unterthemen für Klasse 5: 40 Mathematik, 35 Englisch und zwölf Natur und Technik. Katalogzuordnung, Fach, Jahrgang, Quellenstand und Fremdsprachenfolge stimmen mit der aktuellen Inhaltsmatrix überein.
- 3.675 Fachaufgaben, mindestens zwölf je Stufe und Unterthema; kurze Runden mit höchstens sechs Aufgaben, ungelöste Aufgaben zuerst, klare Rundenenden und frei wählbare Stufen. Die Ruhe der Übersicht wurde bei 360 und 1.100 Pixeln geprüft.
- Die 615 ursprünglichen Aufgaben sowie Vokabel-/Audiobank bleiben unverändert. Neue Aufgaben haben eigene IDs. Rusttests prüfen alle neuen Metadaten, Beispielantworten und historische Bedeutung; SQLite-Tests prüfen erneutes Öffnen, alte/neue Punkte, falsche Antworten, Rollback und Retries. Kein Schemawechsel.
- Wortschatzlinks öffnen geprüfte Decks. Hörübungen verwenden bekannte lokale Audios, starten auf Klick und stoppen bei Wechsel. Keine neue Cloud-, KI-, Mikrofon- oder Remote-Schriftabhängigkeit.
- Native macOS-Prüfung mit eigener Review-App bestätigte den realen IPC-Katalog, Testprofil, neue richtige Antwort mit zwei Punkten und lokale Satzwiedergabe. Windows wird durch die CI gebaut/geprüft; keine manuelle Windows-Installerprüfung behauptet.
- Fokuskorrektur separat gemergt. Neue Aufgabenanweisungen und Lernziele sind kurz und konkret. Keine offenen blockierenden Befunde aus dem Gesamtcheck.

## Release-Diff

Nur die sechs Versionswerte (npm-Paket, beide npm-Lockwerte, Cargo-Paket/-Lock, Tauri) werden auf 0.3.0 gesetzt. Releasehinweise nennen Verhalten, tatsächlichen Umfang, Erhalt der Lerndaten und Prüflimits. Keine Abhängigkeits-, Signierschlüssel-, Berechtigungs- oder Updater-Endpunktänderung. Private Schlüssel bleiben ausschließlich in GitHub-Secrets.

`v0.3.0` wird erst auf dem nach grünen Checks gemergten `main`-Commit angelegt. Die vorhandene Pipeline verlangt einen Commit aus `main`, prüft Versionen und die vollständige Testsuite, baut drei Plattformpakete und veröffentlicht erst nach vollständiger Asset-/Manifestprüfung. Ein fehlgeschlagener Build wird nicht als veröffentlichter Release ausgegeben.

## Prüfungen

- Release-Diff gegen `main` vollständig geprüft; nur die synchronisierten Versionen, Releasehinweise und dieser Reviewnachweis. `git diff --check` erfolgreich.
- `GITHUB_REF_NAME=v0.3.0 node scripts/check-release-version.mjs` erfolgreich: alle sechs Versionswerte, Releasehinweise und vorhandener öffentlicher Updater-Schlüssel geprüft.
- Formatierung, 211 Frontendtests, 8 Skripttests, TypeScript und Produktionsbuild erfolgreich. 122 Rusttests erfolgreich; Rust-Formatierung, Clippy und Dokumentationstest im abschließenden seriellen `npm run check:rust` vollständig erfolgreich.
- Der erste Gesamtaufruf lief versehentlich parallel zum nativen Build und scheiterte nach allen erfolgreichen Unit-Tests im Rust-Dokumentationstest mit `E0463`. Nach Ende des nativen Builds wurde der gesamte betroffene Rust-Prüflauf seriell erfolgreich wiederholt. Die CI verwendet ebenfalls die serielle Reihenfolge.
- `npm run desktop:build -- --debug --no-bundle` mit unveränderter Produktionskonfiguration und Version 0.3.0 erfolgreich.
- Finale Inhalts-CI vor dem Merge erfolgreich auf Frontend, macOS und Windows: [Quality-Lauf 37030764400](https://github.com/dr-dimitri/lernwelt/actions/runs/37030764400). Die Release-CI prüft den Versions-PR zusätzlich vor dem Tag.
- Suchfunktion mit tatsächlichem finalem Katalog geprüft: „mother“ und „Mutter“ finden beide „Meine bunte Familie“. Reproduzierbare Bank/Katalog und alle ursprünglichen Lösungsschlüssel wurden im Inhaltsreview geprüft.
- Drei Release-Assemblytests prüfen vollständige Plattformliste, Signaturen und Kollisionsfreiheit der Mac-Pakete; erfolgreich.

## Grenzen

Selbstreview statt unabhängiger Freigabe. Endliche Aufgabenfamilien mit gemeinsamen Grundlagen über Stufen hinweg; keine Behauptung vollständiger Lehrplanbeherrschung. Keine Prüfung mit Kindern, kein unabhängiges pädagogisches Gutachten und keine vollständige Barrierefreiheitszertifizierung. Aussprache und freies Schreiben werden nicht automatisch bewertet. Bestehende Vite-Bundlewarnung über 500 kB bleibt bestehen. Updater-Signaturen ersetzen keine Apple-Notarisierung oder Windows-Herausgebersignatur; diese sind weiterhin nicht eingerichtet.

Nach dem Release werden der tatsächlich veröffentlichte Status, alle drei Installer und das vollständige Update-Manifest direkt in GitHub überprüft. Der Nutzerauftrag ist erst mit veröffentlichtem Release abgeschlossen.

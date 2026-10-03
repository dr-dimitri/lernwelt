# Review zu Issue #128: Release 0.6.1

## Umfang und Reviewart

Separater **Selbstreview** durch den umsetzenden Codex-Hauptagenten am 03.10.2026 nach der Release-Vorbereitung. Dies ist keine unabhängige Freigabe. Geprüft wurden der vollständige Diff gegen `origin/main`, neue Release-Hinweise, die Akzeptanzkriterien von Issue #128 und der dokumentierte Release-Ablauf. Die enthaltene Zufallsübung ist bereits unabhängig in [Issue #126](issue-126.md) geprüft und über PR #127 gemergt.

## Befunde und Ergebnis

Keine offenen Befunde. Alle sechs Versionswerte in fünf Dateien sind konsistent auf 0.6.1 gesetzt: npm-Paket, npm-Lockwurzel, npm-Lockpaket, Cargo-Paket, Cargo-Lockpaket und Tauri-Konfiguration. Abhängigkeiten und deren Versionen bleiben unverändert. README und `docs/releases/0.6.1.md` beschreiben genau die neue Zufallsübung, ihre M-Konvention, Punkte und drei Installationspakete. Die Paketnamen stimmen mit `scripts/release-assets.mjs` überein. Hinweise auf Updater-Signaturen und Grenzen der Betriebssystemsignierung sind erhalten.

App-Kennung, Datenbank, Migrationen, Befehle, Berechtigungen, Updater-Endpunkt und öffentlicher Prüfschlüssel sind unverändert. Der gewünschte Funktionscommit `035ae3856208b80846831ade99087ae5678a7de2` ist Vorgänger des Release-Branches. Alte Releases und Tags werden nicht überschrieben. Es wurden keine Geheimnisse, Nutzerdaten oder Build-Ausgaben geändert oder aufgenommen.

## Prüfungen

- `GITHUB_REF_NAME=v0.6.1 node scripts/check-release-version.mjs`: erfolgreich; alle Versionsfelder, passender Tagname, Release-Hinweise und bestehender öffentlicher Updater-Schlüssel geprüft.
- `npm run check:all`: erfolgreich; Formatierung, 328 Frontendtests in 39 Dateien, 8 Skripttests, TypeScript, Produktionsbuild, Rustfmt, Clippy ohne Warnungen und 157 Rusttests. Nur die bekannte allgemeine Bundlegrößenwarnung bleibt bestehen.
- `git diff --check`: erfolgreich.
- `git merge-base --is-ancestor 035ae3856208b80846831ade99087ae5678a7de2 HEAD`: erfolgreich; der angeforderte Funktionscommit ist enthalten.
- Selbstreview über Gesamtdiff und neue Hinweise: ausschließlich Versionsmetadaten und Dokumentation, keine Änderung an Fachlogik, Antwortprüfung, UI-Verhalten oder Persistenz.

## Veröffentlichung und Grenzen

Nach grüner PR-CI und Merge wird `v0.6.1` auf dem geprüften `main`-Commit erstellt. Der bestehende Release-Workflow prüft Versionen und Tests erneut, baut macOS Apple Silicon, macOS Intel und Windows x64, signiert die Updater-Pakete über bestehende GitHub-Secrets und veröffentlicht erst bei vollständigen erfolgreichen Builds alle Pakete mit `latest.json`. Anschließend werden Release-Zustand, Tag-/Commitzuordnung, Assetliste und Manifest geprüft. Ein erfolgreicher Merge allein wird nicht als erfolgreich veröffentlichtes Release ausgegeben.

Die neue installierte Version wurde im Rahmen dieses Metadatenreviews nicht manuell gestartet; native Plattformbuilds gehören zur PR-/Release-CI, die Bedienprüfung der enthaltenen Funktion steht im unabhängigen Funktionsreview. Apple-Notarisierung und Windows-Herausgebersignatur sind weiterhin nicht eingerichtet. Keine neue Installation oder Änderung vorhandener persönlicher Lernprofile ist Teil dieses Release-Auftrags.

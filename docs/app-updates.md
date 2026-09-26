# App-Updates und Releases

**App aktualisieren** oben im Fenster zeigt die installierte Version und sucht nach neuen Versionen. Standardmäßig prüft Lernwelt einmal beim Start. Die Einstellung lässt sich abschalten und wird in der lokalen Webview gespeichert. Eine manuelle Prüfung bleibt möglich. Ist diese Einstellung nicht lesbar, erfolgt keine automatische Prüfung.

Eine verfügbare Version erscheint am Knopf. Herunterladen und Installieren beginnen erst mit **Update herunterladen und installieren**. Vorher die aktuelle Aufgabe beenden; unter Windows schließt der Installer die App und startet sie anschließend wieder. Auf macOS erscheint nach erfolgreicher Installation **Jetzt neu starten**. Während der Installation bleibt das Updatefenster modal. Fehler erlauben erneutes Versuchen und werden nicht als erfolgreiche Installation ausgegeben. Bei einem fehlgeschlagenen Neustart kann die App von Hand beendet und geöffnet werden.

## Offline und Daten

Die Versionsprüfung nutzt ausschließlich den festen HTTPS-Endpunkt `https://github.com/dr-dimitri/lernwelt/releases/latest/download/latest.json`. GitHub erhält die technisch erforderliche Verbindungsinformation (unter anderem IP-Adresse), keine Lernprofile oder Antworten. Ohne Netz bleibt das Lernen verfügbar. Die Update-Prüfung läuft höchstens 15 Sekunden, ein Download höchstens drei Minuten; danach ist ein erneuter Versuch möglich. SQLite und lokale Lernstände werden nicht exportiert oder ersetzt.

Die offiziellen Tauri-Plugins prüfen vor der Installation die kryptografische Signatur des Updatepakets gegen den mitgelieferten öffentlichen Schlüssel. Eine ungültige Signatur bricht die Installation ab. Im Frontend gibt es keine freie Datei-, Shell- oder HTTP-Schnittstelle; die Capability erlaubt nur Version, Updateprüfung, Installation, Freigabe nativer Ressourcen und Neustart.

## Release erstellen

1. Änderungen mit eigenem Issue, Review und grünen Checks nach `main` mergen.
2. Alle Versionsfelder in `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` und `src-tauri/tauri.conf.json` gemeinsam aktualisieren. Versionshinweise als `docs/releases/<Version>.md` pflegen und ebenfalls über einen Issue-PR mergen.
3. Den passenden Tag `v<Version>` auf dem geprüften `main`-Commit pushen.
4. Der Release-Workflow prüft Versionen, Tests und Builds. Er erzeugt macOS-Pakete für Apple Silicon und Intel sowie einen Windows-x64-Installer. Der private Updater-Schlüssel und sein Passwort kommen ausschließlich aus den GitHub-Secrets `TAURI_SIGNING_PRIVATE_KEY` und `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
5. Erst nach allen erfolgreichen Builds werden Pakete, Signaturen und ein gemeinsames `latest.json` veröffentlicht. Das Manifest enthält genau die drei unterstützten Plattformen. Fehler lassen einen gegebenenfalls angelegten Release als Entwurf stehen. Ein veröffentlichter Release wird bei Wiederholung nicht überschrieben.

`scripts/release-assets.mjs` verhindert unvollständige Plattformlisten, fehlende Signaturen und Namenskollisionen der macOS-Pakete. Die tatsächliche kryptografische Prüfung erfolgt im Tauri-Updater. Version und Metadaten werden vor dem Release durch `scripts/check-release-version.mjs` geprüft.

Der private Schlüssel muss dauerhaft außerhalb von Git sicher aufbewahrt werden. Ein neuer Schlüssel kann vorhandene Installationen nicht ohne Übergangsrelease aktualisieren. Schlüssel/Passwort gehören weder in Logs noch in Artefakte. Der öffentliche Schlüssel in der App ist kein Geheimnis.

## Grenzen

Die vorhandene Version 0.1.0 enthält noch keinen Updater. Der erste Wechsel auf eine Version mit Updater erfolgt über den heruntergeladenen Installer. Danach können weitere veröffentlichte Versionen direkt in der App installiert werden.

Updater-Signaturen sind unabhängig von Apples Developer-ID/Notarisierung und Windows-Code-Signing. Für diese Betriebssystemsignaturen sind keine Zertifikate eingerichtet. Die ersten Installer können daher Betriebssystemhinweise auslösen. Die Release-Pipeline enthält keine Linux-Pakete; andere Plattformen werden nicht als unterstützt ausgegeben.

Grundlagen: [Tauri Updater](https://v2.tauri.app/plugin/updater/), [Tauri Process](https://v2.tauri.app/plugin/process/) und [GitHub-Pipeline](https://v2.tauri.app/distribute/pipelines/github/).

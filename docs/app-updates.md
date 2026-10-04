# App-Updates und Releases

**App aktualisieren** oben im Fenster zeigt die installierte Version und sucht nach neuen Versionen. Standardmäßig prüft Lernwelt einmal beim Start. Die Einstellung lässt sich abschalten und wird in der lokalen Webview gespeichert. Eine manuelle Prüfung bleibt möglich. Ist diese Einstellung nicht lesbar, erfolgt keine automatische Prüfung.

Eine verfügbare Version erscheint am Knopf. Herunterladen und Installieren beginnen erst mit **Update herunterladen und installieren**. Vorher die aktuelle Aufgabe beenden; unter Windows schließt der Installer die App und startet sie anschließend wieder. Auf macOS erscheint nach erfolgreicher Installation **Jetzt neu starten**. Während der Installation bleibt das Updatefenster modal. Fehler erlauben erneutes Versuchen und werden nicht als erfolgreiche Installation ausgegeben. Bei einem fehlgeschlagenen Neustart kann die App von Hand beendet und geöffnet werden.

## Offline und Daten

Die Versionsprüfung nutzt ausschließlich den festen HTTPS-Endpunkt `https://github.com/dr-dimitri/lernwelt/releases/latest/download/latest.json`. GitHub erhält die technisch erforderliche Verbindungsinformation (unter anderem IP-Adresse), keine Lernprofile oder Antworten. Ohne Netz bleibt das Lernen verfügbar. Die Update-Prüfung läuft höchstens 15 Sekunden, ein Download höchstens drei Minuten; danach ist ein erneuter Versuch möglich. SQLite und lokale Lernstände werden nicht exportiert oder ersetzt.

Die offiziellen Tauri-Plugins prüfen vor der Installation die kryptografische Signatur des Updatepakets gegen den mitgelieferten öffentlichen Schlüssel. Eine ungültige Signatur bricht die Installation ab. Im Frontend gibt es keine freie Datei-, Shell- oder HTTP-Schnittstelle; die Capability erlaubt nur Version, Updateprüfung, Installation, Freigabe nativer Ressourcen und Neustart.

## Release erstellen

1. Jeder Issue-PR erhöht die Version gegenüber aktuellem `main`, auch bei Dokumentations- oder CI-Änderungen. Alle Versionsfelder in `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` und `src-tauri/tauri.conf.json` gemeinsam aktualisieren; `docs/releases/<Version>.md` ergänzen. Die PR-CI lehnt unveränderte, niedrigere oder widersprüchliche Versionen ab.
2. Änderungen mit eigenem Issue, dokumentiertem Review und grünen Checks nach `main` mergen. Der main-Prüflauf wird für jeden Merge separat erhalten; ein späterer Merge bricht ihn nicht ab.
3. Nach erfolgreichen Frontend- und Desktop-Prüfungen ruft `ci.yml` den wiederverwendbaren `release.yml` direkt auf. Dieser erzeugt `v<Version>` am exakt geprüften Merge-Commit und baut macOS Apple Silicon, macOS Intel sowie Windows x64. Ein manuell gesetzter passender Tag bleibt als Wiederholungsweg möglich, ist aber nicht nötig. Vom CI-Token erstellte Tags lösen keinen zweiten Tag-Push-Workflow aus.
4. Private Updater-Schlüssel und Passwort kommen ausschließlich aus den bestehenden GitHub-Secrets. Der wiederverwendbare Release erhält nur diese zwei benannten Secrets und nur für main ausreichende Schreibrechte. PRs veröffentlichen nichts. Bereits veröffentlichte Versionen bleiben bei Wiederholung unverändert; ein Tag an einem anderen Commit bricht den Lauf ab.
5. Erst nach allen drei erfolgreichen Builds werden Pakete, Signaturen und das gemeinsame `latest.json` veröffentlicht. Die Veröffentlichung läuft in einer Warteschlange (`queue: max`, bis zu 100 wartende Veröffentlichungen laut GitHub); ein älterer später fertiger Release setzt `latest` nicht zurück. Fehlgeschlagene Builds veröffentlichen nichts; Fehler beim Upload erhalten den Release als Entwurf.
6. Das LLM prüft den tatsächlichen Release-Abschluss, aktualisiert lokales `main` und löscht erledigte lokale Issue-Branches nach Abgleich mit dem gemergten PR-Head. GitHub entfernt gemergte PR-Branches über `delete_branch_on_merge`; offene oder weiterentwickelte Branches und Worktree-Dateien werden erhalten.

Grundlagen des Ablaufs: [wiederverwendbare GitHub-Workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows), [Ereignisse mit GITHUB_TOKEN](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow), [Warteschlangen und Parallelität](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency) und [automatische Branch-Löschung](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches).

`scripts/release-assets.mjs` verhindert unvollständige Plattformlisten, fehlende Signaturen und Namenskollisionen der macOS-Pakete. Die tatsächliche kryptografische Prüfung erfolgt im Tauri-Updater. Version und Metadaten werden vor dem Release durch `scripts/check-release-version.mjs` geprüft.

Der private Schlüssel muss dauerhaft außerhalb von Git sicher aufbewahrt werden. Ein neuer Schlüssel kann vorhandene Installationen nicht ohne Übergangsrelease aktualisieren. Schlüssel/Passwort gehören weder in Logs noch in Artefakte. Der öffentliche Schlüssel in der App ist kein Geheimnis.

## Grenzen

Die vorhandene Version 0.1.0 enthält noch keinen Updater. Der erste Wechsel auf eine Version mit Updater erfolgt über den heruntergeladenen Installer. Danach können weitere veröffentlichte Versionen direkt in der App installiert werden.

Updater-Signaturen sind unabhängig von Apples Developer-ID/Notarisierung und Windows-Code-Signing. Für diese Betriebssystemsignaturen sind keine Zertifikate eingerichtet. Die ersten Installer können daher Betriebssystemhinweise auslösen. Die Release-Pipeline enthält keine Linux-Pakete; andere Plattformen werden nicht als unterstützt ausgegeben.

Grundlagen: [Tauri Updater](https://v2.tauri.app/plugin/updater/), [Tauri Process](https://v2.tauri.app/plugin/process/) und [GitHub-Pipeline](https://v2.tauri.app/distribute/pipelines/github/).

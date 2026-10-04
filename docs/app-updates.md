# App-Updates und Releases

**App aktualisieren** oben im Fenster zeigt die installierte Version und sucht nach neuen Versionen. Standardmäßig prüft Lernwelt einmal beim Start. Die Einstellung lässt sich abschalten und wird in der lokalen Webview gespeichert. Eine manuelle Prüfung bleibt möglich. Ist diese Einstellung nicht lesbar, erfolgt keine automatische Prüfung.

Standardmäßig sucht Lernwelt ausschließlich nach stabilen GitHub-Releases. **Vorabversionen (Pre-Releases) anbieten** schaltet die auf GitHub als `prerelease: true` gekennzeichneten Veröffentlichungen hinzu. Die Auswahl ist standardmäßig aus, wird unabhängig von der Startprüfung lokal gespeichert und gilt auch für manuelle Prüfungen. Ein Wechsel prüft sofort erneut und verwirft das bisherige Angebot. Während Prüfung, Installation und bis zum Neustart nach einer Installation bleibt dieser Schalter gesperrt. Bei unlesbaren Einstellungen wird nicht automatisch geprüft; eine manuelle Prüfung beginnt sicher mit stabilen Releases.

Bei aktivierter Option berücksichtigt die App veröffentlichte stabile und Vorab-Releases mit hochgeladenem `latest.json`. Sie wählt die höchste neuere semantische Version, unabhängig von Veröffentlichungsdatum und Listenreihenfolge. Entwürfe, Tags ohne Release, fehlende/leere Manifeste sowie gleiche oder ältere Versionen werden nicht angeboten. Die Kennzeichnung **Vorabversion** folgt dem GitHub-Flag, auch wenn eine Versionsnummer keinen `beta`-Zusatz hat. Eine spätere stabile Version wird ebenfalls angeboten, sobald sie höher als die installierte Vorabversion ist. Ausschalten der Option führt nicht zu einem Downgrade.

Eine verfügbare Version erscheint am Knopf. Herunterladen und Installieren beginnen erst mit **Update herunterladen und installieren**. Vorher die aktuelle Aufgabe beenden; unter Windows schließt der Installer die App und startet sie anschließend wieder. Auf macOS erscheint nach erfolgreicher Installation **Jetzt neu starten**. Während der Installation bleibt das Updatefenster modal. Fehler erlauben erneutes Versuchen und werden nicht als erfolgreiche Installation ausgegeben. Bei einem fehlgeschlagenen Neustart kann die App von Hand beendet und geöffnet werden.

## Offline und Daten

Für stabile Updates nutzt die Prüfung den festen HTTPS-Endpunkt `https://github.com/dr-dimitri/lernwelt/releases/latest/download/latest.json`. Nur bei aktivierten Vorabversionen liest Rust zusätzlich `https://api.github.com/repos/dr-dimitri/lernwelt/releases` (ohne Zugangsschlüssel), gefolgt vom `latest.json` des ausgewählten Releases. Die Listenprüfung liest bis zu zehn Seiten mit je 100 Einträgen; alle Anfragen und das Manifest teilen sich ein Zeitbudget von 15 Sekunden. Ein überschrittenes Limit, API-Fehler, widersprüchliche Versionen oder ein fehlendes Plattformpaket ergeben einen Fehler statt einer falschen Erfolgsanzeige. GitHub erhält die technisch erforderliche Verbindungsinformation (unter anderem IP-Adresse), keine Lernprofile oder Antworten. Ohne Netz bleibt das Lernen verfügbar. Die Update-Prüfung läuft höchstens 15 Sekunden, ein Download höchstens drei Minuten; danach ist ein erneuter Versuch möglich. SQLite und lokale Lernstände werden nicht exportiert oder ersetzt.

Die offiziellen Tauri-Plugins prüfen vor der Installation die kryptografische Signatur des Updatepakets gegen den mitgelieferten öffentlichen Schlüssel. Eine ungültige Signatur bricht die Installation ab. Im Frontend gibt es keine freie Datei-, Shell- oder HTTP-Schnittstelle; die Capability erlaubt nur Version, den eigenen Command `check_app_update` mit einem booleschen Kanalschalter, signierte Installation, Freigabe nativer Ressourcen und Neustart. Rust begrenzt alle Quellen auf dieses Repository und prüft die Übereinstimmung von GitHub-Tag, Manifest-Version und Paketadresse. Native Update-Ressourcen bleiben im offiziellen Tauri-Plugin.

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

## GitHub-Vorabversionen bereitstellen

Für einen ausdrücklich gewünschten Test vor dem Merge unterstützt `release.yml` einen eigenen Vorabpfad: Alle fünf Quelldateien enthalten weiter die nächste stabile Version (z. B. `0.6.9`), damit die PR-Versionsprüfung unverändert gilt. Ein Tag `v0.6.9-rc.1` am geprüften Commit eines bereits gepushten `codex/issue-<Nummer>-<Kurzname>`-Branches startet die drei signierten Builds. Der Tag muss exakt zur stabilen Quellversion passen; die positive `rc`-Nummer kann für weitere Tests erhöht werden. Ein stabiler Tag verlangt weiterhin einen Commit auf `main`.

Nur für diesen Build setzt eine zusätzliche Tauri-Konfiguration die App- und Installerversion auf `0.6.9-rc.1`. Die Quelldateien und `main` werden dadurch nicht geändert. Pakete, Signaturen und `latest.json` tragen dieselbe Vorabversion; die Hinweise stammen aus `docs/releases/0.6.9.md`. Erst nach allen drei Builds und dem vollständigen Upload wird der Release mit `prerelease: true` veröffentlicht. `make_latest: false` erhält den stabilen Release und dessen Update-Endpunkt. Wiederholungen überschreiben keine veröffentlichte Version. Ein späterer Merge erzeugt weiterhin automatisch den stabilen Release `v0.6.9`.

Ein alleiniger Quellcode-Tag oder eine Vorabmarkierung ohne signierte Updater-Pakete und vollständiges `latest.json` kann keine installierbare Version bereitstellen. In der App muss **Vorabversionen (Pre-Releases) anbieten** aktiviert sein, um diesen Testrelease angeboten zu bekommen.

Grundlage des Versionsoverrides: [Tauri-Build-Konfiguration per `--config`](https://v2.tauri.app/reference/cli/) und [Tauri-Appversion](https://v2.tauri.app/reference/config/).

Grundlage der Vorabauswahl: [GitHub Releases API](https://docs.github.com/en/rest/releases/releases#list-releases) und [Tauri-Updater-Konfiguration](https://v2.tauri.app/plugin/updater/).

## Grenzen

Die vorhandene Version 0.1.0 enthält noch keinen Updater. Der erste Wechsel auf eine Version mit Updater erfolgt über den heruntergeladenen Installer. Danach können weitere veröffentlichte Versionen direkt in der App installiert werden.

Updater-Signaturen sind unabhängig von Apples Developer-ID/Notarisierung und Windows-Code-Signing. Für diese Betriebssystemsignaturen sind keine Zertifikate eingerichtet. Die ersten Installer können daher Betriebssystemhinweise auslösen. Die Release-Pipeline enthält keine Linux-Pakete; andere Plattformen werden nicht als unterstützt ausgegeben.

Grundlagen: [Tauri Updater](https://v2.tauri.app/plugin/updater/), [Tauri Process](https://v2.tauri.app/plugin/process/) und [GitHub-Pipeline](https://v2.tauri.app/distribute/pipelines/github/).

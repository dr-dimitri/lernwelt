# Review zu Issue #132: Releases und Branchbereinigung

## Umfang und Reviewart

Separater **Selbstreview** durch den implementierenden Codex-Agenten am 04.10.2026 über den vollständigen Diff gegen `main`/`origin/main` (`57c52df0c16dec244f0207f92eefac7e1e717b0f`). Dies ist keine unabhängige Freigabe. Grundlage: [Issue #132](https://github.com/dr-dimitri/lernwelt/issues/132), AGENTS.md, Projektskills und aktuelle GitHub-Primärdokumentation.

Geprüft: verbindliche Release-/Branchregeln, beide Workflows, Release- und Versionsskripte mit Fehlerpfaden, Tests, alle fünf Versionsdateien, Releasehinweise und ausgeführte Branchbereinigung. App-Version 0.6.2 enthält zusätzlich den bereits gemergten Pluto-Umfang. Keine neue Abhängigkeit, IPC-, Lerninhalts- oder Datenbankänderung.

## Befunde und Korrekturen

- Jeder erfolgreiche main-Prüflauf ruft das Release direkt über `workflow_call` auf. Das neue Release-JOB benötigt sowohl Frontend als auch beide Desktop-Checks. Bei PRs ist es ausgeschaltet. Tag-Push bleibt als Wiederholungsweg erhalten; CI-Tags mit GITHUB_TOKEN starten laut GitHub keinen zweiten Push-Workflow.
- Die PR-Prüfung liest die tatsächliche Basisversion per validierter Commit-ID und lehnt gleiche, niedrigere oder widersprüchliche Versionen sowie fehlende Releasehinweise ab. Im Review wurde vollständige Checkout-Historie im Frontend-Job ergänzt, damit die Basis auch im CI-Checkout lesbar ist.
- Main-Läufe verwenden getrennte Gruppen je Commit und werden nicht gegenseitig abgebrochen. Der Release bindet Tag und Artefakte an den exakten geprüften Commit. Vorhandene Tags an anderen Commits brechen ab; veröffentlichte Versionen werden bei Wiederholung nicht überschrieben.
- Veröffentlichung erfolgt erst nach drei vollständigen Builds und neun validierten Dateien. Der Upload bleibt bis zur Vollständigkeitsprüfung ein Entwurf. Fehlende, leere oder fehlgeschlagene Uploads setzen den Entwurf nicht auf veröffentlicht. Wiederholung eines Entwurfs ist möglich.
- Veröffentlichung ist über `release-publish` mit `queue: max` serialisiert. Versionsvergleich erfolgt innerhalb dieser Warteschlange; ein später fertiggestellter älterer Release setzt `latest` nicht zurück. GitHub begrenzt die Warteschlange auf 100 wartende Jobs; dies ist dokumentiert.
- Schreibrechte sind auf den main-Release-Aufruf und dessen Tag-/Publish-Jobs begrenzt. Nur die beiden vorhandenen Signatur-Secrets werden namentlich weitergegeben. Secrets wurden ausschließlich anhand der Namen geprüft; Werte nicht ausgelesen. API-Token erscheinen weder in URLs noch Dateien/Logs.
- Version 0.6.2 stimmt in npm-Paket, beiden Root-Einträgen der npm-Lockdatei, Cargo-Paket und Cargo-Lock sowie Tauri-Konfiguration überein. Andere Abhängigkeitsversionen bleiben unverändert.
- GitHub `delete_branch_on_merge` wurde aktiviert und erneut per API bestätigt. 38 bestehende Remote- und 38 lokale Branches wurden erst nach Übereinstimmung mit dem unveränderten Head eines tatsächlich gemergten PRs entfernt. Vier belegte Worktrees wurden am selben Commit auf detached HEAD gesetzt; ihr Arbeitsbaumstatus blieb identisch. Dateien und Worktrees wurden nicht gelöscht. Vor diesem Issue-PR blieben remote nur `main`, lokal `main` und der aktive Issue-Branch erhalten.

## Tatsächlich ausgeführte Prüfungen

- `npm run check:all`: erfolgreich, 331 Frontendtests in 39 Dateien, zunächst 23 Skripttests, TypeScript/Vite-Build, rustfmt/Clippy und 157 Rusttests.
- Nach den zusätzlichen PR-Basis-Integrationstests: Formatprüfung und vollständiger Frontend-/Skripttestlauf erneut erfolgreich, 331 Frontendtests und **25 Skripttests**. Produktionscode seit dem vollständigen Prüflauf unverändert.
- Direkte Versionsprüfung gegen den echten main-Basiscommit sowie mit `RELEASE_TAG=v0.6.2`: erfolgreich. Integrationstests erzeugen ein echtes temporäres Git-Repository und prüfen höhere, gleiche und niedrigere Versionen sowie Windows-Zeilenenden.
- Release-Tests: zulässige Quellen, exakter Commit/Tag, annotierte Tags, andere Commit-Zuordnung, Fehler beim GitHub-Lesen, Entwurfswiederholung, unveränderte veröffentlichte Releases, fehlende/falsche/leer hochgeladene Dateien, Uploadfehler und monotone `latest`-Auswahl.
- Offizielles actionlint 1.7.12 aus `rhysd/actionlint`, Download anhand offizieller SHA-256-Prüfsumme verifiziert. Dieser Stand kennt das aktuell in GitHub dokumentierte `queue: max` noch nicht und meldet ausschließlich diese beiden Felder. Mit gezieltem Ignorieren genau dieses unbekannten Syntaxfelds sind beide Workflows ohne weitere Befunde geprüft. Die tatsächliche GitHub-Validierung und Ausführung müssen diese lokale Werkzeuggrenze ergänzen; im Repository wurde keine Prüfung oder Schutzregel abgeschaltet.
- `git diff --check`: erfolgreich. Branchbereinigung per GitHub-API, lokalem Branch-/Worktree-Inventar und `git fetch --prune` verifiziert. Signatur-Secret-Namen vorhanden.

## Grenzen und Abschluss

Selbstreview abgeschlossen, keine offenen lokalen Befunde. Plattform-PR-CI, main-CI und der erstmalige automatische Release werden nach PR/Merge geprüft; derzeit noch ausstehend und nicht als ausgeführt behauptet. Ein Release benötigt funktionierende vorhandene Signatur-Secrets sowie erfolgreiche GitHub-Runner. Keine neue Apple-Notarisierung oder Windows-Herausgebersignatur. Lernstände und Kern-Offlinebetrieb bleiben unverändert.

Das Issue ist erst vollständig erledigt, wenn der Merge, ein tatsächlich veröffentlichter Release 0.6.2 mit allen Plattformen und die Bereinigung des eigenen Issue-Branches nachgewiesen sind. Diese Ergebnisse bleiben im PR-/Actions-/Release-Verlauf nachvollziehbar.

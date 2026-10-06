# Review zu Issue #167

## Reviewart und geprüfter Stand

**Unabhängiger Review durch Agent `/root/english`**, der die Zellkern-Expedition nicht implementiert hat. Vollständiger Implementierungsdiff `006ace7` (main beim Umsetzungsstart, Version 0.6.16) → `d9f323e`, GitHub-Issue #167, AGENTS.md, beide Projektskills und README geprüft. Nach dem ersten Review wurde der Generatorbefund im separaten Commit `d9f323e` korrigiert und unabhängig nachgeprüft.

Keine offenen blockierenden Befunde am geprüften Implementierungsstand. Die Freigabe umfasst diesen Stand; das Rebase auf das inzwischen weiterentwickelte main, die Versionsanpassung und der native Integrations-Smoke sind noch separat zu prüfen. Dieser Nachweis behauptet weder Merge noch Release oder Abschluss des Issues.

## Umfang und Inhaltsreview

- Alle 45 ursprünglichen Zellfragen behalten dieselben IDs, Fragen, Antworten, Stufen und Kompetenzen. Beide ursprünglichen Inhaltsdateien wurden gegen den Ausgangsstand verglichen und stimmen mit den dokumentierten SHA-256-Werten überein. Die 36 Focus-Fragen und neun Originalfragen bleiben über kurze Runden und Stationsfilter erreichbar; beide Aktivitäten werden aus dem ursprünglichen Thema geladen.
- Alle 18 neuen Fragen einschließlich erster/weiterer Tipps und Lösungswege einzeln gelesen: sechs je Stufe, klare Bildstruktur-, Funktions-/Zuordnungs- und Modell-/Beobachtungsentscheidungen. Kein vorausgesetztes Wissen über DNA-Struktur, Proteinbiosynthese oder Zellzyklus. Die Kernhülle wird von der Zellmembran unterschieden; seitliche Kernlage, typische Zelltypen und begrenzte Mikroskopauflösung sind korrekt erklärt.
- Drei eigene sichtbare SVG-Modelle geprüft: Tierzelle, grüne Pflanzenzelle mit großer Vakuole und seitlichem Kern, Zellkerndetail mit klar als Modellzeichen bezeichneten Informationslinien. Keine ständig sichtbaren X-Chromosomen, erfundene biologische Maße oder Behauptung, jede Zelle habe einen Kern. Die Anleitungsbibliothek wird als Vergleich erklärt; der Zellkern denkt nicht und Zellbestandteile arbeiten zusammen.
- Die echte 640 × 480-Wangenaufnahme visuell geprüft: der markierte dunkle ovale Bereich liegt auf dem erkennbaren Kern. Dateihash stimmt. Urheber, Methylenblau-Färbung, Originaldatei und **CC BY-SA 4.0** wurden am 06.10.2026 unabhängig auf der [konkreten Commons-Dateiseite](https://commons.wikimedia.org/wiki/File:Nucleus_in_human_cheek_cells.jpg) bestätigt. Lokale Credits und Quellenansicht nennen Urheber/Lizenz, unveränderte Originaldatei und gesonderte Markierung; deren Weitergabe unter derselben Lizenz ist angegeben. Kein belegter Maßstab vorhanden, deshalb keine erfundenen Größen. Fachlicher Rahmen mit [LehrplanPLUS NT5](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/nt_gym), [NHGRI: Nucleus](https://www.genome.gov/genetics-glossary/Nucleus) und [MedlinePlus: Zelle](https://medlineplus.gov/genetics/understanding/basics/cell/) abgeglichen.
- Prüfende Bilder und zugängliche Namen beschreiben A neutral und geben den gesuchten Teil nicht vorab an. Bildfehler behalten Frage/Antwortweg und bieten eine beschriftete Ersatzgrafik plus Textbeobachtung. Entdecken funktioniert ohne Profil und bei IPC-Ausfall. Quellen und der begrenzte Umfang sind erreichbar; keine Erprobung mit Kindern oder amtliche Freigabe behauptet.

## Datenhaltung, Fehler und Bedienung

Bestehende `get_learning_state`-/`submit_answer`-Pfade bleiben die einzige Bewertung und Punktehaltung. Neue Antworten verwenden dasselbe Journal und denselben Kompetenzfortschritt; Erstpunkte gelten nach Aufgabenstufe, alte gelöste IDs sind weiterhin gelöst. Keine neue Migration oder parallele Speicherung im Browser.

Der neue `get_learning_explanation`-Command validiert begrenzte bekannte nicht-historische IDs, liefert nur die angefragte Erklärung und hat keinen Datenbankzugriff. Handler, Build-Manifest, Capability und typisierter Client sind konsistent. Aufdecken sperrt die aktuelle Präsentation für Antwortprüfung und erzeugt keine Belege/Punkte. Unbekannte, historische, überlange und mit Steuerzeichen versehene IDs werden abgewiesen.

UI-Zustände und Tests für richtige/falsche Antworten, Tipps, erneuten Versuch, identische Request-ID nach Speicherfehler, laufende Navigation-Sperre, Profil-/Stufen-/Ladefehler, alte Erstlösungen und Rundenabschluss geprüft. Guthaben/gelöst werden erst nach Bestätigung übernommen; Eingaben bleiben bei Fehler erhalten. Rust prüft abweichende Replays, transaktionalen Fehler und Wiederöffnung mit persistenter Stufe/Erfolgen. Dialoge bieten Escape und Rückfokus; Zellteile haben Tastatur- und beschriftete Knopfbedienung.

## Befund und Korrektur

**P2 – Inhaltsgenerator konnte den neuen Katalog nicht neu aufbauen.** Der ursprüngliche Stand `881df94` ergänzte Nucleus-IDs im Katalog, lud ihr Paket in `scripts/build-topic-practice.py` aber nicht. Reproduktion auf einer isolierten Kopie von `src-tauri/content` mit `python3 scripts/build-topic-practice.py`: `KeyError: by.nature.5.nucleus.vorschule.01.v1` bei der ID-Auflösung. Zudem dürfen ergänzende Zellkernfragen den Erhalt der bisherigen 36 Focus-Fragen nicht ersetzen.

Korrektur durch den umsetzenden Agenten in `d9f323e`: Nucleus-Paket geladen; Nucleus-IDs zählen nicht beim Abbruch für die bisherige Focus-Bank. Zwei Verhaltensregressionen führen den echten Generator auf einer temporären Inhaltskopie aus und prüfen die unveränderten 45 Originalfragen/36 Focus-Fragen sowie die neuen IDs. Der zweite Fall erhöht das Zusatzpaket auf zwölf neue Fragen pro Stufe. Beide Tests wurden unabhängig ausgeführt und bestanden. Kein produktiver Inhalts- oder Nutzerbestand wird durch diese Prüfungen beschrieben.

## Tatsächlich ausgeführte Prüfungen

Unabhängig durch den Reviewer:

- `node_modules/.bin/vitest run src/components/CellWorld.test.tsx src/domain/cells.test.ts src/lib/desktop.test.ts`: **36 Tests grün**. Zusätzlich bestand der vollständige Frontendlauf mit **431 Tests**.
- `cargo test --manifest-path src-tauri/Cargo.toml cell -- --nocapture`: **drei Rusttests grün**, einschließlich aller 18 neuen Antworten/Erstpunkte, Original-Erstlösung, Replays, neue Verbindung, gespeicherte Stufe, read-only Aufdecken, ungültige IDs und Speicherfehler mit identischem Retry.
- `node --test scripts/build-topic-practice.test.mjs` nach Generatorfix: **zwei Tests grün**.
- `git diff --check 006ace7..d9f323e`: grün. Original-Inhalts- und Foto-SHA-256 unabhängig nachgerechnet und mit Dokumentation verglichen.
- `/private/tmp/lernwelt-layout-167.mjs` eigenständig erneut ausgeführt: **419 Zustände bei 2400 × 1300**, maximale Dokumentbreite/-höhe **2400/1300**, alle gemessenen Dialoge ohne eigenen Overflow. Enthalten sind alle 63 Fragen mit Tipps, richtigen/falschen Antworten und Aufdecken, alle Rundenenden, Entdeckungs-/Detail-/Bild-/Aktivitätsansichten sowie gezielte Lade-, Speicher-, Bildfehler-, Retry- und Profilzustände. Tastaturauswahl, Escape und Fokus-Rückkehr werden im echten App-DOM geprüft. Repräsentative Screenshots von Gesamtzelle, Modell/Fotvergleich und Streber-Aufgabe visuell angesehen.
- Kleines Fenster **900 × 700**: Dokumentbreite 900, Höhe 1871 Pixel. **150 % Schrift**: Breite 2400, Höhe 1687 Pixel. Lesbarer vertikaler Scroll-Fallback ohne horizontalen Überlauf. Ergebnisse liegen in `/private/tmp/cell-layout-results.json` und `/private/tmp/cell-layout-summary.json`, Screenshots in `/private/tmp/cell-*.png`.

Zusätzlich vom umsetzenden Agenten dokumentiert und dessen Nachweise geprüft: `npm run check:all` mit 431 Frontend-, 128 Skript- und 177 Rusttests, Formatierung, TypeScript/Vite, Rustfmt und Clippy grün. Nach Generatorfix `npm run check` mit nun 130 Skripttests erneut grün. Nativer Debug-App-Build mit temporärem `createUpdaterArtifacts:false` erfolgreich; ohne privaten Updater-Schlüssel ist das lokale Bundle kein signiertes Release.

## Grenzen und verbleibende Integration

Der Browserharness nutzt eine isolierte Test-IPC-Brücke gegen das echte `src/main.tsx`-/App-DOM und lokale Inhalte; er ersetzt weder die separat geprüfte Rust-Persistenz noch einen nativen Start-Smoke. Der Reviewer hat keine Windows-GUI, praktische Mikroskoparbeit oder Erprobung mit Kindern ausgeführt.

Root koordiniert nach Issue #166 das Rebase auf aktuelles main, die additive Inhaltszählung und gemeinsame Command-Integration (Erdkern und Zellkern verwenden denselben Lesebefehl), Version/Releasehinweise, vollständige Abschlusschecks und nativen Smoke am Integrationsstand. Nach relevanten Änderungen diesen Review aktualisieren. PR, grüner CI-Abschluss, Merge, tatsächlich veröffentlichtes Release beider Plattformen und Branchbereinigung bleiben nach Projektworkflow erforderlich.

## Integrationsnachweis auf main 0.6.17

Agent `/root/integrate_cells` hat den Reviewdraft in einem separaten Commit erhalten und den Zellkern-Branch auf `d05a449807dc2c3ca4bdc067ad0c1a3eaa419073` (main, Version 0.6.17) rebasiert. Dies ist ein Integrations-/Selbstprüfnachweis, keine zusätzliche unabhängige Freigabe.

Erdkern- und Zellkern-Navigation, Katalogeinträge und Testmodule sind additiv vereinigt. Die typisierte Aufgabenprojektion, Erdschichten-/Reihenfolgevalidierung sowie Handler, Build-Manifest, Capability und Desktop-Client bleiben gegenüber diesem main unverändert. Zellkern nutzt denselben bereits vorhandenen Lesebefehl `get_learning_explanation`, einschließlich der strengeren ID-Validierung auf ASCII-Buchstaben, Ziffern, Punkt und Bindestrich. Keine neue Migration. Der Help-Inhaltstest zählt nun beide Erweiterungen mit insgesamt 3.735 sichtbaren Aufgaben.

Der Inhaltsgenerator lädt beide dedizierten Pakete. Seine zwei echten Neuaufbau-Regressionen bewahren alle 45 ursprünglichen Zellaufgaben und 18 neuen Zellkern-IDs; die erste prüft zusätzlich die unveränderte Erdkern-Datei und deren bestehende Katalogzuordnung. Die ursprünglichen Paketdateien und die `.focus.`-Bank sind im Integrationsdiff unverändert.

Am 06.10.2026 in diesem integrierten Arbeitsbaum ausgeführt: `npm run check` vollständig grün (47 Dateien / 446 Frontendtests, 130 Skripttests, Formatierung, TypeScript und Vite-Build); `npm run check:rust` vollständig grün (fmt, Clippy mit `-D warnings`, 186 Rusttests). Vorab wurden 78 betroffene Frontendtests und die drei Zell-Rusttests gezielt ausgeführt, ebenfalls grün. Logs: `/private/tmp/lernwelt-167-integration-check.log`, `/private/tmp/lernwelt-167-integration-rust.log`. Die native App wurde bei der Integration nicht gestartet; ihr Schema-18-Stand darf die inzwischen auf Schema 19 migrierte Nutzerdatei nicht öffnen.

Zu diesem Zwischenstand standen das nachfolgende Rebase auf Issue #166/main 0.6.18, die Versionsanpassung auf 0.6.19 und der unabhängige Review-/Abschlussnachweis noch aus.

## Zweite Integration auf main 0.6.18

Agent `/root/integrate_cells` hat den gesamten Zellkern-Branch einschließlich des vorhandenen unabhängigen Reviewdrafts auf `8c46b062eb1fb6e965669418ece06c6ced9696f9` (main nach Issue #166, Version 0.6.18) rebasiert. Auch dieser Abschnitt dokumentiert Integration und Selbstprüfung; die unabhängige Freigabe des Integrationsdeltas folgt gesondert.

Additive Konfliktauflösung: Die vollständigen English-Club-, Erdkern- und Zellkern-Dokumentationsabschnitte sowie alle drei Hauptansichten/Katalogzuordnungen bleiben erhalten. Der Help-Test zählt jetzt 3.771 sichtbare Aufgaben (3.753 auf diesem main plus 18 Zellkernfragen); die aktuelle Katalogmatrix nennt ebenfalls 3.771 insgesamt, 558 Naturfragen und 21 Zellfragen je Stufe. Der Desktop-Brückentest für den Salatmodus und der Zellkern-Aufdecktest bestehen nebeneinander. Die Erdkern-/Club-Pakete, sämtliche Originalpakete und die historische `.focus.`-Bank sind im Diff gegen dieses main unverändert. Question-Projektion, gemeinsamer `get_learning_explanation`-Command/Handler/Registrierung/Client und Schema-19-Vokabelpfad samt Migration 019 bleiben ebenfalls unverändert.

Der Generator lädt Erdkern, English Club und Zellkern. Ergänzende `.club.`- und `.nucleus.`-Fragen zählen beide nicht als Ersatz für die historische Focus-Bank. Die zwei Regressionen führen den echten Neuaufbau auf isolierten Inhaltskopien aus und prüfen nun den vollständigen unveränderten Focus-Bestand, alle 45 ursprünglichen Zellfragen, 18 neue Zellkernfragen, unveränderte Club-/Erdkerndateien und deren Zuordnung. Mit zwölf ergänzenden Club- und Zellkernfragen je Stufe bleibt die Focus-Bank vollständig erhalten; auch die hinzugefügten Club-IDs bleiben genau einem Ziel zugeordnet.

Am 06.10.2026 ausgeführt und grün: `npm run typecheck`; gezielter Vitestlauf über App, LearningPanel, StudyBrowser, EarthWorld, CellWorld, EnglishClub, VocabularyPanel, Cell-Domain und Desktop-Brücke mit **138 Tests in neun Dateien**; beide Generator-Neuaufbautests; `npm run format:check`; Cargo fmt; Clippy für alle Targets mit `-D warnings`; vollständiger `cargo test --manifest-path src-tauri/Cargo.toml --locked` mit **194 Rusttests**, einschließlich Migration 019, Wiederöffnung, Vokabel-Salat und Zell-/Erdkern-Persistenzfälle. Rustlog: `/private/tmp/lernwelt-167-integration-018-rust.log`. Keine native App gestartet, keine Versionsanpassung oder externe Veröffentlichung vorgenommen.

Root führt die Versionsanpassung auf 0.6.19, vollständige finale Prüfungen, nativen Smoke, PR/CI/Merge/Release und Branchbereinigung aus. Der unabhängige Reviewer prüft dieses Integrationsdelta und aktualisiert anschließend seinen Nachweis.

## Unabhängige Nachprüfung des finalen Integrationsdeltas

Agent `/root/english` hat am 06.10.2026 den vollständigen Diff `8c46b062eb1fb6e965669418ece06c6ced9696f9` → `c971804606a384b5f419978d5d8d950ff2f7e98c`, die Änderungen der beiden Rebases mit `git range-diff` und anschließend den von Root vorbereiteten Versionsdelta auf 0.6.19 unabhängig geprüft. Der Reviewer hat keine Implementierungsdateien geändert. **Keine offenen blockierenden Befunde im Code-/Inhalts-/Versionsdelta.** Der ursprüngliche unabhängige Inhalts-, Bildrechte-, UI- und Persistenzreview bleibt Bestandteil dieses Nachweises.

Die Zusammenführung ist additiv: Alle Erdkern-, Club- und Zellkernansichten/-tests/-Katalogeinträge sind vorhanden. Die Erdkern-/Clubpakete, ursprünglichen Naturfragen und komplette historische Focus-Bank sind gegenüber main bytegleich; der Schema-19-Vokabelpfad einschließlich Migration 019 ist unverändert. `get_learning_explanation` existiert genau einmal und übernimmt unverändert die strengere ASCII-ID-Validierung des aktuellen main. Handler, Build-Manifest, Capability, Desktop-Client und normale antwortfreie Aufgabenprojektion sind unverändert; Zellkern ergänzt nur seine eigenen Prüfungen und Daten.

Die gesamte sichtbare Inhaltsbank wurde unabhängig nachgerechnet: **3.771 eindeutige Aufgaben und genau eine Katalogzuordnung je ID**, davon 1.767 Mathematik, 1.404 Englisch, 558 Natur und Technik, 42 Geographie; 89 Einheiten in 18 Lernbereichen. Je Stufe bleiben 21 Zellfragen erreichbar. Die Dokumentationsmatrix und der Rust-Helpcount stimmen damit überein. Der Generator lädt alle dedizierten Pakete; beide Ausnahmen `.club.` und `.nucleus.` verhindern den Ersatz bestehender Focus-Aufgaben. Die erweiterten Tests prüfen zusätzlich bytegleiche Club-/Erdkerndateien, unveränderte Zuordnungen und die gesamte alte Focus-Bank auch bei gleichzeitig verdoppelten Club-/Nucleus-Ergänzungen.

Unabhängig erneut ausgeführt:

- `node --test scripts/build-topic-practice.test.mjs`: **zwei kombinierte Generatorregressionen grün**.
- Gezielter Vitestlauf über CellWorld, Cell-Domain und Desktop-Brücke: **38 Tests grün**, einschließlich beider Brückentestfälle für Salat und read-only Aufdecken.
- `cargo test --manifest-path src-tauri/Cargo.toml cell`: **drei Tests grün**; `cargo test --manifest-path src-tauri/Cargo.toml every_visible`: **zwei Tests grün** für alle Hilfen und eindeutige Katalogzuordnung.
- `/private/tmp/lernwelt-layout-167.mjs` am integrierten App-/CSS-Stand erneut: **419 Zustände**, Dokument maximal **2400 × 1300**, alle gemessenen Dialoge ohne eigenen Overflow. Kleine Ansicht und 150-%-Schrift behalten unverändert den lesbaren vertikalen Fallback (900/1871 bzw. 2400/1687 Pixel).
- Versionsdelta vollständig gelesen: In allen fünf Versionsdateien sind ausschließlich die App-Versionen von 0.6.18 auf **0.6.19** geändert, ohne Abhängigkeitsänderung; alle sechs Versionsprojektionen stimmen überein. Releasehinweise beschreiben den tatsächlichen Umfang. `RELEASE_BASE_SHA=8c46b062eb1fb6e965669418ece06c6ced9696f9 node scripts/check-release-version.mjs`: **Exit 0**. `git diff --check`: grün.

Roots vollständiges Abschlusslog `/private/tmp/lernwelt-167-check-final.log` wurde zusätzlich gelesen: Formatierung, **476 Frontendtests**, **130 Skripttests**, TypeScript/Vite, Rustfmt, Clippy und **194 Rusttests** sind darin erfolgreich dokumentiert. Diese Ausführung wird Root zugerechnet, nicht als weiterer eigener Volltest des Reviewers ausgegeben.

Die **native Start-/Bedienprüfung am finalen 0.6.19-Stand steht weiterhin aus**, weil der Mac gesperrt ist. Der Browserharness ist kein Ersatz dafür. Der Code-/Integrationsreview ist ohne offene Befunde; eine vollständige Mergefreigabe nach Projektworkflow setzt weiterhin den tatsächlichen nativen Nachweis und grüne erforderliche CI-Checks voraus. PR soll bis zur Nachprüfung Draft bleiben. Veröffentlichung beider Plattformen und Branchbereinigung folgen nach nachgewiesenem Merge; kein Releaseerfolg wird hier behauptet.

## Abschlussbuild durch den koordinierenden Agenten

Am finalen Versionsstand **0.6.19** bestand `npm run check:all` vollständig: 49 Frontenddateien mit 476 Tests, 130 Skript-/macOS-Pakettests, TypeScript/Vite, Cargo fmt, Clippy mit `-D warnings` und 194 Rusttests. Log: `/private/tmp/lernwelt-167-check-final.log`. Der anschließende native Build `npm run desktop:build -- --debug --bundles app --config '{"bundle":{"createUpdaterArtifacts":false}}'` endete ebenfalls mit Exit 0; das lokal gebündelte Bild und die ad-hoc signierte App liegen unter `src-tauri/target/debug/bundle/macos/Lernwelt.app`. Log: `/private/tmp/lernwelt-167-native-final.log`. Private Updater-Schlüssel werden lokal nicht benötigt; dies ist kein veröffentlichtes Release.

Computer Use meldet den gesperrten Mac. Root hat den Nutzer um manuelles Entsperren gebeten und keinen nativen Start-/Bedienerfolg behauptet. Die vorbereitete App und der Draft-PR sind konkret prüfbar; vor vollständiger Mergefreigabe bleibt der native Smoke erforderlich.

## Nachgeholter nativer Bediennachweis

Am 06.10.2026 war der Mac wieder entsperrt. Root startete die gebaute **0.6.19-App** aus `/private/tmp/lernwelt-issue-167/src-tauri/target/debug/bundle/macos/Lernwelt.app` über Computer Use. Die echte Tauri-Ansicht (`tauri://localhost`) lud das vorhandene lokale Profil mit unveränderter Stufe **Streber** und dessen Lernstand über Rust/SQLite. Keine Test-IPC-Brücke.

Tatsächlich bedient und beobachtet: Natur und Technik → Expedition Zellkern; Tier-/Pflanzenwechsel, Vakuolenauswahl, Zellkern-Detail, Erbinformationskarte, Forscherblick mit lokalem Originalfoto und zuschaltbarer Markierung, Großansicht mit sichtbarem Schließen-Fokus und Escape-Rückkehr zu **Bild vergrößern**. Die Zellrätselrunde lud **21 erreichbare Streberfragen**, eine kurze Sechserrunde und neutrale Grafik-/Antwortansichten. Ein Tippdialog wurde visuell geprüft und mit Escape geschlossen; der Fokus kehrte zum Tippbutton zurück. Der echte `get_learning_explanation`-Befehl lieferte die Erklärung auf **Lösung aufdecken · 0 Punkte**; anschließend waren Antwortwahl und Prüfung gesperrt, **Weiter** blieb erreichbar. Auch die nächste Originalfrage ließ sich schreibfrei aufdecken.

Es wurden keine Antworten eingereicht, kein Profil oder Schwierigkeitsgrad geändert und keine Lernpunkte erzeugt. Die physisch kleinere macOS-Ansicht nutzt den dokumentierten Scroll-Fallback; die feste 2400-×-1300-Prüfung bleibt der getrennt nachgewiesene Browser-DOM-Lauf mit 419 Zuständen. Die vorangehende Sperre ist damit behoben; Code und gebaute App sind gegenüber dem bereits unabhängig geprüften Stand unverändert. Die erforderlichen CI-Checks von PR #170 waren vor diesem reinen Nachweisupdate erfolgreich. Der aktualisierte PR muss den neuen Commit erneut prüfen; Merge und tatsächliche Veröffentlichung sind weiterhin getrennt nachzuweisen.

## Unabhängige Abschlussfreigabe nach nativem Nachweis

Agent `/root/review_final` hat am 06.10.2026 den vollständigen Nachweisdelta `2daa07d` → `854f557`, den bestehenden unabhängigen Implementierungs-/Integrationsreview und die Versionsprüfung separat gelesen. Der Delta betrifft ausschließlich `docs/cell-expedition.md` und dieses Reviewdokument; Produktcode, Lerninhalte, Tests, Datenhaltung und die gebaute App bleiben gegenüber dem bereits unabhängig freigegebenen 0.6.19-Stand unverändert. `RELEASE_BASE_SHA=8c46b062eb1fb6e965669418ece06c6ced9696f9 node scripts/check-release-version.mjs` und `git diff --check` wurden durch diesen Reviewer erneut ausgeführt und bestanden.

Der native Start-/Bediennachweis im vorstehenden Abschnitt ist ausdrücklich eine Prüfung durch **Root**, keine eigene Computer-Use-Prüfung dieses Reviewers. Er deckt den zuvor offenen nativen Nachweis mit echter Tauri-/Rust-/SQLite-Brücke, den relevanten Bild-/Detail-/Tipp-/Fokuswegen und schreibfreiem Aufdecken ab. Die kleinere physische Ansicht wird korrekt vom separat geprüften Standardfenster unterschieden. Keine Antworten, Nutzerdatenänderungen oder Punktebuchungen werden behauptet.

**Unabhängiger Abschlussreview: keine offenen blockierenden Befunde; Mergefreigabe für den geprüften Produktstand und den dokumentierten nativen Nachweis.** Die vorherigen Aussagen zur noch ausstehenden nativen Prüfung beschreiben frühere Zwischenstände und sind durch den nachgeholten Nachweis aufgehoben. Der aktualisierte PR-Head benötigt weiterhin grüne erforderliche CI-Checks. Diese Freigabe ersetzt weder CI-Abschluss, Merge, tatsächliche Veröffentlichung beider Plattformen noch Branchbereinigung; diese Schritte bleiben durch Root nachzuweisen.

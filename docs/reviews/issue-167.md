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

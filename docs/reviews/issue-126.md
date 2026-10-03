# Review zu Issue #126: Römische Zufallszahlen 1–9999

## Umfang und Reviewart

Separater unabhängiger Agentenreview durch Codex-Agent `roman_review` am 03.10.2026 nach der Umsetzung. Der Reviewer hat weder Produktionscode noch Tests dieses Issues geschrieben. Geprüft wurden der gesamte finale Diff einschließlich neuer Dateien gegen `origin/main`, Issue #126 mit Akzeptanzkriterien, AGENTS.md und beide Projektskills: Fachlogik, UI, typisierte Desktop-Grenze, Rust-Command und Berechtigung, IDs, Antwortprüfung, Datenhaltung, Tests und Dokumentation. Der Hauptagent führte zusätzlich die vollständigen Projektprüfungen und eine native macOS-Bedienprüfung aus.

## Befunde und Korrekturen

Der Review fand bei der neuen Implementierung eine Lücke während des Speicherns eines Stufenwechsels: Die globale Busy-Sperre wurde zunächst nicht an die Zufallsübung weitergegeben. Die alte Frage konnte dadurch gleichzeitig beantwortet werden. Die Eltern-Sperre gilt jetzt auch für Eingabe, Richtung und neue Zahl. Ein zusätzlicher Submitguard prüft die aktuelle Fragenstufe. Der Generation-Guard verwirft Rückmeldungen und Fehler bereits gestarteter alter Antworten, falls die Stufe inzwischen direkt geändert wurde. Beide Fälle sind mit verzögerten Antworten regressionsgetestet und wurden unabhängig nachgeprüft.

Der finale Review ist freigegeben. Es gibt keine offenen blockierenden oder sonstigen konkret behebbaren Befunde. Ein Defekt im bestehenden Produktstand wurde nicht gefunden; die Korrekturen vervollständigen die neue Implementierung.

## Akzeptanz und Datenhaltung

- „Zufallsübung 1–9999“ ergänzt ausschließlich das Unterthema „Römische Zahlen“; die kurze Lernrunde und ihre offenen Eingaben bleiben erhalten.
- Beide Richtungen verlangen eine freie Eingabe und prüfen erst nach Enter oder „Antwort prüfen“. Rust wählt einschließlich der Grenzen 1 und 9999; der Wert der vorherigen Aufgabe wird auch beim Richtungs-/Stufenwechsel ausgeschlossen.
- Die Darstellung nutzt IV, IX, XL, XC, CD und CM. Die Erweiterung 4000–9999 mit weiteren M ist direkt sichtbar und in der Hilfe erklärt. Kleinschreibung ist erlaubt; andere Schreibweisen wie IIII oder IL sind falsch. Hinweise, freiwillige Lösung nach Fehlern und ermutigende Rückmeldung sind erreichbar.
- Stabile, kanonisch validierte IDs verbinden Zahl, Richtung, Stufe und Version. Alias-IDs werden abgewiesen. Erstpunkte 1/2/3, Kompetenzfortschritt und Antwortbeleg verwenden dieselbe Immediate-Transaktion und dieselben Journale wie feste Aufgaben. Wiederholungen und Retries buchen keine zusätzlichen Punkte; widersprüchliche Request-Replays scheitern.
- Die Fetch-Projektion enthält Metadaten, Frage und Tipps ohne gesonderten Lösungsschlüssel. Laden ohne Profil schreibt nichts; Antworten benötigen ein gespeichertes Profil. Keine Migration, neue Abhängigkeit, externe Laufzeitressource oder Änderung bestehender Aufgaben/Antworten/Buchungen.
- Lade- und Speicherfehler sind sichtbar. Ein identischer Retry behält seine Request-ID. Neue Aufgaben und Dialogrückwege führen den Fokus zur Übung; Eingaben sind beschriftet, Buttons nativ und mit Tastatur erreichbar.

## Prüfungen

- `npm run check:all`: erfolgreich, 327 Frontendtests in 39 Dateien, 8 Skripttests, TypeScript, Produktionsbuild, Formatierung, Rustfmt, Clippy ohne Warnungen und alle 157 Rust-Tests. Die bereits bekannte allgemeine Bundlegrößenwarnung bleibt bestehen.
- Nach Ergänzung des zwölften neuen UI-Tests und der abschließenden gemeinsamen Anzeigebedingung: 51 relevante Tests in fünf Dateien (`RomanPractice`, `LearningPanel.roman`, `LearningPanel.study`, bisheriges `LearningPanel`, `desktop`) sowie Typecheck, Formatprüfung und `git diff --check` erneut erfolgreich.
- 9 neue Rusttests: unabhängiges Lesen aller 9999 Darstellungen, beide Richtungen und drei Stufen, eindeutige IDs, Subtraktionsgrenzen, 3999/4000/9999, ungültige Antworten/IDs, gespeicherte Stufe, vorheriger Wert, Antwortprojektion, 1/2/3 Punkte, Replaykonflikte, Wiederöffnung mit historischen Buchungen, fehlendes Profil und vollständiger Rollback bei erzwungenen Buchungs-/Journalfehlern.
- 12 neue UI-Tests: direkte Eingabe und Enter, Richtungswechsel, lange 9999-Antwort, weitere Zahl, Tipps und Lösung, Walletanzeige, Fehlerretry, fehlendes Profil, alte Lernrunde, Themenrückweg, Stufenwechsel, laufende globale Speicherung und verspätete alte Antwort.
- Eigene unabhängige Reviewer-Prüfungen: alle 9 Roman-Rusttests, 45 relevante UI-/Schnittstellentests in vier Dateien und `git diff --check` erfolgreich.
- Nativer macOS-Debugbuild erfolgreich. Die isolierte Prüf-App verwendet eine ausschließlich temporär konfigurierte eigene Kennung; vorhandene persönliche Lerndaten wurden nicht verändert. Für diese unsignierte lokale Prüf-App sind Updaterpakete deaktiviert; ein erster Bundlerlauf verlangte erwartungsgemäß einen Release-Signaturschlüssel. Nach ausschließlich temporärer Anpassung des Prüfconfigs war der App-Build erfolgreich.
- Native Bedienprüfung in der finalen Prüf-App: Einstieg Mathematik → Zahlen verstehen → Römische Zahlen, beide Richtungen, freie Eingabe und Enter, Kleinschreibung (`mmmclxxiv` für 3174), falsche Antwort ohne Punkteabzug, freiwilliger Lösungsweg, Escape/Fokusrückweg, nächste Zahl, 5249 mit fünf M, Stufenwechsel und +3 Punkte für 2604. Nach Neustart waren die zuvor gebuchten sechs Punkte erhalten.

## Verbleibende Grenzen

Kein separates Screenreader-Praxisreview, keine Verständlichkeitsprüfung mit Kindern und keine lokale Windows-Bedienprüfung. Die PR-CI führt die Plattformprüfungen für macOS und Windows aus. Der Zahlenbereich ist eine zusätzliche Übung mit erklärter M-Konvention; historische Varianten und Überstrichschreibweisen werden nicht angeboten. Die aktuelle Zufallsaufgabe und Richtung sind flüchtig, Punkte und Kompetenzversuche bleiben gespeichert. Ein Release/Installer ist nicht Bestandteil dieses Issues.

# Review zu Issue #165: Expedition zum Erdkern

## Umfang und Reviewart

- [Issue #165](https://github.com/dr-dimitri/lernwelt/issues/165), eigener Branch `codex/issue-165-erdkern` ab `origin/main` (`006ace777f0e31477cc1d467e822803fcdb3091f`). Entdecken mit drei Stationen, vier Erdschichten, lokalem Erdfoto, Kernvergleich und 18 Aufgaben (sechs je Stufe). Die ergänzende Nutzeranweisung zur isometrisch aufgeschnittenen Erdkugel ist enthalten.
- Isometrische Viertelöffnung mit zwei konzentrischen Schnittflächen, gemeinsamer Achse, schematischer Oberfläche und seitlicher Schattierung. Direkte Auswahl und gleichwertige Tasten; neutrale Quizmarker A–D. Keine neue Abhängigkeit und keine Datenbankmigration. Rust prüft Antworten/Reihenfolgen und besitzt die Punktehaltung; Erklärungen werden erst auf ausdrücklichen Wunsch schreibfrei geladen.
- Separater unabhängiger Agent-Review durch `/root/review_earth` am 06.10.2026. Der Reviewer hat keine Implementierungsdateien geschrieben. Vollständiger Diff einschließlich neuer Dateien, Akzeptanzkriterien, alle Fragen/Tipps/Lösungswege, Quellen, Illustrationen, Persistenz, Fehler-/Retrypfade und fünf Versionsdateien wurden geprüft. Nachprüfung der isometrischen Änderung und der Korrekturen: keine offenen blockierenden Befunde.

## Befunde und Korrekturen

- P2: Nach einer falschen Grafik-/Reihenfolgeantwort wurde beim Bearbeiten der alte Ergebniszustand zunächst nicht gelöscht. Zentraler Eingabepfad entfernt das Ergebnis wieder; zwei Verhaltenstests prüfen Entwurfsschutz und Wechselentscheidung nach der Bearbeitung.
- P1: Geöffneter Tipp zusammen mit richtiger Rückmeldung überschritt zunächst bei Grafik-/Reihenfolgeaufgaben die Fensterhöhe. Grafikoptionen stehen jetzt in zwei Spalten; bei textlichen Aufgaben stehen Antwort und Hilfe/Rückmeldung nebeneinander. Alle Formen und Zustände wurden erneut vermessen.
- Deaktivierte Antwortoptionen bleiben nach dem Aufdecken vollständig lesbar. Quizgrafik und Alternativnamen enthalten keine Schichtnamen, Antwortschlüssel oder vorweggenommene Lösung.
- Projektion: Alle drei Raumachsen besitzen dieselbe projizierte Länge und Winkel von 120 Grad. Beide Schnittflächen treffen sich an denselben Polen; Marker A–D liegen jeweils in der richtigen Schicht. Die vergrößerte Kruste, schematische Farben/Dicken und fiktive Reise werden erklärt. Kernvergleich ist eine Merkhilfe, kein berechnetes Experiment.

## Prüfungen

- Vollständiges `npm run check:all`: Formatierung, 45 Frontend-Testdateien mit 428 Tests, 128 Skript-/native Pakettests, TypeScript/Vitebuild, Cargo fmt, Clippy mit `-D warnings` und 183 Rusttests erfolgreich. Log: `/private/tmp/lernwelt-165-check-iso.log`. Native macOS-Pakettests benötigen Zugriff auf DiskImages und wurden außerhalb der Sandbox erfolgreich ausgeführt.
- Inhalt-/Rustprüfungen: sechs Aufgaben je Stufe, drei Formen, antwortfreier IPC, ungültige/fehlende/doppelte Reihenfolgen ohne Mutation, atomarer Rollback, 1/2/3 Punkte ausschließlich bei Erstlösung, identische und abweichende Retries, Fortschritt nach neuer Verbindung und unveränderte bestehende Sonnensystem-IDs/Antworten/Belege. Aufdecken eröffnet keine Datenbank und vergibt keine Punkte.
- UIprüfungen: Grafik und Tastatur, Reihenfolge/Entfernen/Reset, Tipps/falsch/richtig/Aufdecken, Schreibsperre und unveränderte Retry-Nutzlast, Stufen-/Themenwechsel, Profil/Browserzustand, Bildfehler, Großansicht mit Escape/Fokusrückkehr, Abschluss und neue Runde.
- Separat durch den unabhängigen Reviewer: 33 gezielte UI-/IPC-/Projektionstests und Diffprüfung grün. Eigener Browserlauf prüfte alle vier Schichten auf beiden Schnittflächen per Koordinatenklick (acht Treffer), alle vier SVG-Gruppen mit Leertaste sowie Enter im neutralen Quizmodell samt passender Radioantwort.
- Tatsächliche Layoutprüfung mit isoliertem IPC-Testdouble in Chromium: 108 Zustände bei **2400 × 1300**, Dokumentbreite/-höhe maximal 2400/1300. Alle 18 Aufgaben offen, sämtliche Tipps, falsche und richtige Rückmeldungen, Entdeckerstationen, Erdfoto/Großansicht/Bildfehler, Aufdecken, Speichern/Retry, fehlendes Profil, Ladestörung und Abschlüsse eingeschlossen. Screenshots wurden visuell geprüft. Nachweis: `/private/tmp/earth-layout-results.json`; temporärer Harness `/private/tmp/lernwelt-layout-165.mjs`.
- Browser-Test blockiert externe Netzaufrufe; Lerninhalt und Bilder funktionieren mit lokalem Ursprung. Bei 900 × 700 und größerer Schrift bleibt die Breite 900, mit zugänglichem vertikalem Scroll-Fallback (2410 Pixel Höhe). Keine versteckten oder abgeschnittenen Antworten.
- Native finale macOS-App erfolgreich mit `npm run desktop:build -- --bundles app --config '{"bundle":{"createUpdaterArtifacts":false}}'` gebaut. Log: `/private/tmp/lernwelt-165-native-iso.log`. Per CUA unter `tauri://localhost` tatsächliche isometrische Ansicht, Grafik-/Reiseauswahl, Steckbriefe, Rust-Quizdaten und schreibfreies Aufdecken geprüft. Erklärung stimmt; aktuelle Aufgabe wird anschließend mit 0 Punkten gesperrt. Bestehendes Nutzerprofil wurde nicht verändert und keine Testantwort gebucht.
- `git diff --check` und Abgleich aller fünf Versionsdateien auf **0.6.17** mit passenden Releasehinweisen erfolgreich.

## Grenzen und Abschluss

Fach-/Sprachreview ist ein Agent-Review, keine amtliche Freigabe und keine Erprobung mit Kindern. Das Modul deckt Geo5 Lernbereich 2 nicht vollständig ab. Farben, Dicken und Kontinentumrisse sind schematisch; keine realistische Bohrung, Maßstabs- oder Temperatursimulation. Native Smokeprüfung erfolgte am verfügbaren kleineren macOS-Fenster; die exakten Standardmaße wurden im Browser geprüft. Windows und echte signierte Updater-Pakete werden durch GitHub CI geprüft; der lokale App-Build verwendet keine privaten Release-Schlüssel.

Merge, veröffentlichter automatischer Release (sechs Dateien, zwei Manifestziele) und Branchbereinigung werden nach ihrem tatsächlichen Abschluss im PR nachgewiesen. Dieser Quellreview behauptet sie nicht vorab.

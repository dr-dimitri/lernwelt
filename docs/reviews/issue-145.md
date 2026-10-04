# Review zu Issue #145: optionale GitHub-Vorabupdates

## Umfang und Reviewart

Separater **Selbstreview durch Codex** nach abgeschlossener Implementierung; keine unabhängige Freigabe. Gesamtdiff gegen `origin/main` (Basis `cd16a3f6420f2c34b63c726bc2ed547f9b51e913`), Issue-Akzeptanzkriterien, native Vertrauensgrenze, Versionsauswahl, Kanalwechsel, Fehlerzustände und Dokumentation geprüft.

Die Änderung ergänzt den booleschen Command `check_app_update`, einen separat gespeicherten Vorabkanal und dessen Oberfläche. Die stabile Merge-/Release-Pipeline und vorhandene SQLite-Datenhaltung bleiben erhalten. Versionsdateien und Releasehinweise sind auf 0.6.8 abgestimmt.

## Befunde und Korrekturen

- GitHub-`prerelease` ist die Quelle der Kennzeichnung; auch numerisch benannte Vorabversionen funktionieren. Die Auswahl vergleicht SemVer-Präzedenz statt Veröffentlichungsreihenfolge oder Zeichenketten. Eine stabile Endversion kann eine ältere Vorabversion ersetzen; gleiche Versionen, Build-Metadaten und Downgrades erzeugen kein Angebot.
- Standardprüfung bleibt am festen stabilen Manifest. Die optional aktivierte GitHub-Listenprüfung enthält ausschließlich veröffentlichte Releases mit hochgeladenem Manifest; Entwürfe, ungültige Tags, leere/unfertige/fremde Manifest-Assets werden ausgeschlossen. Pagination teilt sich ein 15-Sekunden-Budget mit dem Manifest; Größen-/Seitenlimit oder API-Fehler werden als Fehler ausgegeben.
- Native Paketprüfung gleicht Tag, Manifest-Version, HTTPS-Repositoryadresse und hochgeladenes Paket ab. Signaturprüfung und Installation verbleiben im offiziellen Tauri-Updater. Der Command akzeptiert nur einen booleschen Kanal, keine freien URLs/Headers/Targets; `updater:allow-check` wurde durch die eigene begrenzte Capability ersetzt. Handler, Buildmanifest und Capability sind konsistent.
- Kanalwechsel gibt das alte native Angebot frei, entfernt dessen Installationsaktion sofort und prüft erneut, auch wenn die Startprüfung abgeschaltet ist. Während Prüfung/Installation sowie nach erfolgreicher Installation ist der Kanal gesperrt. Fehlgeschlagenes Speichern verändert weder Auswahl noch gültiges Angebot; eine fehlgeschlagene Folgeprüfung lässt kein altes Vorabangebot installierbar zurück. Die vorhandene explizite Installation und Neustartbedienung bleiben erhalten.
- Unlesbare Einstellungen aktivieren keine Vorabversionen und lösen keine automatische Prüfung aus. Offline-/Signatur-/Neustartfehler sind verständlich und werden nicht als Erfolg ausgegeben. Lernprofile und Antworten werden weder in API-Anfragen aufgenommen noch geändert. Keine Migration und keine Löschung vorhandener Lerndaten.
- Beim Implementieren korrigiert: Die verwendete reqwest-Version benötigt für `.query` eine zusätzliche Funktion; feste API-Parameter werden stattdessen im begrenzten nativen Endpunkt erzeugt. Keine zusätzliche Abhängigkeitsversion nötig; `reqwest` und `semver` waren bereits im Lockfile vorhanden. Testskript für absichtlichen Speicherfehler korrigiert, da ein kontrollierter Schalter dabei richtigerweise seinen Wert behält.

Keine offenen blockierenden Befunde; keine unabhängig neu entdeckten Produktbugs in diesem Umfang.

## Prüfergebnisse

- `npm run check:all`: erfolgreich; Formatierung, TypeScript, Produktionsbuild, 356 Frontend-Tests in 41 Dateien, 25 Skripttests, Rustfmt, Clippy mit `-D warnings` und 164 Rust-Tests (insgesamt 545 Tests). Die bestehende Vite-Hinweismeldung zu großen Chunks ist kein Prüfungsfehler.
- Neue Beobachtungsprüfungen umfassen Standard-Opt-out, unabhängige lokale Einstellungen, gespeicherten Vorabkanal/StrictMode, explizite Installation, Sperren, Kanalwechsel mit ausstehender Prüfung, Speicherfehler, Offline-Folgeprüfung, Freigabe nativer Ressourcen, SemVer-Reihenfolge und Manifest-/Paketabweichungen.
- Echter Chromium mit gebauter React-Oberfläche und getrennten Dienst-Testdaten: **17 Zustände/Abläufe**, keine JavaScript-Fehler. Stabile und Vorabangebote, Tastaturwahl, ausgeklappte Hinweise, aktueller Stand, Offline-/Speicher-/Signatur-/Neustartfehler, Prüfung, Installation und Abschluss passen bei **2400 × 1300** ohne Dokument-/Dialogscrollen. Kleine Fenster (1100 × 750, 420 × 600) und größere Schrift bleiben ohne horizontalen Überlauf mit zugänglichem Scroll-Fallback bedienbar. Vorabangebot visuell geprüft.
- Nativer macOS-Debug-Build als `.app` erfolgreich. Produktionsoberfläche mit Testkennung `de.lernwelt.updatereview145` gestartet; Prozess bleibt aktiv, getrennte SQLite-Datenbank und `PRAGMA quick_check = ok`. Bestehende Anwendungsdaten wurden nicht verwendet.
- Zusätzliche **echte native IPC-Prüfung** mit getrenntem eingebettetem Prüffrontend, Testkennung `de.lernwelt.updateipcreview145` und ausschließlich in temporärer Konfiguration simulierter installierter Version 0.6.6: Beide Kanalprüfungen finden den tatsächlich veröffentlichten stabilen Release 0.6.7. Der echte JavaScript-`Update` kann die von Rust registrierte Ressource freigeben; erneutes Freigeben bestätigt deren Entfernung. Nichtboolesche Eingaben werden abgewiesen, der allgemeine Plugin-Prüfcommand ist gesperrt, lokale Einstellungen sind unabhängig. Kein Download, keine Installation. Eigene Testprozesse beendet und nur die neu erzeugten Test-Datenverzeichnisse entfernt.
- Versionsabgleich gegen main, Issue-Workflow-Prüfung und `git diff --check`: erfolgreich.

## Grenzen und Abschluss

Das Repository hatte während dieser Prüfung keine veröffentlichten GitHub-Vorabversionen. Ihre Auswahl/Kennzeichnung und Fehlerpfade sind mit isolierten Testdaten geprüft; die reale API-/Manifest-/Ressourcenintegration wurde gegen den vorhandenen stabilen Release verifiziert. Es wurde keine künstliche Vorabversion veröffentlicht und kein Updatepaket tatsächlich installiert. Windows und macOS Intel werden durch die erforderlichen GitHub-Prüfungen und den automatischen Release gebaut; lokale native Prüfungen liefen auf Apple Silicon.

Der PR darf erst nach grünen GitHub-Prüfungen gemergt werden. Danach sind die tatsächliche Veröffentlichung von 0.6.8 mit drei Plattformpaketen, Signaturen und `latest.json` sowie Branchbereinigung zu prüfen; dieser vor dem Merge gespeicherte Review behauptet deren späteren Abschluss nicht.

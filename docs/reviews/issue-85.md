# Review zu Issue #85: signierte App-Updates

## Umfang und Reviewart

Tauri-Updater und Neustart, deutsche Updateansicht, lokal gespeicherte automatische Startprüfung, Signaturkonfiguration sowie plattformübergreifender Release-Workflow mit vollständigem Update-Manifest.

Unabhängiger Agentenreview durch `/root/missions` am 26.09.2026 für den Gesamtdiff von Commit `4d697f2` gegen `origin/main`. Keine blockierenden Befunde. Anschließende redaktionelle Präzisierung des Datenschutztexts und der Download-Zeitgrenze durch den Implementierer im Selbstreview geprüft; keine Verhaltensänderung.

## Geprüfte Punkte und Befunde

- Updatezustände, StrictMode, deaktivierte Startprüfung, Retry, Ressourcenfreigabe, Signatur-/Installationsfehler und Neustartfehler.
- Fester HTTPS-Endpunkt, öffentlicher Schlüssel und begrenzte native Berechtigungen. Keine Lernantworten/Profile im Netzwerkpayload.
- Release-Matrix macOS ARM/Intel und Windows x64, vollständiges Manifest, eindeutige Paketnamen und Veröffentlichung erst nach allen erfolgreichen Builds.
- Keine offenen blockierenden Befunde. Der erste Release benötigt eine manuelle Erstinstallation, weil Version 0.1.0 noch keinen Updater enthält.

## Prüfergebnisse

- 180 Frontendtests und fünf Node-Skripttests bestanden; TypeScript, Vite-Build und Formatierung bestanden.
- Rust: Formatierung, Clippy mit `-D warnings` und 106 Tests bestanden.
- Reviewer wiederholte unabhängig elf Updater-Tests und drei Manifest-Skripttests; alle grün. `git diff --check` grün.
- Nativer macOS-Release-Build mit verschlüsseltem Schlüssel erfolgreich; `.app`, `.app.tar.gz` und `.sig` erzeugt. App gestartet, tatsächliche Version und Fehler-/Weiterlernenzustand bei noch nicht vorhandenem Release-Endpunkt in nativer Oberfläche geprüft.
- Echte Paketsignatur mit `minisign-verify 0.2.5` gegen den konfigurierten öffentlichen Schlüssel verifiziert. Eine Kopie mit verändertem Byte wurde abgewiesen.
- Schlüsselverwaltung nach ausdrücklicher Nutzerfreigabe: verschlüsselter privater Schlüssel außerhalb Git und GitHub-Secrets. Nur der öffentliche Verifikationsschlüssel ist versioniert.
- CI prüft macOS und Windows am jeweiligen PR-Head; Merge erfolgt erst nach grünen Checks.

## Verbleibende Grenzen

Eine reale Aktualisierung zwischen zwei veröffentlichten Versionen wurde noch nicht durchgeführt. Windows und Intel-macOS werden in CI bzw. Release gebaut, nicht lokal bedient. Updater-Signaturen ersetzen keine Apple-Notarisierung oder Windows-Herausgebersignatur. Der End-to-End-Release wird in Issue #86 geprüft. Keine Überprüfung mit Kindern behauptet.

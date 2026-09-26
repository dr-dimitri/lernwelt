# Review zu Issue #85: signierte App-Updates

## Umfang

Tauri-Updater und Neustart, deutsche Updateansicht, lokal gespeicherte automatische Startprüfung, Signaturkonfiguration sowie plattformübergreifender Release-Workflow mit vollständigem Update-Manifest.

## Reviewart und Status

Unabhängiger Agentenreview angefordert; noch ausstehend. Dieser Zwischenstand ist keine Freigabe und darf nicht gemergt werden. Der Review wird nach Abschluss inklusive Befunden und Korrekturen aktualisiert.

## Bisherige Prüfungen

- Frontend: 180 Tests sowie fünf Node-Skripttests bestanden.
- TypeScript, Vite-Build und Formatprüfung bestanden.
- Rust: Formatierung, Clippy und sämtliche Tests bestanden.
- Nativer signierter macOS-Build läuft.
- Schlüsselverwaltung nach ausdrücklicher Nutzerfreigabe: verschlüsselter privater Schlüssel außerhalb Git, GitHub-Secrets, öffentlicher Verifikationsschlüssel in Tauri-Konfiguration.

## Grenzen

Windows und Intel-macOS werden in CI bzw. Release gebaut. Eine reale Aktualisierung zwischen zwei veröffentlichten Versionen wurde noch nicht durchgeführt. Updater-Signatur ersetzt keine Apple-Notarisierung oder Windows-Herausgebersignatur. Version 0.1.0 benötigt einmalig eine manuelle Installation der neuen Version.

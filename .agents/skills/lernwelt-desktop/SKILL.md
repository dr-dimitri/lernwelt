---
name: lernwelt-desktop
description: Entwickle den lokalen Lernwelt-Unterbau mit Tauri, React, TypeScript und SQLite. Bei Änderungen an IPC, Datenhaltung, App-Konfiguration oder fachlichen Datenmodellen verwenden.
---

# Lernwelt-Desktop

Lies `AGENTS.md`, `README.md` und, sofern vorhanden, `docs/architecture.md` des Repositorys. Nutze den vorhandenen Aufbau statt parallele Infrastruktur einzuführen.

- React stellt Ansichten dar; fachliche Typen und die Tauri-Schnittstelle bleiben außerhalb der Komponenten. Rust besitzt SQLite-Verbindungen und validiert alle Command-Argumente unabhängig vom Frontend.
- Daten liegen unter Tauri `app_data_dir()`, niemals im Quell- oder Installationsverzeichnis. Schemaänderungen versionieren und transaktional migrieren. Tests müssen bestehende Daten und erneutes Öffnen berücksichtigen.
- SQL bleibt parametrisiert. Keine frei ausführbaren SQL-, Dateisystem- oder Shell-Schnittstellen aus dem Frontend anbieten. Neue Commands in Rust-Handler und Berechtigungskonfiguration konsistent registrieren.
- Die Browser-Vorschau darf fehlende Desktop-Persistenz nicht als erfolgreiches Speichern simulieren. Lade-, Fehler- und Speicherzustände für Nutzende sichtbar machen.
- Ressourcen lokal bündeln. Content Security Policy möglichst eng halten; keine entfernten Inhalte oder Cloud-Abhängigkeiten ohne konkreten Produktauftrag ergänzen.
- Lehrplaninhalte und Nutzerfortschritt trennen. Inhalte benötigen stabile IDs, Fach, Jahrgangsstufe, Kompetenzbezug, Quellenstand und bei Englisch die Fremdsprachenfolge. Musterinhalte als solche kennzeichnen.
- Mathematische Darstellung und Lösungsprüfung sind verschiedene Aufgaben. Freitexteingaben niemals mit `eval` auswerten.
- Bei Änderungen an Persistenz mindestens Migration, erneutes Öffnen und abgewiesene Eingaben prüfen. Bei UI-Änderungen relevante Nutzerabläufe prüfen. Native Build- und Startprüfung ergänzen, wenn Tauri-Konfiguration oder IPC geändert wird.
- Offizielle Referenzen bei API-Fragen: https://v2.tauri.app/ und https://react.dev/. Dokumentierte lokale Prüfkommandos verwenden und nicht ausgeführte Plattformprüfungen offen benennen.

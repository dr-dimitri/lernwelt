# Review · Issue #23

Separater Selbstreview durch Codex am 24.09.2026 gegen main ac9f71d. Keine unabhängige oder pädagogische Freigabe.

## Umfang und Befunde

24 neue Aufgaben in drei Stufen, fünf Tätigkeiten, vier echte HTML-Lerntafeln und Erklärungen zu Geld, Länge, Masse und Zeit. Größenrechnungen verwenden alle vier Grundrechenarten. Messen, Quellenprüfung ohne Internet, Präsentation und strukturierter Dreisatz sind angeleitet. Bezug: M5 4.1/1–4.

Nach Implementierung Gesamtdiff einschließlich Rust-/TypeScript-Modell, Projektion und UI geprüft. Das optionale `tables`-Feld wird für alte Themen als leere Liste gelesen; keine Datenbankmigration. Spaltenzahl, Beschriftung und Tabellenüberschriften werden validiert. Die UI rendert ausschließlich React-Text, besitzt Caption/Spaltenüberschriften und einen fokussierbaren horizontalen Scrollbereich. Keine neuen Commands, Abhängigkeiten oder externen Ressourcen.

Fachreview: Geld zweistellige Centgruppe, Länge dreistelliger Sprung km→m und sonst Zehnerschritte, Masse Tausenderschritte, Zeit getrennt im 60er-System. Beispiele 2,045 m, 3,045 kg, 4,005 g und 1 h 2 min 3 s kontrolliert. Größen durch Anzahl ergibt Größe; Größe durch gleichartige Größe ergibt Anzahl. Recherchieren benötigt keine Online-Dienste und unterscheidet Inhalt von Verpackungsmasse. Keine blockierenden Befunde.

## Prüfergebnisse

- `npm run check:all` bestanden: 22 Frontendtests + 2 Workflowtests + 21 Rusttests = 45. Format, TypeScript, Vite, rustfmt und Clippy grün.
- Neuer UI-Test prüft sichtbare Tabelle, Caption, Spalten, führende Null und Erklärung. Rust-Test prüft echte Tafel und Zurückweisung fehlerhafter Zeilenbreite.
- Alle 239 bestehenden Aufgaben und fremden Themen vollständig unverändert; neue Antworten/IDs/Metadaten geprüft. `git diff --check` bestanden.
- Isolierte native Release-App gebaut und neu gestartet. Geld-, Längen-, Massen- und Zeittafel über Accessibility vorhanden; Screenshot bestätigt Spaltenzuordnung und lesbare Tabellen. Profil, 30 verfügbare/50 verdiente Punkte und Sternabzeichen erhalten. Normales Nutzerprofil nicht verändert.

## Grenzen

Tafeln sind Lernhilfen, kein interaktiver Tabelleneditor. Papierarbeiten haben Selbstkontrolle. Gesamtmatrix und integrierte neue Aufgaben-/Persistenzprüfung folgen in #17. Vor Merge Plattformchecks abwarten.

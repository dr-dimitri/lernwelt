# Review zu Issue #75

## Umfang

Im Vokabeltrainer und in der geführten Lernrunde konnten eingefügte Steuerzeichen einen nicht korrigierbaren Speicherfehler auslösen: Die Oberfläche sendete die Rohantwort, Rust wies sie vor jeder Speicherung ab, und der unveränderte Retry hielt das Antwortfeld gesperrt.

Beide Ansichten prüfen neue Antworten jetzt vor dem Schreibrequest mit derselben kleinen Hilfsfunktion. Unicode-Kategorie `Cc` entspricht der Backendprüfung `char::is_control`. Eine verständliche Meldung erklärt das erneute Eingeben; das unveränderte Feld bleibt bearbeitbar und erhält gezielt den Fokus. Die korrigierte Antwort kann direkt gesendet werden. Gültige Antworten werden weder normalisiert noch anderweitig verändert.

Backend, Datenhaltung und Antwortbewertung bleiben unverändert. Bei unklaren Speicher- oder Transportfehlern bleiben Request-ID, Nutzlast und die Sperre bis zum Retry beziehungsweise Neuladen erhalten. Bereits ausstehende Requests werden nicht erneut durch die neue Eingabeprüfung geführt.

## Prüfergebnisse

- Zehn Regressionen vor der Umsetzung rot: Einfügen von Tab, einem inneren C0-Zeichen, DEL und zwei C1-Zeichen in beiden Ansichten.
- Dieselben Tests nach der Umsetzung grün: kein Schreibrequest mit ungültigen Zeichen, verständliche Meldung, bearbeitbares unverändertes Feld, Fokus zurück zur Eingabe, Aufdecken weiterhin erreichbar und erfolgreiche Korrektur ohne Neuladen.
- Bestehende Tests für unveränderte Request-ID und Antwort bei Speicher-Retry sowie für normales Tippen und Fokusverhalten weiterhin grün.
- Gezielte Paneltests: 34 Tests erfolgreich.
- `npm run check`: Formatierung, 135 Frontend-Tests, 2 Workflow-Tests, TypeScript und Produktionsbuild erfolgreich.
- `git diff --check`: erfolgreich.

## Reviewart und Status

Implementierung und Selbstprüfung durch Agent `audit_trainers`. Separater unabhängiger Review durch Agent `learning_content` am 25.09.2026; der Reviewer war nicht an der Umsetzung beteiligt. Er prüfte den vollständigen Diff gegen `origin/main`, den neuen Helfer, die Akzeptanzkriterien und den Reviewnachweis. Keine offenen Befunde; Freigabe für den Merge nach grünen erforderlichen CI-Checks.

Unabhängig ausgeführt: 34 Paneltests und `git diff --check` erfolgreich. Der Unicode-Abgleich über alle Codepoints erfasst exakt die 65 Steuerzeichen in C0 und DEL/C1; normale, geschützte und schmale geschützte Leerzeichen bleiben zulässig. Der Review bestätigt die Validierung vor jedem neuen Schreibrequest und unveränderte sichere Retries.

## Grenzen

Die UI-Regressionen laufen mit Vitest/jsdom und dem vorhandenen gemockten Desktop-Adapter. Kein manueller nativer Sichttest für diese Änderung. Rust und IPC wurden nicht geändert; keine erneuten Rust- oder nativen Buildprüfungen in diesem Durchgang.

CI prüft zusätzlich Frontend, Rust und native Builds auf macOS und Windows am PR. Der Merge setzt vollständig grüne Checks voraus.

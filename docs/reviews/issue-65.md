# Review zu Issue #65

## Umfang und Reproduktion

Nach einer geprüften Vokabel wurde der fokussierte Knopf „Nächste Karte“ beim Nachladen entfernt. Der Fokus fiel auf `document.body`; die nächste Antwort ließ sich nicht direkt eintippen. Jetzt fordert dieser Knopf gezielt den Fokus für die nächste Antwort oder, falls keine Karte folgt, die Abschlussüberschrift an.

Erstes Öffnen, Stufen-/Themenwechsel und normales Tippen lösen keinen neuen Autofokus aus. Die Rückmeldungsüberschrift bleibt nach bestätigten Antworten fokussiert. Lade-/Speicherfehler, offene Retries und fehlendes Profil werden bei der Fokusübergabe ausgeschlossen.

## Prüfung

- Regression vor Fix reproduziert: Fokusprüfung für nächste Karte und Abschlusszustand scheiterte (jeweils Fokus auf `body`).
- Vollständiger Tastaturablauf im Regressionstest: Antwort mit Enter, Rückmeldung, Tab und Enter auf „Nächste Karte“, direkte Eingabe der nächsten Antwort.
- Zusätzliche Prüfung: normales Bearbeiten des Antworttexts und bewusst gewählter Fokus bleiben nach unverwandtem Rerender erhalten.
- `npm run check`: Formatierung, 89 Frontend-Tests, 2 Workflow-Tests, TypeScript und Produktionsbuild erfolgreich.
- `git diff --check`: erfolgreich.
- Chromium und WebKit mit isoliertem Desktop-Testadapter: Navigation erhält beim Erstladen den Fokus auf der Seitenüberschrift; nach „Nächste Karte“ liegt er im nächsten Antwortfeld, am Ende auf „Für jetzt geschafft!“. Durchgehender Ablauf per Tab/Enter/Tippen erfolgreich, keine JavaScript-Laufzeitfehler.

## Reviewart, Befunde und Korrekturen

Separater unabhängiger Agentenreview durch `audit_persistence` über den vollständigen Diff gegen `origin/main`, Akzeptanzkriterien, Fokusanforderung, Fehler-/Retry-Verhalten und unveränderte Request-/Punkte-/Persistenzlogik. Reviewer führte `npm run check` ebenfalls erfolgreich aus. Keine offenen Befunde.

Bei der Implementierungsprüfung zeigte der erste Entwurf Autofokus bereits beim Erstladen; das hätte den bestehenden Navigationsfokus verdrängt. Vor Review auf den expliziten Kartenwechsel begrenzt und danach den vollständigen Check erfolgreich wiederholt. Kein Nebenfix an Datenhaltung oder Inhalten.

## Grenzen

Browserprüfungen verwenden Testdaten und ändern keine Nutzerprofile. Kein manueller nativer Windows-Sichttest; native macOS-/Windows-Builds werden vor dem Merge in CI geprüft. jsdom bildet die echte modale Fokussperre nicht vollständig ab.

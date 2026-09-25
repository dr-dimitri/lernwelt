# Review zu Issue #74

## Umfang und Reviewart

Unabhängiger Agentenreview durch `audit_arcade` am 25.09.2026 nach Abschluss der Implementierung. Der Reviewer hat den vollständigen Diff gegen `main` sowie die Akzeptanzkriterien von Issue #74 geprüft und war nicht an der Implementierung beteiligt. Umfang: Wiederholungssteuerung in `GameStage` und deren Verhaltensregressionen. Keine Änderungen an Persistenz, Punkten, Spielregeln oder IPC.

## Befund und Umsetzung

Kurze Eingaben bewegten Klötzchen abhängig vom bereits laufenden Wiederholungstakt um ein oder zwei Felder. Die Mindestdauer für Tastatur-/Assistenzaktivierungen der Bildschirmtasten verstärkte das Problem. Neun neue Regressionen waren vor dem Fix rot.

Wiederholungen starten jetzt je Aktion 120 ms nach dem tatsächlichen Tastendruck. Loslassen, Fokusverlust und Pause entfernen den jeweiligen Termin. Ein verspäteter Animationsframe löst höchstens einen Schritt aus, keine Nachholsalve. Drehen und Ablegen bleiben einmalig. Kurze Klötzchen-Aktivierungen brauchen kein künstliches Halten, da sie unmittelbar wirken; kontinuierliche Steuerungen anderer Spiele behalten ihren kurzen Bewegungsimpuls.

## Prüfergebnisse

- Implementierung: `npm run check` erfolgreich: Formatierung, 136 Frontendtests, 2 Workflowtests, TypeScript und Vite-Produktionsbuild.
- Neue Regressionen prüfen kurze direkte Pfeiltasten in verschiedenen Spielphasen, Pointer, Enter, Leertaste, Assistenzklick, Verschieben/Senken, echtes Halten, erneutes Drücken, Pause und Fokusverlust.
- Reviewer unabhängig: 42 Tests aus GameStage, ArcadePanel, Engine und Maze erfolgreich; TypeScript sowie `git diff --check` erfolgreich.
- Quellreview: Animationszeit und `performance.now()` haben im selben Fenster dieselbe Zeitbasis; sämtliche Freigabe-/Abbruchpfade entfernen gehaltene Aktionen und Wiederholungstermine. Keine offenen Befunde.

## Freigabe und Grenzen

Der Reviewer gibt den geprüften Stand frei. Es gab für diesen Fix keine erneute interaktive native macOS-/Windows-Prüfung; Assistenzaktivierungen sind als DOM-Ereignisse simuliert. Backend und Datenhaltung sind unverändert. CI prüft Frontend, Rust sowie native Builds auf macOS und Windows am PR; Merge erst bei vollständig grünen Checks.

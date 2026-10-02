# Review zu Issue #103: Eingabefokus

- Reviewart: separater Selbstreview durch Codex; keine unabhängige Freigabe.
- Umfang: vollständiger Diff gegen `main`, Themenstart, Wiederholungsrunde, Rundenabschluss und bestehende Tastatur-/Speicherfehlerpfade.
- Befund: Die bisherigen Animationsframe-Callbacks konnten nach Beginn der Nutzereingabe den Fokus entziehen. Ein kontrolliert verzögerter Frame reproduzierte den Defekt vor der Korrektur.
- Korrektur: ein einmaliger Fokusauftrag wird im Layout-Effekt nach dem Rendern der Runde bzw. ihres Abschlusses und vor dem nächsten Browser-Paint erledigt. Es bleiben keine asynchronen Fokusaufträge zurück. Antwortprüfung, Punkte und Datenhaltung sind unverändert.
- Prüfung: `npm run check:all` erfolgreich: Formatierung, 208 Frontendtests, 8 Skripttests, TypeScript/Produktionsbuild, Rust-Formatierung/Clippy und 117 Rusttests. Regression prüft Fokus vor Eingabe sowie fortlaufendes Tippen nach einem verzögerten Frame.
- Verbleibende Grenzen: Selbstreview und DOM-Test, keine Verständlichkeitsprüfung mit Kindern. Bestehende Vite-Warnung zum Bundle über 500 kB bleibt unberührt. Keine offenen blockierenden Befunde.

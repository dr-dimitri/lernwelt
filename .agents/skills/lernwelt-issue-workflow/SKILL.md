---
name: lernwelt-issue-workflow
description: Setze Lernwelt-GitHub-Issues mit eigenem Branch, dokumentiertem Review und anschließendem Merge um. Bei Issue-Arbeit, Bug-Erfassung und Abschlussreviews in diesem Repository verwenden.
---

# Lernwelt-Issue-Workflow

Lies die aktuelle `AGENTS.md` im Repository und das betroffene GitHub-Issue. Nutzeranweisungen haben Vorrang; dieser Skill erteilt keine zusätzliche Erlaubnis für externe Aktionen.

- Prüfe Arbeitsbaum, Remote und Stand von `main`, bevor du `codex/issue-<nummer>-<kurzname>` anlegst. Erhalte fremde Änderungen.
- Übersetze Akzeptanzkriterien in beobachtbare Ergebnisse und passende Prüfungen. Begrenze die Umsetzung auf dieses Issue.
- Erfasse reproduzierbare neue Bugs im bestehenden Stand als separate Issues mit Reproduktion und Auswirkung. Bearbeite Bugfixes auf eigenen Branches; blockierende Bugs vor dem ursprünglichen Merge lösen.
- Führe nach der Implementierung einen eigenen Review-Durchgang über den vollständigen Diff durch. Prüfe insbesondere Datenverlust, ungeprüfte IPC-Eingaben, Offline-Funktion und irreführende UI-Zustände.
- Dokumentiere Reviewart (auch Selbstreview), Befunde, Nachbesserungen, tatsächliche Prüfergebnisse und Grenzen in `docs/reviews/issue-<nummer>.md`. Behaupte keine unabhängige Freigabe ohne unabhängigen Reviewer.
- Erstelle den PR mit `Closes #<nummer>` und Reviewlink. Für mehrzeilige GitHub-Texte eine temporäre Datei und `--body-file` verwenden.
- Vor jedem Merge die App-Version gegenüber aktuellem `main` erhöhen, alle fünf Versionsdateien abgleichen und Releasehinweise ergänzen; auch Dokumentations- und CI-PRs benötigen eine neue Version.
- Merge nach erfolgreichem Review und grünen erforderlichen Checks; Schutzregeln respektieren. `main` danach lokal aktualisieren. Den automatischen GitHub-CI-Release bis zur Veröffentlichung beider Plattformpakete (macOS Apple Silicon und Windows x64) und `latest.json` prüfen; kein manueller Tag nötig.
- GitHub löscht gemergte PR-Branches automatisch. Das LLM bereinigt nach nachgewiesenem Merge selbst die erledigten lokalen Issue-Branches und Remote-Verweise. PR-Head abgleichen, offene Arbeit und Worktree-Dateien erhalten; `main` bleibt bestehen. Merge, Release und Branchbereinigung gemeinsam als Abschluss nachweisen.
- Wenn GitHub oder ein erforderlicher Check blockiert ist, erledige weiter mögliche lokale Arbeit und benenne den verbleibenden Blocker. Ein offener PR ist keine abgeschlossene Umsetzung.

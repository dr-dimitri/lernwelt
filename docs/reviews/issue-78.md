# Review zu Issue #78

## Umfang und Reviewart

Separater unabhängiger Review durch Agent `review` am 25.09.2026. Der Reviewer war an der Produktimplementierung nicht beteiligt. Geprüft wurden der vollständige Diff von `codex/issue-78-natur-technik` gegen `origin/main`, alle neu hinzugekommenen Dateien, die Akzeptanzkriterien von [Issue #78](https://github.com/dr-dimitri/lernwelt/issues/78), Fehlerpfade, Datenhaltung, Tests und Dokumentation. Die Anpassung der Produktbeschreibung in `AGENTS.md` entspricht der ausdrücklichen Nutzeranweisung.

Natur und Technik ist als drittes Fach mit der stabilen ID `nature` integriert. Das getrennte Offline-Paket enthält zwölf Themen, 108 eigene Fragen und 24 Aktivitäten. Jede Stufe bietet drei Fragen je Thema. Drei kostenlose Lernspiele verbinden Teilchenzustände, Blütenfunktionen und ein vereinfachtes Wiesennahrungsnetz mit eigenen lokal gezeichneten SVG-Modellen. Die bestehenden Fragen- und Punktecommands werden wiederverwendet; es gibt keine neue Abhängigkeit oder Netzwerkfunktion.

## Inhaltsreview

Der Reviewer hat die [offizielle LehrplanPLUS-Quelle für Natur und Technik 5](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/nt_gym) unabhängig geöffnet und die Themenzuordnung mit der Inhaltsmatrix abgeglichen. Alle 108 Fragen wurden einzeln mit Antwortmöglichkeiten, Lösung, Tipp und Erklärung gelesen. Ebenfalls vollständig geprüft wurden die zwölf Lerntexte, 24 Aktivitäten und die neun Spielvarianten mit ihren Hinweisen und Rückmeldungen.

Die Zuordnung umfasst beide Schwerpunkte sowie Körper, Pflanzen und Grünland. Begriffe werden durch Lerntexte und Tipps erläutert. Messwerte und berechnete Ergebnisse sind stimmig; alle 103 Auswahlfragen besitzen nach den Korrekturen eine eindeutige richtige Antwort. Die fünf Zahlenfragen nennen die verlangte Größe im Text. Alle Auswahlantworten bleiben unter der Eingabegrenze. Nummerierte Mitmachschritte ergänzen Beobachten, Zeichnen, Bewegung und Erklären ohne automatische Bewertung. Körperentwicklung und persönliche Grenzen werden sachlich behandelt, ohne persönliche Angaben zu verlangen.

Die Spielregeln und Abbildungen wurden auf fachliche Bedeutung und Modellgrenzen geprüft: Teilchen bleiben beim Zustandswechsel erhalten; Bestäubung und Befruchtung werden unterschieden; Nahrungspfeile zeigen von Nahrung zum fressenden Tier. Die zusätzliche reale Beziehung Grashüpfer → Weißstorch wird auch im einfacheren Kettenmodus ausdrücklich anerkannt. Das Angebot behauptet weder vollständige Lehrplanabdeckung noch amtliche Freigabe oder eine Erprobung mit Kindern.

## Befunde und Nachbesserungen

- **Präzisierung einer Auswahlfrage:** `grassland.2` fragte zunächst allgemein nach einem Umweltfaktor, obwohl auch Lebewesen als belebte Umweltfaktoren wirken können. Frage und Erklärung unterscheiden nun ausdrücklich eine unbelebte Umweltbedingung. Nachprüfung: eindeutige Auswahl und unveränderte richtige Antwort.
- **Messwert und Ursache trennen:** `water.6` bezeichnete Milliliter als Wasserstand und leitete aus dem Mengenunterschied direkt Verdunstung ab. Die Frage nennt jetzt Wassermengen; die Erklärung berechnet 8 ml und stellt klar, dass die Zahlen allein keine Ursache belegen. Antwort und ID bleiben gleich.
- **Lesbare Mitmachschritte:** Alle 24 Aktivitäten haben jetzt Zeilenumbrüche zwischen den nummerierten Schritten; die vorhandene Darstellung erhält diese Umbrüche.
- **Integrationsprüfung der Zahlenfragen:** Der implementierende Hauptagent fand beim ersten Rust-Gesamtlauf fünf nicht unterstützte `answerKind: integer`-Werte. Sie wurden auf den vorhandenen Typ `number` geändert. Der anschließende vollständige Rust-Lauf und die unabhängigen Natur-Tests sind grün.
- **Tastaturfokus:** Im separaten Spielreview wurde der Fokus nach dem Deaktivieren einer erfolgreich zugeordneten Karte betrachtet. Die finale Umsetzung führt ihn zur nächsten offenen Karte beziehungsweise zur Abschlussüberschrift. Verhaltenstests bestätigen dies.
- **Dokumentationsabgleich:** Die README erwähnte zunächst nicht vorhandene Lerntafeln. Sie nennt jetzt die tatsächlich enthaltenen Teilchenbilder und den Blütenschnitt.
- **Kontrast beim Moduswechsel:** Die Sichtprüfung des Hauptagenten fand weißen Text auf dem hellen Hover-Hintergrund der aktiven Fragen-/Spiele-Schaltfläche. Die neue Modusgestaltung verwendet nun dunklen Text auf hellem Hintergrund und eine dunkle Unterkante als Auswahlmerkmal. Die unabhängige Nachprüfung der CSS-Kaskade bestätigt, dass der Text auch beim allgemeinen Hover-Hintergrund dunkel bleibt; die berechneten Textkontraste liegen bei 6,28:1 beziehungsweise 6,66:1.

Die Befunde betreffen die neue Umsetzung dieses Issues. Es wurde kein reproduzierbarer zusätzlicher Produktbug im bestehenden `main` festgestellt. Alle genannten Korrekturen wurden nachgeprüft; keine offenen blockierenden Code- oder Inhaltsbefunde.

## Datenhaltung, Fehlerpfade und Bedienung

Migration 015 ersetzt ausschließlich `learning_progress` innerhalb der bestehenden Migrationstransaktion. Alle bisherigen Spaltenwerte einschließlich Zeitstempeln werden übernommen; die Fächerbeschränkung erlaubt zusätzlich `nature`. Ein Vergleich aller gespeicherten Tabellenzeilen der Schema-14-Fixture prüft Profil, alte Jahrgangsstufe, Fortschritt, Einstellungen, historische Punkte, Antwortbelege, Abzeichen, offene Spielrunde, Vokabeln, Mission und Einmaleinsdaten. Erneutes Öffnen, Fremdschlüsselkonsistenz und fehlgeschlagenes Upgrade sind geprüft.

Die Rust-Grenze prüft Antworten und Eingaben weiter selbst. Fortschritt, 1/2/3-Punktebuchung und Antwortbeleg liegen in einer Transaktion. Wiederholte Requests buchen nicht erneut; eine geänderte Nutzlast unter derselben ID wird abgewiesen. Ein fehlgeschlagener Beleg rollt Fortschritt und Punkte zurück. Ein fehlendes Profil verhindert Punktebuchungen, während die kostenlosen Lernspiele verfügbar bleiben.

Die Oberfläche zeigt Lade- und Speicherfehler, behält beim Antwort-Retry dieselbe Request-ID und verwendet bei einem gescheiterten Stufenwechsel weiter den bestätigten Stand. Spiele haben native Schaltflächen, sichtbaren Tastaturfokus, textuelle Bildalternativen, angekündigte Rückmeldungen und erreichbare Tipps. Falsche Versuche und doppelte Verbindungen erhöhen den Spielstand nicht. Stufen-, Spiel- und Ansichtswechsel starten die ausdrücklich ungespeicherte Spielrunde neu; Fragen und globale Stufe bleiben in SQLite gespeichert.

## Prüfergebnisse

Vom unabhängigen Reviewer ausgeführt:

- `npx vitest run src/components/LearningPanel.test.tsx src/components/SubjectLibrary.test.tsx src/App.test.tsx`: 40 Tests grün.
- `npx vitest run src/components/NatureGames.test.tsx`: sechs Tests grün, einschließlich falscher und doppelter Zuordnungen, Abschluss, Reset, Stufenwechsel und Tastaturfokus.
- `cargo test --manifest-path src-tauri/Cargo.toml --locked nature -- --nocapture`: sechs Tests grün. Der Fragenlauf beantwortet alle 108 Naturfragen falsch, richtig, als Request-Replay und erneut; danach werden Fortschritt und Konto aus einer neuen Verbindung geprüft.
- `cargo test --manifest-path src-tauri/Cargo.toml --locked merged_packages_reject_global_duplicate_ids_and_keep_each_source`: grün.
- `git diff --check`: grün.

Vom implementierenden Hauptagenten ausgeführt und für diesen Review berichtet:

- `npm run check`: Formatierung, 157 Frontendtests in 16 Dateien, zwei Workflowtests, TypeScript und Vite-Produktionsbuild grün.
- `npm run check:rust` nach der Typkorrektur: Rustfmt, Clippy mit `-D warnings` und 99 Rusttests grün; keine fehlgeschlagenen Main- oder Doctests.
- Native macOS-Release-Build und Startprüfung mit isolierter Kennung `de.lernwelt.review78`: erfolgreich. Im Fenster mit 1100 × 750 Pixeln wurden ein Testprofil, eine Auswahl- und eine Zahlenfrage mit jeweils zwei Punkten, eine Stoff-Labor-Runde mit falschem Versuch und korrektem Abschluss per Return, Fokusführung, eine Wiesenverbindung in Bild und Text sowie der Wechsel zu Streber geprüft. Das Guthaben blieb beim kostenlosen Spielen bei vier Punkten.
- Nach der CSS-Korrektur wurde das native Release erneut erfolgreich gebaut und mit 420 × 600 Pixeln gestartet. Vier Punkte und die Stufe Streber blieben über den Neustart erhalten. Der Wechsel zurück zu Könner zeigte die zwei bereits gelösten Fragen weiterhin. Eine erneute richtige Antwort auf eine alte Frage wurde als bereits gelöst erkannt und brachte keine weitere Gutschrift. Navigation, Scrollen und Antwortdialog funktionierten.
- Ergänzende Browser-Sichtprüfung mit ausdrücklich synthetischen Daten in einer temporären Prüfseite: aktive Modusschaltfläche einschließlich Hover lesbar; bei 420 × 600 Pixeln waren Spielwahl, Bildkarten, Blütenschnitt, Zuordnungen und untere Tipps durch vertikales Scrollen erreichbar. `scrollWidth` und Viewportbreite betrugen jeweils 420 Pixel; kein horizontaler Überlauf. Diese Prüfung belegt Layout und Kontrast, keine native Speicherung. Anlass waren perspektivisch verzerrte Aufnahmen der nativen Oberfläche; die Funktions- und Persistenzprüfung erfolgte hingegen in der echten isolierten Desktop-App. Temporäre Prüfseite und Server wurden danach entfernt beziehungsweise beendet, Viewport und Tab aufgeräumt.

## Grenzen und Abschlussstatus

Die automatisierten UI-Tests verwenden jsdom und den gemockten Desktop-Adapter. Sie ersetzen keine Prüfung mit assistiven Technologien oder mit Kindern. Die fachliche Durchsicht ist ein Agentenreview, keine amtliche oder fachwissenschaftliche Zertifizierung. Spielstände werden absichtlich nur während der offenen Runde gehalten; freie Spiele vergeben keine Lernpunkte. Die Inhaltsmatrix benennt die Grenzen des begrenzten Angebots.

Code, Inhalte und die finale CSS-Korrektur sind nach Nachprüfung freigegeben. Der native Build-/Startnachweis liegt vor. Der Merge setzt grüne erforderliche PR-Checks voraus. Windows wird über die PR-CI geprüft; eine lokale Windows-Startprüfung wurde nicht durchgeführt. Erst nach erfolgtem Merge ist Issue #78 abgeschlossen.

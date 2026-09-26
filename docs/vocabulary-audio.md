# Offline-Aussprache und Hörrunden

## Angebot und Bedienung

Alle 370 Karten aus `vocabulary-5-v1.json` haben ein Wortaudio und ein Audio des vollständigen Beispielsatzes. Die Texte bleiben identisch mit dem Inhaltskatalog. Die 740 MP3s liegen unter `public/audio/vocabulary/` und werden von Vite in die App kopiert. Sie benötigen ungefähr 7,5 MB. Keine Downloads, Systemstimmen, Mikrofonaufnahme oder Sprachsynthese zur Laufzeit.

In Vorschule stehen beide Abspielknöpfe vor der Antwort bereit: Die Frage enthält bereits das englische Wort und den Satz. Könner und Streber zeigen die Knöpfe erst in der bestätigten Rückmeldung. So wird ein verborgenes englisches Lösungswort nicht versehentlich vorgelesen. Fehlgeschlagene Speicheranfragen erlauben weiterhin weder Aufdecken noch Abspielen der Lösung.

Ein Abspielknopf startet genau eine Datei nach bewusster Betätigung. Ein neuer Ton ersetzt den bisherigen. Audio stoppen, Karten-, Themen-, Stufen-, Profil- und Ansichtswechsel sowie eine verborgene Browseransicht stoppen die Wiedergabe. Veraltete Abspielversprechen und Audioereignisse können danach keine Fehlermeldungen der neuen Karte überschreiben. Wiedergabefehler nennen einen erneuten Versuch und die Möglichkeit, ohne Ton zu üben.

**3 Wörter hören** nutzt eine eigene kurze Runde mit drei verschiedenen Karten aus dem gewählten Thema. Zu jedem gehörten Wort stehen drei deutsche Bedeutungen zur Wahl. Hinterlegte deutsche Antwortvarianten, englische Dubletten und die in der aktuellen Wortliste gefundenen Homophone son/sun, wear/where und ate/eight werden beim Auswählen der Ablenkantworten ausgeschlossen. Der englische Text und Beispielsatz werden erst nach Auswahl oder bewusstem Aufdecken gezeigt. Die Runde enthält keine Datenbankschreiboperationen, Punkte oder Fortschrittsbewertung. Sie verändert weder die globale Stufe noch die fällige schriftliche Karte. **Wörter schreiben** führt zur bisherigen schriftlichen Übung zurück. Die vorhandene Punktevergabe bleibt unverändert.

## Herkunft, Lizenz und Erzeugung

- Stimme: **Cori high**, Bryce Beattie. Der [ursprüngliche Modellersteller](https://brycebeattie.com/files/tts/) bezeichnet Modell und Trainingsaufnahmen als Public Domain. Er beschreibt ein Training von Grund auf mit britischen LibriVox-Aufnahmen; es gibt kein Fine-Tuning von einem Modell mit Forschungslizenz.
- Die [Modellkarte im festgehaltenen Stand](https://huggingface.co/rhasspy/piper-voices/blob/c10ece1aade47bb51c153c893d14e5bf8e5b7117/en/en_GB/cori/high/MODEL_CARD) bestätigt diese Herkunft. Die Modellsammlung weist zusätzlich MIT als Repositorylizenz aus. Die direkte Lizenzangabe des Erstellers für Cori ist Public Domain.
- Für Lernwelt wurden eigene Texte neu synthetisiert und als MP3 gespeichert. Diese erzeugten Audios werden unter [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) weitergegeben, soweit Rechte daran bestehen. Es wird keine Empfehlung oder Freigabe durch den Modellersteller behauptet. Keine LibriVox-Buchtexte oder Originalaufnahmen werden weitergegeben.
- Quellvermerk und vollständiger CC0-Text liegen neben den Audios in `ATTRIBUTION.txt` und `LICENSE-CC0-1.0.txt`; **Über die Audios** enthält diese Informationen auch in der App.
- Entwicklerwerkzeuge: Piper 1.8.0 (GPL-3.0), ONNX Runtime 1.30.0, FFmpeg 9.0.2 mit libmp3lame. Piper, Modell und ursprünglicher Datensatz sind nicht in Lernwelt eingebunden; ausgeliefert werden nur die fertigen Audios. [Offizielle Piper-API](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/API_PYTHON.md).

Exakter Modellstand: `c10ece1aade47bb51c153c893d14e5bf8e5b7117` in `rhasspy/piper-voices`.

| Datei | SHA-256 |
| --- | --- |
| `en_GB-cori-high.onnx` | `470b4dd634c98f8a4850d7626ffc3dfc90774628eeef6605a6dd8f88f30a5903` |
| `en_GB-cori-high.onnx.json` | `9e7fb5b5671612c22f3c81cbe46c1ae87b031a4632bcb509e499dad6f1e2adec` |

Zum erneuten Erzeugen eine separate Python-Umgebung verwenden, `scripts/audio-generation-requirements.txt` installieren und die zwei oben benannten Dateien aus dem verlinkten Modellstand laden. FFmpeg muss im PATH liegen. Dann:

```sh
python scripts/generate-vocabulary-audio.py /pfad/en_GB-cori-high.onnx
npx prettier --write src/content/vocabulary-audio.json
npm run check
```

Der Generator kontrolliert die beiden Quellhashes und erzeugt Wort und Satz mit `length_scale=1.1`, `noise_scale=0`, `noise_w_scale=0`; PCM 22050 Hz wird als Mono-MP3 mit 64 kbit/s gespeichert. Das Manifest hält Texte, Dauer und SHA-256 jeder ausgelieferten Datei fest. Andere Encoder-/Rechenplattformen können andere MP3-Bytes erzeugen; nach einer Neuerzeugung sind Manifest und Ausgabedateien zusammen zu prüfen.

## Prüfungen und Grenzen

Automatisierte Tests prüfen die vollständige Zuordnung der 370 Karten/740 Dateien, exakte Textübereinstimmung, Dateiformat, Dauergrenzen und Hashes. Komponentenprüfungen decken manuelles Starten, Stoppen, Wechsel, Abspiel-/Dateifehler, veraltete Abspielversprechen, die versteckten Antworten in Könner/Streber und die vollständige freiwillige Hörrunde ab. Die bestehenden Tests der Punkte- und Wiederholungslogik bleiben bestehen.

Die Stimme ist synthetisch. Aussprache und Satzmelodie können von einer menschlichen Vorleseperson abweichen. Es gibt keine Aussprachebewertung und keine Qualitätsprüfung mit Kindern. Mehrdeutige Wörter wie *read*, *present* und *wind* wurden zusätzlich anhand der erzeugten Lautfolgen im jeweiligen Beispielsatz geprüft. Das Angebot ergänzt die vorhandenen Inhalte und stellt keine vollständige Abdeckung des Hörverstehens nach LehrplanPLUS dar.

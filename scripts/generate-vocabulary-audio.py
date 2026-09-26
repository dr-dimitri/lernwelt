"""Generate committed offline speech assets; never used by the app at runtime.

Requires piper-tts==1.8.0 and FFmpeg. See docs/vocabulary-audio.md for
voice provenance, model hashes, licensing and regeneration instructions.
"""
import argparse
import hashlib
import json
import pathlib
import subprocess
import tempfile
import wave

from piper import PiperVoice, SynthesisConfig

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODEL_SHA256 = "470b4dd634c98f8a4850d7626ffc3dfc90774628eeef6605a6dd8f88f30a5903"


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("model", type=pathlib.Path)
    args = parser.parse_args()
    if sha256(args.model) != MODEL_SHA256:
        raise SystemExit("Unexpected model: use the pinned Cori voice from the documentation.")
    if sha256(pathlib.Path(str(args.model) + ".json")) != "9e7fb5b5671612c22f3c81cbe46c1ae87b031a4632bcb509e499dad6f1e2adec":
        raise SystemExit("Unexpected voice configuration: use the pinned Cori config.")
    catalog = json.loads((ROOT / "src-tauri/content/vocabulary-5-v1.json").read_text())
    voice = PiperVoice.load(args.model)
    config = SynthesisConfig(length_scale=1.1, noise_scale=0.0, noise_w_scale=0.0)
    output = ROOT / "public/audio/vocabulary"
    output.mkdir(parents=True, exist_ok=True)
    cards = []
    with tempfile.TemporaryDirectory(prefix="lernwelt-speech-") as temp:
        wav = pathlib.Path(temp) / "speech.wav"
        for index, source in enumerate(catalog["cards"]):
            card = {key: source[key] for key in ("id", "deckId", "english", "german", "example", "germanAnswers")}
            for kind, key in (("word", "english"), ("example", "example")):
                filename = f'{source["id"]}.{kind}.mp3'
                with wave.open(str(wav), "wb") as audio:
                    voice.synthesize_wav(source[key], audio, syn_config=config)
                with wave.open(str(wav), "rb") as audio:
                    seconds = round(audio.getnframes() / audio.getframerate(), 3)
                    if not 0.15 <= seconds <= 30:
                        raise ValueError(f"Unexpected duration for {filename}: {seconds}")
                subprocess.run([
                    "ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(wav),
                    "-map_metadata", "-1", "-codec:a", "libmp3lame", "-b:a", "64k",
                    "-ac", "1", str(output / filename),
                ], check=True)
                card[kind + "Audio"] = {
                    "file": f"/audio/vocabulary/{filename}",
                    "sha256": sha256(output / filename),
                    "seconds": seconds,
                }
            cards.append(card)
            if index % 50 == 0:
                print(f"Generated {index + 1}/{len(catalog['cards'])} cards", flush=True)
    manifest = {"version": 1, "voice": "en_GB-cori-high", "cards": cards}
    (ROOT / "src/content/vocabulary-audio.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"Generated {len(cards) * 2} audio files", flush=True)


if __name__ == "__main__":
    main()

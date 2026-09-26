import { resolve } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import catalog from '../../src-tauri/content/vocabulary-5-v1.json';
import { vocabularyAudio, createListeningRound } from './vocabulary-audio';

it('bündelt zu jeder aktuellen Karte Wort und Beispielsatz ohne Textabweichung und mit gültigem Assethash', () => {
  expect(vocabularyAudio.size).toBe(catalog.cards.length);
  const files = new Set<string>();
  for (const source of catalog.cards) {
    const card = vocabularyAudio.get(source.id)!;
    for (const key of [
      'id',
      'deckId',
      'english',
      'german',
      'example',
      'germanAnswers',
    ] as const) {
      expect(card[key], `${source.id}: ${key}`).toEqual(source[key]);
    }
    for (const audio of [card.wordAudio, card.exampleAudio]) {
      expect(audio.file).toMatch(/^\/audio\/vocabulary\/[a-z0-9.-]+\.mp3$/);
      expect(audio.seconds).toBeGreaterThan(0.15);
      expect(audio.seconds).toBeLessThan(30);
      const bytes = readFileSync(resolve('public', audio.file.slice(1)));
      expect(bytes.length).toBeGreaterThan(1000);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(
        audio.sha256,
      );
      expect(bytes.subarray(0, 3).toString()).toBe('ID3');
      files.add(audio.file.split('/').at(-1)!);
    }
  }
  const assets = readdirSync(resolve('public/audio/vocabulary')).filter(
    (file) => file.endsWith('.mp3'),
  );
  expect(new Set(assets)).toEqual(files);
  expect(files.size).toBe(catalog.cards.length * 2);
});

it('erstellt für jedes Thema drei verschiedene Hörfragen mit passenden und eindeutigen Auswahlmöglichkeiten', () => {
  for (const deck of ['all', ...catalog.decks.map((item) => item.id)]) {
    const round = createListeningRound(deck, () => 0.37);
    expect(round).toHaveLength(3);
    expect(new Set(round.map((question) => question.card.id)).size).toBe(3);
    for (const question of round) {
      if (deck !== 'all') expect(question.card.deckId).toBe(deck);
      expect(question.choices).toHaveLength(3);
      expect(question.choices).toContainEqual({
        id: question.card.id,
        label: question.card.german,
      });
      expect(new Set(question.choices.map((choice) => choice.label)).size).toBe(
        3,
      );
      for (const choice of question.choices.filter(
        (choice) => choice.id !== question.card.id,
      )) {
        expect(
          question.card.germanAnswers.map((word) => word.toLowerCase()),
        ).not.toContain(choice.label.toLowerCase());
      }
    }
  }
});

it('bietet gleich klingende Wörter und englische Dubletten nicht als verschiedene Hörantworten an', async () => {
  const { listeningChoices } = await import('./vocabulary-audio');
  const byWord = (word: string) =>
    [...vocabularyAudio.values()].find((card) => card.english === word)!;
  for (const [first, second] of [
    ['son', 'sun'],
    ['wear', 'where'],
    ['ate', 'eight'],
  ]) {
    const card = byWord(first);
    const other = byWord(second);
    const sameEnglish = {
      ...card,
      id: 'duplicate',
      german: 'andere Bedeutung',
      germanAnswers: ['andere Bedeutung'],
    };
    const candidates = [
      card,
      other,
      sameEnglish,
      byWord('hello'),
      byWord('goodbye'),
    ];
    const choices = listeningChoices(card, candidates, () => 0);
    expect(choices).toHaveLength(3);
    expect(choices.map((choice) => choice.id)).toContain(card.id);
    expect(choices.map((choice) => choice.id)).not.toContain(other.id);
    expect(choices.map((choice) => choice.id)).not.toContain('duplicate');
  }
});

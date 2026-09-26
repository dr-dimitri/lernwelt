import { vi } from 'vitest';

export function mockAudio() {
  const instances: {
    src: string;
    currentTime: number;
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    onended: (() => void) | null;
    onerror: (() => void) | null;
  }[] = [];
  const play = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  vi.stubGlobal(
    'Audio',
    vi.fn(function (src: string) {
      const instance = {
        src,
        currentTime: 0,
        play,
        pause: vi.fn(),
        onended: null,
        onerror: null,
      };
      instances.push(instance);
      return instance;
    }),
  );
  return { instances, play };
}

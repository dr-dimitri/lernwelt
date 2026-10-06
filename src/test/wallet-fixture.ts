import type { AchievementProgress } from '../domain/achievements';
import { achievements } from '../domain/achievements';

export function initialAchievements(): AchievementProgress {
  return {
    completedTasks: 0,
    currentId: achievements[0].id,
    unlockedIds: [achievements[0].id],
    nextId: achievements[1].id,
  };
}

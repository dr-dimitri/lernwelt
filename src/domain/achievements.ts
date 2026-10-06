import definitions from '../../src-tauri/content/achievements-v1.json';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  requiredPoints: number;
  requiredTasks: number;
  image: string;
}

export interface AchievementProgress {
  completedTasks: number;
  currentId: string;
  unlockedIds: string[];
  nextId: string | null;
}

/** Display definitions shared with Rust. Only Rust decides which ranks are earned. */
export const achievements: readonly AchievementDefinition[] = definitions;

export function achievementById(id: string) {
  return achievements.find((achievement) => achievement.id === id);
}

export function remainingAchievementProgress(
  achievement: AchievementDefinition,
  totalEarned: number,
  completedTasks: number,
) {
  return {
    points: Math.max(0, achievement.requiredPoints - totalEarned),
    tasks: Math.max(0, achievement.requiredTasks - completedTasks),
  };
}

export function validAchievementProgress(
  progress: AchievementProgress,
): boolean {
  if (!progress) return false;
  const currentIndex = achievements.findIndex(
    (achievement) => achievement.id === progress.currentId,
  );
  return (
    Number.isSafeInteger(progress.completedTasks) &&
    progress.completedTasks >= 0 &&
    currentIndex >= 0 &&
    Array.isArray(progress.unlockedIds) &&
    progress.unlockedIds.length === currentIndex + 1 &&
    progress.unlockedIds.every((id, index) => id === achievements[index]?.id) &&
    progress.nextId === (achievements[currentIndex + 1]?.id ?? null)
  );
}

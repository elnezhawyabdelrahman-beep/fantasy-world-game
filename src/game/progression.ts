export function levelForExperience(experience: number): number {
  const xp = Math.max(0, Math.floor(experience));
  let level = 1;
  let remaining = xp;
  while (remaining >= level * 100) { remaining -= level * 100; level++; }
  return level;
}
export function experienceForNextLevel(level: number): number {
  return Math.max(1, Math.floor(level)) * 100;
}
export function questProgress(found: number, goal: number): number {
  if (goal <= 0) return 100;
  return Math.min(100, Math.max(0, found / goal * 100));
}
import { describe, expect, it } from "vitest";
import { experienceForNextLevel, levelForExperience, questProgress } from "./progression";
describe("player progression", () => {
  it("starts at level one", () => expect(levelForExperience(0)).toBe(1));
  it("levels up at the configured threshold", () => expect(levelForExperience(100)).toBe(2));
  it("handles multiple levels", () => expect(levelForExperience(300)).toBe(3));
  it("calculates next-level XP", () => expect(experienceForNextLevel(3)).toBe(300));
  it("clamps quest progress", () => expect(questProgress(9, 3)).toBe(100));
});
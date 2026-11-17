import { describe, expect, it } from "vitest";

import {
  emptyMobileSkillState,
  mobileScoresFromSkills,
  mobileSkillStateFromEvaluation,
  MOBILE_SKILL_CATEGORIES,
} from "../lib/touchline/skills";

describe("mobile evaluation scoring", () => {
  it("uses the same 28 skills and four categories as the web app", () => {
    expect(MOBILE_SKILL_CATEGORIES.map((category) => category.key)).toEqual([
      "technical",
      "tactical",
      "physical",
      "personality",
    ]);
    expect(
      MOBILE_SKILL_CATEGORIES.reduce((total, category) => total + category.skills.length, 0),
    ).toBe(28);
  });

  it("calculates category and overall ratings on the website's 0.1 scale", () => {
    const skills = emptyMobileSkillState(5);
    skills.technical["Ball Control"] = 10;
    expect(mobileScoresFromSkills(skills)).toEqual({
      technical_score: 5.6,
      tactical_score: 5,
      physical_score: 5,
      personality_score: 5,
      overall_rating: 5.2,
    });
  });

  it("hydrates a partially completed evaluation without losing default skill rows", () => {
    const hydrated = mobileSkillStateFromEvaluation({
      technical_skills: { "Ball Control": 9 },
      tactical_skills: null,
      physical_skills: null,
      personality_skills: null,
    });
    expect(hydrated.technical["Ball Control"]).toBe(9);
    expect(hydrated.technical.Dribbling).toBe(5);
    expect(hydrated.tactical.Positioning).toBe(5);
  });
});

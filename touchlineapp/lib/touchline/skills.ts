export const MOBILE_SKILL_CATEGORIES = [
  {
    key: "technical",
    label: "Technical",
    column: "technical_skills",
    scoreColumn: "technical_score",
    skills: [
      "Ball Control",
      "Dribbling",
      "Passing",
      "First Touch",
      "Shooting",
      "Crossing",
      "Finishing",
      "Ball Protection",
    ],
  },
  {
    key: "tactical",
    label: "Tactical",
    column: "tactical_skills",
    scoreColumn: "tactical_score",
    skills: [
      "Positioning",
      "Decision Making",
      "Game Awareness",
      "Attacking Movement",
      "Defensive Awareness",
      "Teamwork",
      "Understanding of Space",
    ],
  },
  {
    key: "physical",
    label: "Physical",
    column: "physical_skills",
    scoreColumn: "physical_score",
    skills: ["Speed", "Agility", "Strength", "Stamina", "Balance", "Coordination"],
  },
  {
    key: "personality",
    label: "Personality & Character",
    column: "personality_skills",
    scoreColumn: "personality_score",
    skills: [
      "Discipline",
      "Attitude",
      "Confidence",
      "Leadership",
      "Team Spirit",
      "Coachability",
      "Commitment",
    ],
  },
] as const;

export type MobileSkillCategoryKey = (typeof MOBILE_SKILL_CATEGORIES)[number]["key"];
export const MOBILE_GENDERS = ["Male", "Female"] as const;
export const MOBILE_POSITIONS = [
  "Goalkeeper",
  "Right Back",
  "Left Back",
  "Centre Back",
  "Defensive Midfielder",
  "Central Midfielder",
  "Attacking Midfielder",
  "Right Winger",
  "Left Winger",
  "Striker",
] as const;
export const MOBILE_PREFERRED_FEET = ["Right", "Left", "Both"] as const;
export type MobileSkillState = Record<MobileSkillCategoryKey, Record<string, number>>;
export type MobileAssessment = {
  strengths: string;
  weaknesses: string;
  development_goals: string;
  coach_verdict: string;
  coach_notes: string;
};

export const MOBILE_VERDICTS = [
  "Elite Prospect",
  "Ready for Promotion",
  "Developing Well",
  "Needs Improvement",
  "Requires Close Monitoring",
] as const;

export function emptyMobileSkillState(defaultValue = 5): MobileSkillState {
  return Object.fromEntries(
    MOBILE_SKILL_CATEGORIES.map((category) => [
      category.key,
      Object.fromEntries(category.skills.map((skill) => [skill, defaultValue])),
    ]),
  ) as MobileSkillState;
}

export function mobileAverageScore(skills: Record<string, number> | null | undefined): number {
  const values = Object.values(skills ?? {});
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

export function mobileScoresFromSkills(skills: MobileSkillState) {
  const technical_score = mobileAverageScore(skills.technical);
  const tactical_score = mobileAverageScore(skills.tactical);
  const physical_score = mobileAverageScore(skills.physical);
  const personality_score = mobileAverageScore(skills.personality);
  const overall_rating =
    Math.round(((technical_score + tactical_score + physical_score + personality_score) / 4) * 10) /
    10;
  return { technical_score, tactical_score, physical_score, personality_score, overall_rating };
}

export function mobileSkillStateFromEvaluation(
  evaluation?: {
    technical_skills: Record<string, number> | null;
    tactical_skills: Record<string, number> | null;
    physical_skills: Record<string, number> | null;
    personality_skills: Record<string, number> | null;
  } | null,
): MobileSkillState {
  const defaults = emptyMobileSkillState();
  if (!evaluation) return defaults;
  return {
    technical: { ...defaults.technical, ...(evaluation.technical_skills ?? {}) },
    tactical: { ...defaults.tactical, ...(evaluation.tactical_skills ?? {}) },
    physical: { ...defaults.physical, ...(evaluation.physical_skills ?? {}) },
    personality: { ...defaults.personality, ...(evaluation.personality_skills ?? {}) },
  };
}

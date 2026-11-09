export const POSITIONS = [
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

export const PREFERRED_FOOT = ["Right", "Left", "Both"] as const;
export const GENDERS = ["Male", "Female"] as const;
export const VERDICTS = [
  "Elite Prospect",
  "Ready for Promotion",
  "Developing Well",
  "Needs Improvement",
  "Requires Close Monitoring",
] as const;

export type SkillCategoryKey = "technical" | "tactical" | "physical" | "personality";

export interface SkillCategory {
  key: SkillCategoryKey;
  label: string;
  column: string;
  scoreColumn: string;
  skills: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
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
];

export type SkillState = Record<SkillCategoryKey, Record<string, number>>;

export function emptySkillState(defaultValue = 5): SkillState {
  return SKILL_CATEGORIES.reduce((acc, category) => {
    acc[category.key] = Object.fromEntries(category.skills.map((s) => [s, defaultValue]));
    return acc;
  }, {} as SkillState);
}

export function averageScore(skills: Record<string, number>): number {
  const values = Object.values(skills ?? {});
  if (!values.length) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function ratingTone(rating: number | null | undefined): "success" | "primary" | "destructive" {
  if (rating == null) return "primary";
  if (rating >= 7.5) return "success";
  if (rating >= 5) return "primary";
  return "destructive";
}

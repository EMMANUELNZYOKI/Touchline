export type AppRole = "academy_admin" | "coach";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Coach extends Profile {
  playerCount: number;
  evaluationCount: number;
  evaluatedPlayerCount: number;
}

export interface Player {
  id: string;
  coach_id: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  season: string | null;
  team_category: string | null;
  phone: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  emergency_contact: string | null;
  position: string | null;
  secondary_position: string | null;
  preferred_foot: string | null;
  jersey_number: number | null;
  player_photo: string | null;
  height: number | null;
  weight: number | null;
  medical_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type SkillMap = Record<string, number>;

export interface Evaluation {
  id: string;
  player_id: string;
  coach_id: string;
  season: string;
  season_year: number;
  technical_score: number | null;
  tactical_score: number | null;
  physical_score: number | null;
  personality_score: number | null;
  overall_rating: number | null;
  technical_skills: SkillMap;
  tactical_skills: SkillMap;
  physical_skills: SkillMap;
  personality_skills: SkillMap;
  strengths: string | null;
  weaknesses: string | null;
  development_goals: string | null;
  coach_verdict: string | null;
  coach_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerWithMeta extends Player {
  evaluation: Evaluation | null;
  coachName: string;
}

import { Document, Image, Page, Path, Svg, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Evaluation, Player } from "@/lib/types";
import { calculateAge } from "@/lib/skills";

const BLUE = "#1f4e79";
const LIGHT_BLUE = "#18a9d8";
const BLACK = "#111111";
const BORDER = "#333333";

const styles = StyleSheet.create({
  page: {
    paddingTop: 25,
    paddingBottom: 28,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: BLACK,
  },

  // ACADEMY HEADER
  header: {
    marginBottom: 6,
  },

  brandingBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: BLUE,
    marginBottom: 7,
  },

  logo: {
    width: 90,
    height: 95,
    objectFit: "contain",
    marginBottom: 3,
  },

  academyHeader: {
    alignItems: "center",
    width: "100%",
  },

  academyName: {
    color: BLUE,
    fontSize: 19,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  tagline: {
    color: "#555555",
    fontSize: 9,
    fontStyle: "italic",
    marginTop: 1,
    textAlign: "center",
  },

  contact: {
    fontSize: 8,
    color: "#444444",
    marginTop: 1,
    textAlign: "center",
  },

  // PLAYER PROFILE HEADER
  profileRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    height: 88,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: BLUE,
  },

  playerPhotoColumn: {
    width: "25%",
    alignItems: "center",
    justifyContent: "center",
  },

  playerPhoto: {
    width: 76,
    height: 82,
    objectFit: "cover",
  },

  reportBlock: {
    width: "75%",
    paddingHorizontal: 8,
  },

  // Keep the report title and season in ONE text flow.
  // This avoids unexpected vertical separation between sibling Text nodes.
  reportHeading: {
    color: BLUE,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 12,
  },

  reportTitlePosition: {
    position: "absolute",
    left: "25%",
    right: 0,
    top: 24,
  },

  seasonInline: {
    color: BLUE,
    fontSize: 8,
    fontWeight: "bold",
    position: "absolute",
    left: "25%",
    right: 0,
    top: 38,
    textAlign: "center",
  },

  // PLAYER INFORMATION
  playerInfo: {
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    minHeight: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  infoRowLast: {
    flexDirection: "row",
    minHeight: 20,
  },

  infoCellLabel: {
    width: "17%",
    paddingHorizontal: 5,
    paddingVertical: 3,
    fontWeight: "bold",
    backgroundColor: "#f2f5f8",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },

  infoCellValue: {
    width: "33%",
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },

  infoCellValueLast: {
    width: "33%",
    paddingHorizontal: 5,
    paddingVertical: 3,
  },

  // EVALUATION SECTIONS
  section: {
    marginBottom: 7,
  },

  sectionTitle: {
    color: BLUE,
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: BLUE,
  },

  // SKILL TABLE
  table: {
    borderWidth: 1,
    borderColor: BORDER,
  },

  tableHeader: {
    flexDirection: "row",
    height: 23,
    backgroundColor: "#edf2f7",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    alignItems: "center",
  },

  tableRow: {
    flexDirection: "row",
    height: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  skillHeader: {
    width: "22%",
    paddingHorizontal: 5,
    paddingVertical: 3,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },

  skillCell: {
    width: "22%",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    justifyContent: "center",
  },

  ratingHeader: {
    width: "19.5%",
    paddingHorizontal: 2,
    paddingVertical: 2,
    textAlign: "center",
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    fontSize: 7,
  },

  ratingHeaderLast: {
    width: "19.5%",
    paddingHorizontal: 2,
    paddingVertical: 2,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 7,
  },

  ratingCell: {
    width: "19.5%",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  ratingCellLast: {
    width: "19.5%",
    alignItems: "center",
    justifyContent: "center",
  },

  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 0.8,
    borderColor: LIGHT_BLUE,
    alignItems: "center",
    justifyContent: "center",
  },

  // COACH COMMENT
  commentSection: {
    marginTop: 6,
    marginBottom: 8,
  },

  commentTitle: {
    color: BLUE,
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
  },

  commentBox: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 8,
    justifyContent: "center",
  },

  // OVERALL RATING
  bottomTable: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 4,
    minHeight: 88,
  },

  overallColumn: {
    width: "50%",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },

  coachColumn: {
    width: "50%",
  },

  bottomHeader: {
    fontWeight: "bold",
    fontSize: 9,
    padding: 7,
    backgroundColor: "#edf2f7",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  overallItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 9,
    marginTop: 5,
  },

  overallBox: {
    width: 8,
    height: 8,
    borderWidth: 0.8,
    borderColor: LIGHT_BLUE,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  coachName: {
    padding: 9,
    fontSize: 9,
  },

  // POWERED BY TOUCHLINE
  footer: {
    marginTop: 14,
    marginBottom: 8,
    textAlign: "center",
    color: "#777777",
    fontSize: 8,
  },
});

// RATING HELPERS
function getSkillRating(score: number | null | undefined) {
  const value = Number(score);

  if (!Number.isFinite(value)) return "Needs Improvement";
  if (value >= 9) return "Exceptional";
  if (value >= 7.5) return "Above Target";
  if (value >= 5) return "On Target";

  return "Needs Improvement";
}

function getOverallRating(score: number | null | undefined) {
  if (score == null) return null;

  if (score >= 9) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 5) return "Developing";

  return "Needs Improvement";
}

// CHECKBOX
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={styles.checkbox}>
      {checked && (
        <Svg width={7} height={7} viewBox="0 0 10 10">
          <Path
            d="M1 5.2 L3.8 8 L9 1.5"
            stroke={LIGHT_BLUE}
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </View>
  );
}

// SKILL TABLE
function SkillTable({ skills }: { skills: Record<string, number> }) {
  const entries = Object.entries(skills);

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.skillHeader}>Skill</Text>
        <Text style={styles.ratingHeader}>Needs{"\n"}Improvement</Text>
        <Text style={styles.ratingHeader}>On Target</Text>
        <Text style={styles.ratingHeader}>Above Target</Text>
        <Text style={styles.ratingHeaderLast}>Exceptional</Text>
      </View>

      {entries.map(([skill, rawScore], index) => {
        const rating = getSkillRating(rawScore);

        return (
          <View
            key={skill}
            style={[styles.tableRow, index === entries.length - 1 ? styles.lastRow : {}]}
          >
            <Text style={styles.skillCell}>{skill}</Text>

            <View style={styles.ratingCell}>
              <Checkbox checked={rating === "Needs Improvement"} />
            </View>

            <View style={styles.ratingCell}>
              <Checkbox checked={rating === "On Target"} />
            </View>

            <View style={styles.ratingCell}>
              <Checkbox checked={rating === "Above Target"} />
            </View>

            <View style={styles.ratingCellLast}>
              <Checkbox checked={rating === "Exceptional"} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// SKILL SECTION
function SkillSection({
  title,
  skills,
}: {
  title: string;
  skills: Record<string, number> | null | undefined;
}) {
  if (!skills || Object.keys(skills).length === 0) return null;

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <SkillTable skills={skills} />
    </View>
  );
}

// PDF PROPS
interface PlayerEvaluationPDFProps {
  player: Player;
  evaluation: Evaluation | null;
  coachName: string;

  academyName?: string;
  academySlug?: string;
  academyTagline?: string;
  academyEmail?: string;
  academyPhone?: string;

  playerPhotoUrl?: string | null;
  logoUrl?: string | null;

  season?: string;
  seasonYear?: string | number;
}

// MAIN PDF COMPONENT
export function PlayerEvaluationPDF({
  player,
  evaluation,
  coachName,

  academyName = "",
  academySlug = "",
  academyTagline = "",
  academyEmail = "",
  academyPhone = "",

  playerPhotoUrl,
  logoUrl = null,

  season = "",
  seasonYear,
}: PlayerEvaluationPDFProps) {
  const age = calculateAge(player.date_of_birth);

  const overallRating = getOverallRating(evaluation?.overall_rating);

  // Get season and year dynamically.
  const seasonLabel = String(evaluation?.season || season || "").trim();

  const extractedYear = seasonLabel.match(/\b20\d{2}\b/)?.[0] || "";

  const yearLabel = String(evaluation?.season_year || seasonYear || extractedYear || "").trim();

  // Remove an existing year to prevent duplication.
  const seasonWithoutYear = seasonLabel
    .replace(/\b20\d{2}\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[,:\-\s]+$/, "");

  const seasonPrefix = seasonWithoutYear
    ? /^season\b/i.test(seasonWithoutYear)
      ? seasonWithoutYear
      : `Season ${seasonWithoutYear}`
    : "";

  const seasonDisplay = [seasonPrefix, yearLabel].filter(Boolean).join(" ");

  const hasEvaluation = evaluation !== null;

  return (
    <Document
      title={`Player Evaluation - ${player.first_name} ${player.last_name}`}
      author={academyName}
      subject="Player Evaluation & Development Profile"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* ACADEMY BRANDING */}
        <View style={styles.header}>
          <View style={styles.brandingBlock} wrap={false}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}

            <View style={styles.academyHeader}>
              {academyName && <Text style={styles.academyName}>{academyName.toUpperCase()}</Text>}

              {academyTagline && <Text style={styles.tagline}>{academyTagline}</Text>}

              {academySlug && <Text style={styles.contact}>Slug: {academySlug}</Text>}

              {academyEmail && <Text style={styles.contact}>Email: {academyEmail}</Text>}

              {academyPhone && <Text style={styles.contact}>Phone: {academyPhone}</Text>}
            </View>
          </View>

          {/* PLAYER PHOTO AND REPORT TITLE */}
          <View style={styles.profileRow} wrap={false}>
            <View style={styles.playerPhotoColumn}>
              {playerPhotoUrl && <Image src={playerPhotoUrl} style={styles.playerPhoto} />}
            </View>

            <View style={styles.reportBlock} />
            <Text style={[styles.reportHeading, styles.reportTitlePosition]}>
              PLAYER EVALUATION &amp; DEVELOPMENT PROFILE
            </Text>
            {seasonDisplay ? <Text style={styles.seasonInline}>{seasonDisplay}</Text> : null}
          </View>
        </View>

        {/* PLAYER INFORMATION */}
        <View style={styles.playerInfo} wrap={false}>
          <View style={styles.infoRow}>
            <Text style={styles.infoCellLabel}>Player Name</Text>

            <Text style={styles.infoCellValue}>
              {player.first_name} {player.last_name}
            </Text>

            <Text style={styles.infoCellLabel}>Age</Text>

            <Text style={styles.infoCellValueLast}>{age ?? "-"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoCellLabel}>Jersey No.</Text>

            <Text style={styles.infoCellValue}>{player.jersey_number ?? "-"}</Text>

            <Text style={styles.infoCellLabel}>Position</Text>

            <Text style={styles.infoCellValueLast}>{player.position ?? "-"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoCellLabel}>Category/Team</Text>

            <Text style={styles.infoCellValue}>{player.team_category ?? "—"}</Text>

            <Text style={styles.infoCellLabel}>Strong foot</Text>

            <Text style={styles.infoCellValueLast}>{player.preferred_foot ?? "-"}</Text>
          </View>

          <View style={styles.infoRowLast}>
            <Text style={styles.infoCellLabel}>DOB</Text>

            <Text style={styles.infoCellValue}>
              {player.date_of_birth
                ? new Date(player.date_of_birth).toLocaleDateString("en-GB")
                : "-"}
            </Text>

            <Text style={styles.infoCellLabel}>Coach</Text>

            <Text style={styles.infoCellValueLast}>{coachName}</Text>
          </View>
        </View>

        {/* FIRST-PAGE EVALUATION SECTIONS */}
        {hasEvaluation && evaluation ? (
          <>
            <SkillSection title="Technical Ability" skills={evaluation.technical_skills} />
            <SkillSection title="Tactical Awareness" skills={evaluation.tactical_skills} />
          </>
        ) : (
          <View style={styles.commentBox} wrap={false}>
            <Text>No saved evaluation is available for this player.</Text>
          </View>
        )}
      </Page>

      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* SECOND-PAGE EVALUATION SECTIONS */}
        {hasEvaluation && evaluation ? (
          <>
            <SkillSection title="Physical Attributes" skills={evaluation.physical_skills} />
            <SkillSection title="Personality Traits" skills={evaluation.personality_skills} />

            {/* COACH COMMENT */}
            <View style={styles.commentSection} wrap={false}>
              <Text style={styles.commentTitle}>Coach's Overall Comment</Text>

              <View style={styles.commentBox}>
                <Text>
                  {evaluation.coach_notes || evaluation.coach_verdict || "No comment recorded."}
                </Text>
              </View>
            </View>

            {/* OVERALL RATING AND COACH */}
            <View style={styles.bottomTable} wrap={false}>
              <View style={styles.overallColumn}>
                <Text style={styles.bottomHeader}>Overall Rating</Text>

                {["Needs Improvement", "Developing", "Good", "Excellent"].map((rating) => (
                  <View key={rating} style={styles.overallItem}>
                    <View style={styles.overallBox}>
                      {overallRating === rating && (
                        <Svg width={7} height={7} viewBox="0 0 10 10">
                          <Path
                            d="M1 5.2 L3.8 8 L9 1.5"
                            stroke={LIGHT_BLUE}
                            strokeWidth={1.5}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      )}
                    </View>

                    <Text>{rating}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.coachColumn}>
                <Text style={styles.bottomHeader}>Coach's Name</Text>

                <Text style={styles.coachName}>{coachName}</Text>
              </View>
            </View>
          </>
        ) : null}

        {/* POWERED BY TOUCHLINE - BELOW EVALUATION */}
        <Text style={styles.footer}>Powered by Touchline</Text>
      </Page>
    </Document>
  );
}

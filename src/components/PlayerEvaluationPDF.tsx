import { Document, Image, Page, Path, Svg, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Evaluation, Player } from "@/lib/types";
import { SKILL_CATEGORIES, calculateAge } from "@/lib/skills";

const BLUE = "#1f4e79";
const LIGHT_BLUE = "#18a9d8";
const BLACK = "#111111";
const BORDER = "#111111";

const styles = StyleSheet.create({
  page: {
    width: "100%",
    paddingTop: 18,
    paddingBottom: 16,
    paddingLeft: 20,
    paddingRight: 20,
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: BLACK,
  },

  /* =========================
     HEADER
  ========================= */

  header: {
    height: 166,
    marginBottom: 7,
  },

  /*
   * TOUCHLINE MARK
   * Completely independent from the
   * academy text and centered at the top.
   */
  logo: {
    width: 54,
    height: 54,
    objectFit: "contain",
  },

  brandingBlock: {
    height: 76,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: BLUE,
  },

  profileRow: {
    height: 84,
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: BLUE,
    paddingBottom: 5,
  },

  playerPhotoColumn: {
    width: "28%",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  playerPhoto: {
    width: 76,
    height: 76,
    objectFit: "cover",
  },

  academyHeader: {
    width: "100%",
    alignItems: "center",
  },

  academyName: {
    color: BLUE,
    fontSize: 13.5,
    fontWeight: "bold",
    letterSpacing: 0.3,
    textAlign: "center",
    lineHeight: 13,
  },

  tagline: {
    color: "#555555",
    fontSize: 8,
    fontStyle: "italic",
    marginTop: 1,
    lineHeight: 8,
  },

  contact: {
    fontSize: 7.5,
    marginTop: 1,
    lineHeight: 8,
  },

  academySlug: {
    color: "#555555",
    fontSize: 7,
    marginTop: 1,
    lineHeight: 8,
  },

  reportBlock: {
    width: "72%",
    paddingLeft: 10,
    paddingRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  reportTitle: {
    color: BLUE,
    fontSize: 10.5,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 12,
    maxWidth: 330,
  },

  season: {
    color: BLUE,
    fontSize: 8.5,
    fontWeight: "bold",
    lineHeight: 9,
    marginTop: 2,
  },

  /* =========================
     PLAYER INFORMATION
  ========================= */

  playerInfo: {
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 10,
    marginBottom: 7,
  },

  infoRow: {
    flexDirection: "row",
    minHeight: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  infoRowLast: {
    flexDirection: "row",
    minHeight: 16,
  },

  infoCellLabel: {
    width: "17%",
    paddingLeft: 4,
    paddingTop: 2,
    paddingBottom: 2,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },

  infoCellValue: {
    width: "33%",
    paddingLeft: 4,
    paddingTop: 2,
    paddingBottom: 2,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },

  infoCellValueLast: {
    width: "33%",
    paddingLeft: 4,
    paddingTop: 2,
    paddingBottom: 2,
  },

  /* =========================
     SECTIONS
  ========================= */

  section: {
    marginBottom: 5,
  },

  sectionTitle: {
    color: BLUE,
    fontSize: 9.5,
    fontWeight: "bold",
    marginBottom: 2,
  },

  /* =========================
     TABLE
  ========================= */

  table: {
    borderWidth: 1,
    borderColor: BORDER,
  },

  tableHeader: {
    flexDirection: "row",
    minHeight: 25,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  tableRow: {
    flexDirection: "row",
    minHeight: 14.5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  skillHeader: {
    width: "22%",
    paddingLeft: 4,
    paddingTop: 3,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },

  skillCell: {
    width: "22%",
    paddingLeft: 4,
    paddingTop: 2,
    paddingBottom: 2,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    justifyContent: "center",
  },

  ratingHeader: {
    width: "19.5%",
    paddingTop: 3,
    paddingLeft: 2,
    paddingRight: 2,
    textAlign: "center",
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },

  ratingHeaderLast: {
    width: "19.5%",
    paddingTop: 3,
    paddingLeft: 2,
    paddingRight: 2,
    textAlign: "center",
    fontWeight: "bold",
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
    width: 8,
    height: 8,
    borderWidth: 0.8,
    borderColor: LIGHT_BLUE,
    alignItems: "center",
    justifyContent: "center",
  },

  checkText: {
    color: LIGHT_BLUE,
    fontSize: 7,
    fontWeight: "bold",
    lineHeight: 6,
    marginTop: -1,
  },

  /* =========================
     BOTTOM SECTION
  ========================= */

  commentTitle: {
    color: BLUE,
    fontSize: 9.5,
    fontWeight: "bold",
    marginBottom: 3,
  },

  commentBox: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 7,
  },

  bottomTable: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 8,
    minHeight: 65,
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
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  overallItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 6,
    marginTop: 4,
  },

  overallBox: {
    width: 7,
    height: 7,
    borderWidth: 0.8,
    borderColor: LIGHT_BLUE,
    marginRight: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  coachName: {
    padding: 6,
  },

  footer: {
    textAlign: "center",
    color: "#777777",
    fontSize: 6.5,
    marginTop: 5,
  },
});

function getSkillRating(score: number | null | undefined) {
  const value = Number(score);

  if (!Number.isFinite(value)) {
    return "Needs Improvement";
  }

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

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={styles.checkbox}>
      {checked && (
        <Svg width={6} height={6} viewBox="0 0 10 10">
          <Path
            d="M1 5.2 L3.8 8 L9 1.5"
            stroke="#18a9d8"
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
        const score = Number(rawScore);
        const rating = getSkillRating(score);
        const isLast = index === entries.length - 1;

        return (
          <View key={skill} style={[styles.tableRow, isLast ? styles.lastRow : {}]}>
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

function SkillSection({
  title,
  skills,
}: {
  title: string;
  skills: Record<string, number> | null | undefined;
}) {
  if (!skills) return null;

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <SkillTable skills={skills} />
    </View>
  );
}

interface PlayerEvaluationPDFProps {
  player: Player;
  evaluation: Evaluation | null;
  coachName: string;
  academyName: string;
  academySlug?: string;
  academyTagline?: string;
  academyEmail?: string;
  academyPhone?: string;
  playerPhotoUrl?: string | null;
  logoUrl?: string | null;
  season?: string;
}

export function PlayerEvaluationPDF({
  player,
  evaluation,
  coachName,
  academyName,
  academySlug = "",
  academyTagline = "Transforming Lives Through Football",
  academyEmail = "",
  academyPhone = "",
  playerPhotoUrl,
  logoUrl = null,
  season = "Season 8: May-August 2026",
}: PlayerEvaluationPDFProps) {
  const age = calculateAge(player.date_of_birth);
  const overallRating = getOverallRating(evaluation?.overall_rating);

  const activeSeason = evaluation
    ? `${evaluation.season} ${evaluation.season_year}`
    : player.season || season;

  return (
    <Document
      title={`Player Evaluation - ${player.first_name} ${player.last_name}`}
      author={academyName}
      subject="Player Evaluation & Development Profile"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brandingBlock}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View style={styles.academyHeader}>
              <Text style={styles.academyName}>{academyName.toUpperCase()}</Text>
              {academyTagline && <Text style={styles.tagline}>{academyTagline}</Text>}
              {academyEmail && <Text style={styles.contact}>Email: {academyEmail}</Text>}
              {academyPhone && <Text style={styles.contact}>Phone: {academyPhone}</Text>}
            </View>
          </View>

          <View style={styles.profileRow}>
            <View style={styles.playerPhotoColumn}>
              {playerPhotoUrl && <Image src={playerPhotoUrl} style={styles.playerPhoto} />}
            </View>

            <View style={styles.reportBlock}>
              <Text style={styles.reportTitle}>
                PLAYER EVALUATION &amp; DEVELOPMENT
                {"\n"}
                PROFILE
              </Text>
              <Text style={styles.season}>Season: {activeSeason}</Text>
            </View>
          </View>
        </View>

        {/* PLAYER INFORMATION */}
        <View style={styles.playerInfo}>
          {/* ROW 1 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoCellLabel}>Player Name</Text>

            <Text style={styles.infoCellValue}>
              {player.first_name} {player.last_name}
            </Text>

            <Text style={styles.infoCellLabel}>Age</Text>

            <Text style={styles.infoCellValueLast}>{age ?? "-"}</Text>
          </View>

          {/* ROW 2 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoCellLabel}>Jersey No.</Text>

            <Text style={styles.infoCellValue}>{player.jersey_number ?? "-"}</Text>

            <Text style={styles.infoCellLabel}>Position</Text>

            <Text style={styles.infoCellValueLast}>{player.position ?? "-"}</Text>
          </View>

          {/* ROW 3 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoCellLabel}>Category/Team</Text>

            <Text style={styles.infoCellValue}>{player.team_category ?? "—"}</Text>

            <Text style={styles.infoCellLabel}>Strong foot</Text>

            <Text style={styles.infoCellValueLast}>{player.preferred_foot ?? "-"}</Text>
          </View>

          {/* ROW 4 */}
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

        {/* TECHNICAL */}
        <SkillSection title="Technical Ability" skills={evaluation?.technical_skills} />

        {/* TACTICAL */}
        <SkillSection title="Tactical Awareness" skills={evaluation?.tactical_skills} />

        {/* PHYSICAL */}
        <SkillSection title="Physical Attributes" skills={evaluation?.physical_skills} />

        {/* PERSONALITY */}
        <SkillSection title="Personality Traits" skills={evaluation?.personality_skills} />

        {/* COACH COMMENT */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.commentTitle}>Coach's Overall Comment</Text>

          <View style={styles.commentBox}>
            <Text>
              {evaluation?.coach_notes || evaluation?.coach_verdict || "No comment recorded."}
            </Text>
          </View>
        </View>

        {/* OVERALL RATING + COACH */}
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
                        stroke="#18a9d8"
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

        {/* FOOTER */}
        <Text style={styles.footer}>Powered by Touchline</Text>
      </Page>
    </Document>
  );
}

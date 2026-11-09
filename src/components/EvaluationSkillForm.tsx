import { SKILL_CATEGORIES, type SkillCategoryKey, type SkillState } from "@/lib/skills";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { averageScore } from "@/lib/skills";

interface Props {
  skills: SkillState;
  onChange: (next: SkillState) => void;
  categories?: SkillCategoryKey[];
}

export function EvaluationSkillForm({ skills, onChange, categories }: Props) {
  const shown = SKILL_CATEGORIES.filter((c) => !categories || categories.includes(c.key));

  const setSkill = (category: SkillCategoryKey, skill: string, value: number) => {
    onChange({
      ...skills,
      [category]: { ...skills[category], [skill]: value },
    });
  };

  return (
    <div className="grid gap-5">
      {shown.map((category) => (
        <Card key={category.key} className="bg-gradient-panel border-border/70">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="font-display text-base tracking-wide uppercase">
              {category.label}
            </CardTitle>
            <span className="bg-primary/15 text-primary rounded-full px-3 py-1 text-xs font-semibold">
              Avg {averageScore(skills[category.key]).toFixed(1)}/10
            </span>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {category.skills.map((skill) => {
              const value = skills[category.key][skill] ?? 5;
              return (
                <div key={skill}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="text-sm font-medium">{skill}</label>
                    <span className="text-primary font-display text-sm">{value}</span>
                  </div>
                  <Slider
                    value={[value]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(v) => setSkill(category.key, skill, v[0] ?? 5)}
                    aria-label={skill}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

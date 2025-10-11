import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Zap, Flame } from "lucide-react";

interface DifficultySelectorProps {
  selectedDifficulty: string;
  onSelect: (difficulty: string) => void;
}

const DIFFICULTIES = [
  {
    value: "Easy",
    label: "Easy",
    description: "Surface-level objections, 3 rebuttals needed",
    icon: TrendingUp,
    color: "text-success",
  },
  {
    value: "Moderate",
    label: "Moderate",
    description: "Bot cites evidence (may misuse it), 1+ citation required",
    icon: Target,
    color: "text-primary",
  },
  {
    value: "Hard",
    label: "Hard",
    description: "Cherry-picking arguments, 2+ citations, explain mechanisms",
    icon: Zap,
    color: "text-warning",
  },
  {
    value: "Extreme",
    label: "Extreme",
    description: "Gish gallop, multi-domain rebuttals, 3+ citations required",
    icon: Flame,
    color: "text-destructive",
  },
];

export const DifficultySelector = ({ selectedDifficulty, onSelect }: DifficultySelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Difficulty</CardTitle>
        <CardDescription>Higher difficulties require stronger evidence and reasoning</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedDifficulty} onValueChange={onSelect}>
          <div className="space-y-3">
            {DIFFICULTIES.map((diff) => {
              const Icon = diff.icon;
              return (
                <div key={diff.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={diff.value} id={diff.value} className="mt-1" />
                  <Label htmlFor={diff.value} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${diff.color}`} />
                      <span className="font-semibold">{diff.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{diff.description}</p>
                  </Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

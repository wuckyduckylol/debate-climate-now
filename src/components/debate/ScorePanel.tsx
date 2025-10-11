import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TurnScores } from "@/lib/scoring";
import { getColorForBSI } from "@/lib/scoring";

interface ScorePanelProps {
  latestScores?: TurnScores;
  rollingBSI: number;
  turnCount: number;
}

export const ScorePanel = ({ latestScores, rollingBSI, turnCount }: ScorePanelProps) => {
  const bsiPercent = Math.round(rollingBSI * 100);
  const bsiColor = getColorForBSI(rollingBSI);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Belief Shift Index</CardTitle>
          <Badge variant={bsiColor === 'success' ? 'default' : 'secondary'} className={`
            ${bsiColor === 'success' && 'bg-success text-success-foreground'}
            ${bsiColor === 'secondary' && 'bg-secondary text-secondary-foreground'}
            ${bsiColor === 'warning' && 'bg-warning text-warning-foreground'}
            ${bsiColor === 'destructive' && 'bg-destructive text-destructive-foreground'}
          `}>
            Turn {turnCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Convinced</span>
            <span className="font-bold text-lg">{bsiPercent}%</span>
          </div>
          <Progress value={bsiPercent} className="h-3 animate-belief-shift" />
        </div>

        {latestScores && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Evidence Quality</span>
                <span className="font-medium">{Math.round(latestScores.evidence * 100)}%</span>
              </div>
              <Progress value={latestScores.evidence * 100} className="h-1.5" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Logic Integrity</span>
                <span className="font-medium">{Math.round(latestScores.logic * 100)}%</span>
              </div>
              <Progress value={latestScores.logic * 100} className="h-1.5" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tone/Ethos</span>
                <span className="font-medium">{Math.round(latestScores.tone * 100)}%</span>
              </div>
              <Progress value={latestScores.tone * 100} className="h-1.5" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cross-Disciplinary</span>
                <span className="font-medium">{Math.round(latestScores.crossDisciplinary * 100)}%</span>
              </div>
              <Progress value={latestScores.crossDisciplinary * 100} className="h-1.5" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Plus } from "lucide-react";

export interface Evidence {
  id: string;
  title: string;
  source: string;
  source_url?: string;
  evidence_type: string;
  summary: string;
  key_claim: string;
  tags: string[];
  snippet?: string;
}

interface EvidenceLockerProps {
  evidence: Evidence[];
  selectedEvidence: string[];
  onToggle: (evidenceId: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  graph: "bg-primary/10 text-primary border-primary/20",
  report: "bg-secondary/10 text-secondary border-secondary/20",
  mechanism: "bg-accent/10 text-accent border-accent/20",
  analysis: "bg-warning/10 text-warning border-warning/20",
};

export const EvidenceLocker = ({ evidence, selectedEvidence, onToggle }: EvidenceLockerProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-secondary" />
          <CardTitle className="text-lg">Evidence Locker</CardTitle>
        </div>
        <CardDescription>Select evidence to cite in your argument</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {evidence.map((item) => {
              const isSelected = selectedEvidence.includes(item.id);
              
              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-3 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm leading-tight mb-1">{item.title}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={TYPE_COLORS[item.evidence_type] || ""}>
                          {item.evidence_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.source}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => onToggle(item.id)}
                      className="shrink-0"
                    >
                      {isSelected ? (
                        <span className="text-xs">✓ Cited</span>
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {item.summary}
                  </p>

                  {item.snippet && (
                    <div className="bg-muted/50 rounded p-2 text-xs font-mono">
                      {item.snippet}
                    </div>
                  )}

                  {item.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

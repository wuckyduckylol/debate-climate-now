import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export interface Persona {
  id: string;
  name: string;
  persona_type: string;
  description: string;
  tone: string;
  scripts: string[];
}

interface PersonaSelectorProps {
  personas: Persona[];
  selectedPersonaId: string | null;
  onSelect: (personaId: string) => void;
}

const PERSONA_COLORS: Record<string, string> = {
  Denier: "bg-destructive text-destructive-foreground",
  Doubter: "bg-warning text-warning-foreground",
  Naïve: "bg-accent text-accent-foreground",
  Cynic: "bg-muted text-muted-foreground",
  Zealot: "bg-primary text-primary-foreground",
};

export const PersonaSelector = ({ personas, selectedPersonaId, onSelect }: PersonaSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Opponent</CardTitle>
        <CardDescription>Select which Mr. Moneymaker persona to debate</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedPersonaId || undefined} onValueChange={onSelect}>
          <div className="space-y-3">
            {personas.map((persona) => (
              <div key={persona.id} className="flex items-start space-x-3">
                <RadioGroupItem value={persona.id} id={persona.id} className="mt-1" />
                <Label htmlFor={persona.id} className="flex-1 cursor-pointer">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{persona.name}</span>
                      <Badge className={PERSONA_COLORS[persona.persona_type] || "bg-muted"}>
                        {persona.persona_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{persona.description}</p>
                    <p className="text-xs text-muted-foreground italic">Tone: {persona.tone}</p>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

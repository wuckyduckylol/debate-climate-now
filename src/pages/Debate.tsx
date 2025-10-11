import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PersonaSelector } from "@/components/debate/PersonaSelector";
import { DifficultySelector } from "@/components/debate/DifficultySelector";
import { ChatMessages, Message } from "@/components/debate/ChatMessages";
import { ChatInput } from "@/components/debate/ChatInput";
import { EvidenceLocker, Evidence } from "@/components/debate/EvidenceLocker";
import { ScorePanel } from "@/components/debate/ScorePanel";
import { calculateBSI, updateRollingBSI, checkPassCriteria, TurnScores } from "@/lib/scoring";
import { ArrowLeft } from "lucide-react";

const Debate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [personas, setPersonas] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"Easy" | "Moderate" | "Hard" | "Extreme">("Easy");
  const [debateStarted, setDebateStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [rollingBSI, setRollingBSI] = useState(0);
  const [latestScores, setLatestScores] = useState<TurnScores | undefined>();
  const [debateId, setDebateId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const [personasRes, evidenceRes] = await Promise.all([
        supabase.from("personas").select("*"),
        supabase.from("evidence_packets").select("*")
      ]);
      
      if (personasRes.data) {
        console.log("Loaded personas:", personasRes.data);
        setPersonas(personasRes.data);
      }
      if (evidenceRes.data) {
        console.log("Loaded evidence:", evidenceRes.data.length, "packets");
        setEvidence(evidenceRes.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error loading data", description: "Please refresh the page", variant: "destructive" });
    } finally {
      setDataLoading(false);
    }
  };

  const startDebate = async () => {
    if (!selectedPersonaId) {
      toast({ title: "Please select a persona", variant: "destructive" });
      return;
    }

    const { data: debate } = await supabase
      .from("debates")
      .insert([{
        persona_id: selectedPersonaId,
        difficulty,
      }])
      .select()
      .single();

    if (debate) {
      setDebateId(debate.id);
      setDebateStarted(true);
      setMessages([]);
      setRollingBSI(0);
      toast({ title: "Debate started!", description: "Make your first argument." });
    }
  };

  const sendMessage = async (content: string) => {
    if (!debateId) return;
    setLoading(true);

    const selectedEvidenceData = evidence.filter(e => selectedEvidence.includes(e.id));
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      citations: selectedEvidenceData,
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const persona = personas.find(p => p.id === selectedPersonaId);
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          persona,
          difficulty,
          evidencePackets: evidence,
        },
      });

      if (error) throw error;

      const scores = data.scores;
      userMsg.scores = scores;
      
      const bsi = calculateBSI(scores, difficulty);
      const newRolling = updateRollingBSI(rollingBSI, bsi);
      setRollingBSI(newRolling);
      setLatestScores(scores);

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
      };

      setMessages(prev => [...prev.slice(0, -1), userMsg, assistantMsg]);

      const passCheck = checkPassCriteria(difficulty, newRolling, messages.length + 1, {
        citationCount: selectedEvidence.length,
      });

      if (passCheck.passed) {
        await supabase.from("debates").update({ result: "passed", final_bsi: newRolling }).eq("id", debateId);
        toast({ title: "🎉 You convinced Mr. Moneymaker!", description: "Debate passed!", variant: "default" });
      }

      setSelectedEvidence([]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          {!debateStarted ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">Convince Mr. Moneymaker</h1>
                <p className="text-muted-foreground">Select your opponent and difficulty</p>
              </div>
              {dataLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="mt-4 text-muted-foreground">Loading personas and evidence...</p>
                </div>
              ) : (
                <>
                  <PersonaSelector personas={personas} selectedPersonaId={selectedPersonaId} onSelect={setSelectedPersonaId} />
                  <DifficultySelector selectedDifficulty={difficulty} onSelect={setDifficulty} />
                  <Button onClick={startDebate} size="lg" className="w-full">Start Debate</Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-card border rounded-lg shadow-md h-[600px] flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <ChatMessages messages={messages} personaName={personas.find(p => p.id === selectedPersonaId)?.name || "Mr. Moneymaker"} />
                  </div>
                  <ChatInput onSend={sendMessage} disabled={loading} />
                </div>
              </div>
              <div className="space-y-4">
                <ScorePanel latestScores={latestScores} rollingBSI={rollingBSI} turnCount={Math.floor(messages.length / 2)} />
                <EvidenceLocker evidence={evidence} selectedEvidence={selectedEvidence} onToggle={(id) => setSelectedEvidence(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])} />
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default Debate;

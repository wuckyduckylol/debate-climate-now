import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zlgxgnradjjjcwfznehr.supabase.co';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ3hnbnJhZGpqamN3ZnpuZWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTYyMzIsImV4cCI6MjA3NTY5MjIzMn0.Mv1ZXHMbat06WgFKtOyVPXNYlLJCoyUstbib7E1jH8M';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, persona, difficulty, evidencePackets } = await req.json();
    console.log("Chat request:", { persona: persona.name, difficulty, messageCount: messages.length });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt based on persona and difficulty
    const systemPrompt = buildSystemPrompt(persona, difficulty, evidencePackets);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage quota exceeded. Please contact your instructor." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Calculate scores for the user's last message
    const lastUserMessage = messages[messages.length - 1];
    const scores = await calculateScores(lastUserMessage.content, difficulty, lastUserMessage.citations || []);

    console.log("Response generated, scores:", scores);

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        scores,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildSystemPrompt(persona: any, difficulty: string, evidencePackets: any[]): string {
  const scripts = persona.scripts.join("\n- ");
  const evidenceInfo = evidencePackets.length > 0
    ? `\n\nAvailable evidence packets that the student may cite:\n${evidencePackets.map((e) => `- ${e.title}: ${e.summary}`).join("\n")}`
    : "";

  let difficultyInstructions = "";
  switch (difficulty) {
    case "Easy":
      difficultyInstructions = "Use simple, surface-level objections. Don't demand citations. Be fairly easy to convince with basic logic.";
      break;
    case "Moderate":
      difficultyInstructions = "Reference evidence packets (you may slightly misinterpret them). Demand at least one credible source. Be moderately skeptical.";
      break;
    case "Hard":
      difficultyInstructions = "Cherry-pick from evidence, demand specific units/years/mechanisms. Push back on vague claims. Only concede with strong multi-source arguments.";
      break;
    case "Extreme":
      difficultyInstructions = "Use gish gallop tactics, advanced pseudo-science. Demand rigorous multi-domain evidence with mechanisms explained. Be very hard to convince.";
      break;
  }

  return `You are MR. MONEYMAKER (${persona.persona_type} persona), a confident climate skeptic.

PERSONA DESCRIPTION: ${persona.description}
TONE: ${persona.tone}

DIFFICULTY: ${difficulty}
INSTRUCTIONS FOR THIS DIFFICULTY: ${difficultyInstructions}

YOUR TYPICAL ARGUMENTS:
- ${scripts}
${evidenceInfo}

RULES:
• Stay in character as ${persona.persona_type} Mr. Moneymaker
• Do not fabricate citations or data
• When the student provides strong evidence and reasoning, gradually shift your position (depending on difficulty)
• Always end with a probing question or challenge
• Keep responses concise (3-4 sentences max)
• Be charismatic and engaging, not abusive
• On higher difficulties, escalate with multi-claim pushes

Remember: Your goal is to defend your position but be convinceable with strong evidence and logic appropriate to the difficulty level.`;
}

async function calculateScores(
  userMessage: string,
  difficulty: string,
  citations: any[]
): Promise<any> {
  // Simple heuristic-based scoring
  // In a production system, you'd use a more sophisticated LLM-based evaluation

  const messageLower = userMessage.toLowerCase();
  
  // Evidence quality: check for citations, sources, data
  let evidenceScore = 0.3; // base score
  if (citations && citations.length > 0) evidenceScore += 0.3;
  if (messageLower.includes("nasa") || messageLower.includes("noaa") || messageLower.includes("ipcc")) evidenceScore += 0.2;
  if (/\d+\s*(ppm|°c|degrees|percent|%)/.test(messageLower)) evidenceScore += 0.2; // contains units/numbers
  evidenceScore = Math.min(1.0, evidenceScore);

  // Logic integrity: check for structure, reasoning words
  let logicScore = 0.4;
  if (messageLower.includes("because") || messageLower.includes("therefore") || messageLower.includes("this shows")) logicScore += 0.2;
  if (messageLower.includes("evidence") || messageLower.includes("data") || messageLower.includes("research")) logicScore += 0.2;
  if (messageLower.includes("mechanism") || messageLower.includes("how") || messageLower.includes("why")) logicScore += 0.2;
  logicScore = Math.min(1.0, logicScore);

  // Tone: check for respectful language (penalize ad hominem)
  let toneScore = 0.7;
  if (messageLower.includes("you're wrong") || messageLower.includes("stupid") || messageLower.includes("idiot")) toneScore -= 0.3;
  if (messageLower.includes("i understand") || messageLower.includes("respectfully") || messageLower.includes("however")) toneScore += 0.2;
  toneScore = Math.max(0.0, Math.min(1.0, toneScore));

  // Cross-disciplinary: detect different domains
  let domains = 0;
  if (messageLower.includes("physics") || messageLower.includes("greenhouse") || messageLower.includes("radiation")) domains++;
  if (messageLower.includes("biology") || messageLower.includes("ecosystem") || messageLower.includes("species")) domains++;
  if (messageLower.includes("econom") || messageLower.includes("cost") || messageLower.includes("gdp")) domains++;
  if (messageLower.includes("ethic") || messageLower.includes("moral") || messageLower.includes("justice")) domains++;
  const crossDisciplinaryScore = Math.min(1.0, domains * 0.3);

  return {
    evidence: Math.round(evidenceScore * 100) / 100,
    logic: Math.round(logicScore * 100) / 100,
    tone: Math.round(toneScore * 100) / 100,
    crossDisciplinary: Math.round(crossDisciplinaryScore * 100) / 100,
  };
}

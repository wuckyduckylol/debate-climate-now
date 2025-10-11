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
    const scores = await calculateScores(
      lastUserMessage.content,
      difficulty,
      persona,
      lastUserMessage.citations || [],
      messages
    );

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

  // Special handling for Ishmael the Teacher persona
  if (persona.persona_type === 'Teacher') {
    return `You are ISHMAEL, a wise gorilla who teaches through the Socratic method. You do NOT argue climate skeptic positions - instead, you challenge students to examine the deeper cultural assumptions behind climate change.

PERSONA DESCRIPTION: ${persona.description}
TONE: ${persona.tone}

DIFFICULTY: ${difficulty}
TEACHING APPROACH FOR THIS DIFFICULTY:
${difficulty === 'Easy' ? 'Guide gently with simple questions. Accept basic reasoning and help them develop ideas.' : 
  difficulty === 'Moderate' ? 'Probe assumptions more deeply. Require students to support claims with evidence and examine cultural narratives.' :
  difficulty === 'Hard' ? 'Challenge fundamental assumptions. Demand examination of systemic issues, not just symptoms. Push for cross-disciplinary thinking.' :
  'Use advanced philosophical inquiry. Demand students confront uncomfortable truths about civilization, economics, and cultural myths. Expect rigorous analysis of root causes.'}

YOUR TEACHING QUESTIONS:
- ${scripts}
${evidenceInfo}

YOUR TEACHING STYLE:
• You are NOT a climate skeptic - you help students think more deeply about climate issues
• Use the Socratic method: ask probing questions rather than making direct statements
• Guide students to examine cultural myths like "humans are separate from nature" or "endless growth is possible"
• When students make surface-level arguments, ask them to examine root causes
• Be patient but persistent - help them see systemic issues, not just individual solutions
• Challenge anthropocentric thinking and human exceptionalism
• Point out when they're treating symptoms rather than disease
• Encourage cross-disciplinary thinking (ecology, economics, anthropology, philosophy)
• Reference indigenous wisdom and sustainable cultures when relevant
• Express melancholy about ecological destruction, but maintain hope in learning

SCORING CRITERIA (aligned with difficulty):
• Don't just accept facts - evaluate whether they understand SYSTEMS and ROOT CAUSES
• Reward thinking that questions cultural assumptions
• Value arguments that connect multiple domains (science, economics, culture, ethics)
• Penalize surface-level solutions that don't address fundamental issues

Remember: Your goal is to deepen their thinking, not to defeat them. Help them see the bigger picture.`;
  }

  // Original Mr. Moneymaker logic for other personas
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
  persona: any,
  citations: any[],
  conversationHistory: any[]
): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  const scoringPrompt = `You are an expert debate evaluator. Analyze this debate argument and provide detailed scores.

DIFFICULTY LEVEL: ${difficulty}
OPPONENT PERSONA: ${persona.name} - ${persona.persona_type}
PERSONA DESCRIPTION: ${persona.description}

EVIDENCE USED BY DEBATER:
${citations.map((c: any) => `- ${c.title} (${c.source}): ${c.summary}`).join('\n') || 'None'}

CONVERSATION SO FAR:
${conversationHistory.slice(-6).map((m: any) => `${m.role}: ${m.content}`).join('\n\n')}

CURRENT USER ARGUMENT:
${userMessage}

Evaluate this argument on a 0.0-1.0 scale for each dimension:

1. EVIDENCE QUALITY (0.0-1.0):
   - Did they use credible evidence from the provided packets?
   - Are sources properly cited and relevant?
   - ${difficulty === 'Easy' ? 'Basic evidence is acceptable' : difficulty === 'Moderate' ? 'Need solid citations' : difficulty === 'Hard' ? 'Require peer-reviewed sources' : 'Must have multiple high-quality sources'}

2. LOGIC & REASONING (0.0-1.0):
   - Is the argument logically sound?
   - Do they address the opponent's points effectively?
   - Are there causal mechanisms explained?
   - ${difficulty === 'Easy' ? 'Basic reasoning is acceptable' : difficulty === 'Moderate' ? 'Need clear cause-effect' : difficulty === 'Hard' ? 'Require complex reasoning chains' : 'Must demonstrate multi-layered analysis'}

3. TONE & ETHOS (0.0-1.0):
   - Is the tone respectful and persuasive?
   - Do they build credibility?
   - Avoid aggressive or dismissive language
   - ${difficulty === 'Easy' ? 'Friendly tone is fine' : difficulty === 'Moderate' ? 'Professional tone expected' : 'Academic rigor required'}

4. CROSS-DISCIPLINARY THINKING (0.0-1.0):
   - Do they connect multiple domains (science, economics, health, policy, technology)?
   - ${difficulty === 'Easy' || difficulty === 'Moderate' ? 'Optional but bonus points' : difficulty === 'Hard' ? 'Should connect 2+ domains' : 'Must integrate 3+ disciplines'}

5. COUNTER-ARGUMENT STRENGTH (0.0-1.0):
   - How well do they counter the ${persona.persona_type}'s stance?
   - Do they address the specific mindset of this persona?
   ${persona.persona_type === 'Teacher' 
     ? '- For Ishmael the Teacher: Are they engaging with the deeper questions about cultural assumptions and systemic issues, or just providing surface-level facts?' 
     : '- Do they actually challenge the opponent\'s position or are they just agreeing?'}

${persona.persona_type === 'Teacher' 
  ? 'IMPORTANT: Ishmael is a TEACHER, not a skeptic. Reward students who engage with philosophical questions about human-nature relationships, cultural myths, and systemic thinking. Penalize surface-level responses that don\'t examine root causes.' 
  : 'IMPORTANT: If the user is AGREEING with the opponent rather than debating them, LOWER ALL SCORES significantly. This is a debate - they should be challenging ' + persona.name + '\'s position, not supporting it.'}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: scoringPrompt }],
        tools: [{
          type: 'function',
          function: {
            name: 'score_debate_turn',
            description: 'Evaluate a debate turn with scores for each dimension',
            parameters: {
              type: 'object',
              properties: {
                evidence: { type: 'number', minimum: 0, maximum: 1, description: 'Evidence quality score 0.0-1.0' },
                logic: { type: 'number', minimum: 0, maximum: 1, description: 'Logic and reasoning score 0.0-1.0' },
                tone: { type: 'number', minimum: 0, maximum: 1, description: 'Tone and ethos score 0.0-1.0' },
                crossDisciplinary: { type: 'number', minimum: 0, maximum: 1, description: 'Cross-disciplinary thinking score 0.0-1.0' },
                counterArgumentStrength: { type: 'number', minimum: 0, maximum: 1, description: 'How well they counter the opponent 0.0-1.0' },
                reasoning: { type: 'string', description: 'Brief explanation of the scores' }
              },
              required: ['evidence', 'logic', 'tone', 'crossDisciplinary', 'counterArgumentStrength', 'reasoning'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'score_debate_turn' } }
      }),
    });

    if (!response.ok) {
      console.error('AI scoring failed:', response.status);
      // Fallback to basic scoring
      return {
        evidence: 0.5,
        logic: 0.5,
        tone: 0.7,
        crossDisciplinary: 0.3,
      };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const scores = JSON.parse(toolCall.function.arguments);
      console.log('AI Scoring:', scores);
      
      return {
        evidence: scores.evidence,
        logic: scores.logic,
        tone: scores.tone,
        crossDisciplinary: scores.crossDisciplinary,
        reasoning: scores.reasoning,
        counterArgumentStrength: scores.counterArgumentStrength,
      };
    }

    // Fallback
    return {
      evidence: 0.5,
      logic: 0.5,
      tone: 0.7,
      crossDisciplinary: 0.3,
    };
  } catch (error) {
    console.error('Error in AI scoring:', error);
    return {
      evidence: 0.5,
      logic: 0.5,
      tone: 0.7,
      crossDisciplinary: 0.3,
    };
  }
}

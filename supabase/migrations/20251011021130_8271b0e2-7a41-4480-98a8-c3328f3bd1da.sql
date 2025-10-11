-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE public.difficulty_level AS ENUM ('Easy', 'Moderate', 'Hard', 'Extreme');
CREATE TYPE public.persona_type AS ENUM ('Denier', 'Doubter', 'Naïve', 'Cynic', 'Zealot');
CREATE TYPE public.debate_result AS ENUM ('in_progress', 'passed', 'failed');

-- Personas table
CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  persona_type persona_type NOT NULL,
  description TEXT NOT NULL,
  tone TEXT NOT NULL,
  scripts JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evidence packets table
CREATE TABLE public.evidence_packets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  evidence_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_claim TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  difficulty difficulty_level,
  snippet TEXT,
  supports TEXT[] DEFAULT '{}',
  caveats TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Debates table
CREATE TABLE public.debates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) NOT NULL,
  difficulty difficulty_level NOT NULL,
  result debate_result NOT NULL DEFAULT 'in_progress',
  final_bsi DECIMAL(3, 2),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debate_id UUID REFERENCES public.debates(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  scores JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rubrics table
CREATE TABLE public.rubrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  weights JSONB NOT NULL,
  thresholds JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for personas (read-only for all authenticated, write for instructors/admins)
CREATE POLICY "Anyone can view personas"
  ON public.personas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can manage personas"
  ON public.personas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for evidence_packets
CREATE POLICY "Anyone can view evidence packets"
  ON public.evidence_packets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can create evidence packets"
  ON public.evidence_packets FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own evidence packets"
  ON public.evidence_packets FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can delete evidence packets"
  ON public.evidence_packets FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for debates
CREATE POLICY "Users can view their own debates"
  ON public.debates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own debates"
  ON public.debates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own debates"
  ON public.debates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their debates"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.debates
      WHERE debates.id = messages.debate_id
      AND (debates.user_id = auth.uid() OR public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can create messages in their debates"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.debates
      WHERE debates.id = debate_id AND debates.user_id = auth.uid()
    )
  );

-- RLS Policies for rubrics
CREATE POLICY "Anyone can view rubrics"
  ON public.rubrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can manage rubrics"
  ON public.rubrics FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- Seed personas
INSERT INTO public.personas (name, persona_type, description, tone, scripts) VALUES
(
  'The Climate Denier',
  'Denier',
  'Mr. Moneymaker doesn''t believe climate change is real. He dismisses evidence as "just weather" and relies on personal experience.',
  'Dismissive, confident, folksy',
  '["I don''t believe in climate change.", "I haven''t seen it in my lifetime.", "It''s just weather.", "This is all a hoax to control us.", "Scientists are just trying to get grant money."]'
),
(
  'The Scientific Doubter',
  'Doubter',
  'Mr. Moneymaker acknowledges climate variation but denies human causation. He questions CO₂''s role and demands proof of mechanisms.',
  'Skeptical, technical, demanding precision',
  '["The Earth was warmer before humans existed.", "CO₂ levels were higher in the past.", "Correlation doesn''t equal causation.", "What about solar cycles and orbital changes?", "You can''t distinguish natural from man-made CO₂.", "Scientists don''t really understand the greenhouse mechanism.", "Climate models are biased.", "How do you even measure ancient temperatures?"]'
),
(
  'The Naïve Optimist',
  'Naïve',
  'Mr. Moneymaker downplays impacts, believing warming won''t affect him and might even help plants grow.',
  'Optimistic, dismissive of concerns, simplistic',
  '["One degree Celsius isn''t that bad.", "Climate change won''t affect me personally.", "Rich people will be fine.", "More CO₂ means more plant growth - that''s good!", "Warmer weather sounds nice to me."]'
),
(
  'The Economic Cynic',
  'Cynic',
  'Mr. Moneymaker believes action is too expensive, too late, or requires impossible global coordination.',
  'Pragmatic, defeatist, cost-focused',
  '["It''s too expensive to fix.", "The technology isn''t ready yet.", "We need everyone to agree first - good luck with that.", "It''s already too late to make a difference.", "This will destroy our economy."]'
),
(
  'The Propaganda Zealot',
  'Zealot',
  'Mr. Moneymaker thinks climate activists use fear tactics and manipulate data. He believes ends justify means in the debate.',
  'Accusatory, conspiratorial, emotional',
  '["You''re just using fear to control people.", "Climate activists exaggerate everything.", "The ends justify the means for you people.", "This is propaganda, not science.", "You''d rather scare children than tell the truth."]'
);

-- Seed evidence packets
INSERT INTO public.evidence_packets (title, source, source_url, evidence_type, summary, key_claim, tags, difficulty, snippet, supports, caveats) VALUES
(
  'NASA GISTEMP v4 Global Temperature Anomalies',
  'NASA GISS',
  'https://data.giss.nasa.gov/gistemp/',
  'graph',
  'Global surface temperature anomalies from 1880 to present, showing clear warming trend with 5-year running mean.',
  'Global temperatures have increased approximately 1.1°C since pre-industrial times, with accelerating warming in recent decades.',
  ARRAY['temperature', 'trend', 'observational', 'global'],
  'Easy',
  'Temperature anomaly data shows +1.1°C warming since 1880, with most warming occurring after 1975.',
  ARRAY['Warming is real and measurable', 'Rate of warming is anomalous compared to natural cycles'],
  ARRAY['Coverage varies over time', 'Urban heat island effects are accounted for in homogenization']
),
(
  'NOAA Mauna Loa CO₂ Record',
  'NOAA/Scripps',
  'https://gml.noaa.gov/ccgg/trends/',
  'graph',
  'Continuous atmospheric CO₂ measurements from Mauna Loa Observatory since 1958, showing the "Keeling Curve".',
  'Atmospheric CO₂ has increased from ~315 ppm in 1958 to over 420 ppm in 2024, a 33% increase.',
  ARRAY['CO2', 'atmosphere', 'observational', 'Keeling'],
  'Easy',
  'CO₂ concentration: 315 ppm (1958) → 420+ ppm (2024). Annual growth rate: ~2.5 ppm/year.',
  ARRAY['CO₂ is rising rapidly', 'Human emissions are the cause (isotope analysis confirms)'],
  ARRAY['Seasonal fluctuations visible', 'Measurements from single location but representative of global trends']
),
(
  'IPCC AR6 WG1 Summary for Policymakers',
  'IPCC',
  'https://www.ipcc.ch/report/ar6/wg1/',
  'report',
  'The latest comprehensive assessment of climate science, confirming human influence is "unequivocal".',
  'It is unequivocal that human influence has warmed the atmosphere, ocean, and land. Widespread and rapid changes have occurred.',
  ARRAY['IPCC', 'consensus', 'attribution', 'comprehensive'],
  'Moderate',
  'IPCC AR6: "Human influence on climate is unequivocal." Temperature rise: 1.1°C (2011-2020 vs. 1850-1900).',
  ARRAY['Scientific consensus on human causation', 'Multiple lines of evidence converge'],
  ARRAY['Complex document requiring careful reading', 'Policy-relevant but not policy-prescriptive']
),
(
  'Ice Core CO₂ and Temperature Records (800,000 years)',
  'EPICA/Vostok',
  'https://www.ncei.noaa.gov/products/paleoclimatology/ice-core',
  'graph',
  'Ice core data showing tight correlation between CO₂ and temperature over glacial-interglacial cycles.',
  'Over 800,000 years, CO₂ varied between ~180-300 ppm naturally. Current levels (420+ ppm) are unprecedented in this record.',
  ARRAY['ice core', 'paleoclimate', 'CO2', 'temperature', 'historical'],
  'Hard',
  'Natural CO₂ range: 180-300 ppm (past 800ka). Current: 420+ ppm. Temperature lags CO₂ in some cycles but both are coupled through feedbacks.',
  ARRAY['CO₂-temperature coupling is real', 'Current CO₂ levels are exceptional', 'Natural variation exists but is bounded'],
  ARRAY['Lag vs. lead debates require understanding of feedbacks', 'Does not prove causation without mechanism']
),
(
  'CO₂ Greenhouse Effect - Spectroscopy',
  'Multiple sources',
  'https://www.acs.org/content/acs/en/climatescience/greenhousegases.html',
  'mechanism',
  'CO₂ absorbs infrared radiation at specific wavelengths (primarily ~15 μm), trapping heat in the lower atmosphere.',
  'CO₂ is a greenhouse gas because it absorbs and re-emits infrared radiation, increasing the energy retained in Earth''s climate system.',
  ARRAY['mechanism', 'physics', 'greenhouse', 'CO2', 'infrared'],
  'Hard',
  'CO₂ absorption bands: 4.3 μm, 15 μm (primary). Radiative forcing: ΔF = 5.35 ln(C/C₀) W/m². Well-established physics since Arrhenius (1896).',
  ARRAY['Greenhouse effect is not debatable - it''s physics', 'Mechanism is experimentally verified'],
  ARRAY['Saturation arguments misunderstand atmospheric layers', 'Water vapor is a feedback, not primary driver']
),
(
  'Attribution Studies - Detection and Attribution',
  'IPCC/Multiple Studies',
  'https://www.carbonbrief.org/qa-how-do-climate-models-work/',
  'analysis',
  'Climate models with only natural forcings cannot reproduce observed warming; human forcings are required.',
  'The observed warming pattern matches predictions from human-caused greenhouse gas emissions, not natural variability alone.',
  ARRAY['attribution', 'modeling', 'fingerprint', 'human influence'],
  'Extreme',
  'Models show: natural forcings alone → slight cooling or no trend. Natural + anthropogenic → matches observations. Fingerprint: stratospheric cooling + tropospheric warming.',
  ARRAY['Human causation is statistically robust', 'Natural explanations have been ruled out'],
  ARRAY['Models have uncertainties but core signal is clear', 'Requires understanding of radiative forcing']
);

-- Seed default rubrics for each difficulty level
INSERT INTO public.rubrics (name, weights, thresholds) VALUES
(
  'Easy',
  '{"evidence": 0.30, "logic": 0.45, "tone": 0.25, "cross_disciplinary": 0.00}',
  '{"min_evidence": 0.25, "min_logic": 0.70, "min_bsi": 0.60, "required_turns": 6, "required_rebuttals": 3}'
),
(
  'Moderate',
  '{"evidence": 0.40, "logic": 0.35, "tone": 0.15, "cross_disciplinary": 0.10}',
  '{"min_evidence": 0.45, "min_logic": 0.70, "min_bsi": 0.70, "required_turns": 8, "required_rebuttals": 3, "required_citations": 1}'
),
(
  'Hard',
  '{"evidence": 0.45, "logic": 0.35, "tone": 0.10, "cross_disciplinary": 0.10}',
  '{"min_evidence": 0.60, "min_logic": 0.80, "min_bsi": 0.80, "required_turns": 10, "required_rebuttals": 4, "required_citations": 2, "required_domains": 2, "required_mechanisms": 1}'
),
(
  'Extreme',
  '{"evidence": 0.50, "logic": 0.30, "tone": 0.05, "cross_disciplinary": 0.15}',
  '{"min_evidence": 0.75, "min_logic": 0.85, "min_bsi": 0.85, "required_turns": 12, "required_rebuttals": 5, "required_citations": 3, "required_domains": 3, "sustained_turns": 5}'
);
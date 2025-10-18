-- Create quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);

-- Create daily_quotes table
CREATE TABLE IF NOT EXISTS public.daily_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read quotes"
  ON public.quotes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read user sessions"
  ON public.user_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create user sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read daily quotes"
  ON public.daily_quotes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create daily quotes"
  ON public.daily_quotes
  FOR INSERT
  WITH CHECK (true);

-- Insert 20 motivational quotes
INSERT INTO public.quotes (text, author) VALUES
('Il successo non è la chiave della felicità. La felicità è la chiave del successo.', 'Albert Schweitzer'),
('La vita è ciò che accade mentre sei impegnato a fare altri piani.', 'John Lennon'),
('Il modo migliore per predire il futuro è crearlo.', 'Peter Drucker'),
('Non conta quante volte cadi, ma quante volte ti rialzi.', 'Vince Lombardi'),
('Credi di potercela fare e sei già a metà dell''opera.', 'Theodore Roosevelt'),
('Il segreto per andare avanti è iniziare.', 'Mark Twain'),
('La felicità non è qualcosa di pronto. Arriva dalle tue azioni.', 'Dalai Lama'),
('Ogni giorno è una nuova opportunità per cambiare la tua vita.', 'Anonimo'),
('Non smettere mai di imparare, perché la vita non smette mai di insegnare.', 'Anonimo'),
('Le sfide sono ciò che rende la vita interessante; superarle è ciò che la rende significativa.', 'Joshua Marine'),
('La determinazione di oggi è il successo di domani.', 'Anonimo'),
('Non aspettare il momento perfetto, prendi il momento e rendilo perfetto.', 'Anonimo'),
('Il tuo tempo è limitato, non sprecarlo vivendo la vita di qualcun altro.', 'Steve Jobs'),
('Il successo non è definitivo, il fallimento non è fatale: ciò che conta è il coraggio di continuare.', 'Winston Churchill'),
('Se puoi sognarlo, puoi farlo.', 'Walt Disney'),
('L''unico modo per fare un ottimo lavoro è amare quello che fai.', 'Steve Jobs'),
('Non è mai troppo tardi per essere ciò che avresti potuto essere.', 'George Eliot'),
('Il futuro appartiene a coloro che credono nella bellezza dei propri sogni.', 'Eleanor Roosevelt'),
('Sogna in grande e osa fallire.', 'Norman Vaughan'),
('Credi in te stesso e arriverai.', 'Anonimo');
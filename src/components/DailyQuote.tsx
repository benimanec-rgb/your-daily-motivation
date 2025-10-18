import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Quote {
  id: string;
  text: string;
  author: string | null;
}

interface QuoteResponse {
  quote: Quote;
  expiresAt: string;
  isNew: boolean;
}

export const DailyQuote = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [canClick, setCanClick] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Generate or retrieve session ID
  const getSessionId = () => {
    let sessionId = localStorage.getItem('dailyspark_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('dailyspark_session', sessionId);
    }
    return sessionId;
  };

  // Check if we have a stored quote
  useEffect(() => {
    const storedQuote = localStorage.getItem('dailyspark_quote');
    const storedExpiry = localStorage.getItem('dailyspark_expiry');

    if (storedQuote && storedExpiry) {
      const expiry = new Date(storedExpiry);
      if (expiry > new Date()) {
        setQuote(JSON.parse(storedQuote));
        setExpiresAt(storedExpiry);
        setCanClick(false);
      } else {
        // Expired, clear storage
        localStorage.removeItem('dailyspark_quote');
        localStorage.removeItem('dailyspark_expiry');
      }
    }
  }, []);

  const fetchDailyQuote = async () => {
    setLoading(true);
    try {
      const sessionId = getSessionId();

      const { data, error } = await supabase.functions.invoke('get-daily-quote', {
        body: { sessionId },
      });

      if (error) throw error;

      const response = data as QuoteResponse;

      setQuote(response.quote);
      setExpiresAt(response.expiresAt);
      setCanClick(false);

      // Store in localStorage
      localStorage.setItem('dailyspark_quote', JSON.stringify(response.quote));
      localStorage.setItem('dailyspark_expiry', response.expiresAt);

      if (!response.isNew) {
        toast.info('Torna domani per una nuova frase! ✨', {
          description: 'Questa è la tua frase di oggi.',
        });
      } else {
        toast.success('Ecco la tua frase! 🌟', {
          description: 'Una nuova motivazione ti aspetta domani.',
        });
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      toast.error('Ops! Qualcosa è andato storto.', {
        description: 'Riprova tra qualche istante.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntilReset = () => {
    if (!expiresAt) return '';
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return '0h 0m 0s';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Update countdown every second
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      setTimeLeft(getTimeUntilReset());
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/20 p-4">
      <div className="max-w-2xl w-full space-y-8 text-center animate-fade-in">
        {/* Logo/Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-glow mb-4 animate-scale-in">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-accent">
            Daily Spark
          </h1>
          <p className="text-muted-foreground text-lg">
            La tua ispirazione quotidiana
          </p>
        </div>

        {/* Main Content */}
        {!quote ? (
          <div className="space-y-6 py-12">
            <p className="text-xl text-foreground/80 max-w-md mx-auto">
              Ogni giorno una nuova frase motivazionale ti aspetta.
            </p>
            <Button
              onClick={fetchDailyQuote}
              disabled={loading}
              size="lg"
              className="text-lg px-12 py-8 rounded-2xl shadow-soft hover:shadow-glow transition-all duration-300 bg-gradient-to-r from-primary to-primary-glow hover:scale-105"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-6 w-6" />
                  Clicca per la tua frase di oggi
                </>
              )}
            </Button>
          </div>
        ) : (
          <Card className="p-8 md:p-12 space-y-6 shadow-soft hover:shadow-glow transition-all duration-500 border-primary/20 bg-card/95 backdrop-blur-sm animate-scale-in">
            <div className="space-y-4">
              <p className="text-2xl md:text-3xl font-medium leading-relaxed text-foreground">
                "{quote.text}"
              </p>
              {quote.author && (
                <p className="text-lg text-muted-foreground italic">
                  — {quote.author}
                </p>
              )}
            </div>

            <div className="pt-6 border-t border-border/50 space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>
                  Nuova frase tra: <span className="font-semibold text-primary tabular-nums">{timeLeft}</span>
                </span>
              </div>

              <Button
                onClick={fetchDailyQuote}
                disabled={!canClick || loading}
                variant="outline"
                size="lg"
                className="w-full rounded-xl hover:bg-secondary transition-all duration-300"
              >
                {canClick ? 'Ricevi la tua frase' : 'Torna domani per una nuova frase'}
              </Button>
            </div>
          </Card>
        )}

        {/* Footer */}
        <p className="text-sm text-muted-foreground/60">
          Una nuova motivazione ogni 24 ore ✨
        </p>
      </div>
    </div>
  );
};

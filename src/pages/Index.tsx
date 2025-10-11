import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brain, Leaf, Target } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in">
            <Brain className="h-16 w-16 text-primary-foreground" />
            <Leaf className="h-16 w-16 text-secondary-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-4 animate-slide-up">
            Convince Mr. Moneymaker
          </h1>
          
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto animate-fade-in">
            Master climate science through AI-powered debate. Challenge Mr. Moneymaker's misconceptions with evidence and reasoning.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-12 text-primary-foreground">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 animate-fade-in">
              <Target className="h-10 w-10 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">5 Personas</h3>
              <p className="text-sm opacity-90">From Denier to Zealot - each with unique arguments</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 animate-fade-in">
              <Brain className="h-10 w-10 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">4 Difficulty Levels</h3>
              <p className="text-sm opacity-90">Easy to Extreme - test your mastery</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 animate-fade-in">
              <Leaf className="h-10 w-10 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Real Evidence</h3>
              <p className="text-sm opacity-90">NASA, NOAA, IPCC data at your fingertips</p>
            </div>
          </div>

          <div className="mt-12 space-x-4">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => navigate("/debate")} className="shadow-glow">
                Start Debating
              </Button>
            ) : (
              <Button size="lg" onClick={() => navigate("/auth")} className="shadow-glow">
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

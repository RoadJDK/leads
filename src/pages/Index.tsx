import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dot } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTypewriter } from "@/hooks/useTypewriter";

const Index = () => {
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const WEBHOOK_URL = "https://maibach-studios.app.n8n.cloud/webhook-test/kroener-consulting";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Guten Morgen";
    if (hour >= 12 && hour < 18) return "Guten Mittag";
    if (hour >= 18 && hour < 22) return "Guten Abend";
    return "Gute Nacht";
  };

  const greeting = savedName ? `${getGreeting()}, ${savedName}` : "Willkommen";
  const { displayedText, isComplete } = useTypewriter(greeting, 80);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setSavedName(storedName);
    }
  }, []);

  const handleSaveName = () => {
    if (name.trim()) {
      localStorage.setItem("userName", name.trim());
      setSavedName(name.trim());
    }
  };

  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      if (WEBHOOK_URL) {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            action: 'leads_erhalten',
            name: savedName,
          }),
        });
      }
      
      toast.success("Erfolgreich!", {
        description: "Sie erhalten Ihre Leads in Ihrer Notion-Seite und Google Sheets.",
        duration: 5000,
      });
    } catch (error) {
      toast.error("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!savedName) {
    return (
      <>
        <ThemeToggle />
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
          <div className="text-center space-y-8 px-4 max-w-md w-full">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent min-h-[72px] md:min-h-[96px] flex items-center justify-center">
                <span className="inline-block">
                  {displayedText}
                  {!isComplete && <span className="animate-pulse">|</span>}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Wie ist Ihr Name?
              </p>
            </div>
            
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Ihr Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                className="text-lg py-6 px-4 rounded-xl"
              />
              <Button 
                onClick={handleSaveName}
                disabled={!name.trim()}
                size="lg"
                className="w-full text-lg px-12 py-6 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Weiter
              </Button>
            </div>
            
            <footer className="pt-12">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                WachstumsWerk <Dot className="w-4 h-4" /> Made by Maibach Studios 2025
              </p>
            </footer>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ThemeToggle />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
        <div className="text-center space-y-8 px-4">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent min-h-[72px] md:min-h-[96px] flex items-center justify-center">
              <span className="inline-block">
                {displayedText}
                {!isComplete && <span className="animate-pulse">|</span>}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              Deine hammer Leads warten auf dich 🔥
            </p>
          </div>
          
          <Button 
            onClick={handleClick}
            disabled={isLoading}
            size="lg"
            className="text-lg px-12 py-6 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            {isLoading ? "Lädt..." : "Leads erhalten"}
          </Button>
          
          <footer className="pt-12">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              WachstumsWerk <Dot className="w-4 h-4" /> Made by Maibach Studios 2025
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Index;

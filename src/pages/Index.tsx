import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dot, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTypewriter } from "@/hooks/useTypewriter";

const Index = () => {
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
  const [previousApiKey, setPreviousApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const WEBHOOK_URL = "https://maibach-studios.app.n8n.cloud/webhook/kroener-consulting";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return "Guten Morgen";
    if (hour >= 10 && hour < 12) return "Einen schönen Vormittag";
    if (hour >= 12 && hour < 14) return "Mahlzeit";
    if (hour >= 14 && hour < 17) return "Guten Nachmittag";
    if (hour >= 17 && hour < 19) return "Schönen Feierabend";
    if (hour >= 19 && hour < 22) return "Guten Abend";
    if (hour >= 22 || hour < 1) return "Einen schönen Abend";
    return "Gute Nacht";
  };

  const greeting = savedName ? `${getGreeting()}, ${savedName}` : "Willkommen";
  const { displayedText, isComplete } = useTypewriter(greeting, 80);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setSavedName(storedName);
    }
    const storedApiKey = localStorage.getItem("apiKey");
    if (storedApiKey) {
      setSavedApiKey(storedApiKey);
    }
  }, []);

  const handleSaveName = () => {
    if (name.trim()) {
      localStorage.setItem("userName", name.trim());
      setSavedName(name.trim());
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("apiKey", apiKey.trim());
      setSavedApiKey(apiKey.trim());
    }
  };

  const handleResetApiKey = () => {
    setPreviousApiKey(savedApiKey);
    localStorage.removeItem("apiKey");
    setSavedApiKey(null);
    setApiKey("");
  };

  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      if (WEBHOOK_URL && savedApiKey) {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': savedApiKey,
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            action: 'leads_erhalten',
            name: savedName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 403) {
            handleResetApiKey();
            throw new Error("API-Schlüssel ist ungültig. Bitte geben Sie einen neuen ein.");
          }
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
      }
      
      toast.success("Erfolgreich!", {
        description: "Sie erhalten Ihre Leads in Ihrer Notion-Seite und Google Sheets.",
        duration: 5000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
      toast.error(errorMessage);
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

  if (!savedApiKey) {
    return (
      <>
        <ThemeToggle />
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
          <div className="text-center space-y-8 px-4 max-w-md w-full">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent min-h-[72px] md:min-h-[96px] flex items-center justify-center">
                API-Schlüssel
              </h1>
              <p className="text-xl text-muted-foreground">
                Bitte geben Sie Ihren API-Schlüssel ein
              </p>
            </div>
            
            <div className="space-y-4">
              <Input
                type="text"
                placeholder={previousApiKey ? `${previousApiKey.slice(0, 4)}...${previousApiKey.slice(-4)}` : "API-Schlüssel"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveApiKey()}
                className="text-lg py-6 px-4 rounded-xl"
              />
              <Button 
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim()}
                size="lg"
                className="w-full text-lg px-12 py-6 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Speichern
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
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleResetApiKey}
          title="API-Schlüssel ändern"
        >
          <Settings className="h-5 w-5" />
        </Button>
        <ThemeToggle />
      </div>
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

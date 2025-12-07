import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dot, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTypewriter } from "@/hooks/useTypewriter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savedWebhookUrl, setSavedWebhookUrl] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
  const [previousApiKey, setPreviousApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    const storedWebhookUrl = localStorage.getItem("webhookUrl");
    if (storedWebhookUrl) {
      setSavedWebhookUrl(storedWebhookUrl);
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

  const handleSaveWebhookUrl = () => {
    if (webhookUrl.trim()) {
      localStorage.setItem("webhookUrl", webhookUrl.trim());
      setSavedWebhookUrl(webhookUrl.trim());
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("apiKey", apiKey.trim());
      setSavedApiKey(apiKey.trim());
    }
  };

  const handleResetWebhookUrl = () => {
    setWebhookUrl(savedWebhookUrl || "");
    localStorage.removeItem("webhookUrl");
    setSavedWebhookUrl(null);
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
      if (savedWebhookUrl && savedApiKey) {
        const response = await fetch(savedWebhookUrl, {
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

  // Step 1: Name input
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

  // Step 2: Webhook URL input
  if (!savedWebhookUrl) {
    return (
      <>
        <ThemeToggle />
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
          <div className="text-center space-y-8 px-4 max-w-md w-full">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent min-h-[72px] md:min-h-[96px] flex items-center justify-center">
                Webhook URL
              </h1>
              <p className="text-xl text-muted-foreground">
                Bitte geben Sie Ihre Webhook URL ein
              </p>
            </div>
            
            <div className="space-y-4">
              <Input
                type="url"
                placeholder="https://..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveWebhookUrl()}
                className="text-lg py-6 px-4 rounded-xl"
              />
              <Button 
                onClick={handleSaveWebhookUrl}
                disabled={!webhookUrl.trim()}
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

  // Step 3: API Key input
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              title="Einstellungen"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleResetWebhookUrl}>
              Webhook ändern
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleResetApiKey}>
              API-Schlüssel ändern
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            {isLoading ? (
              <>
                <Dot className="mr-2 h-5 w-5 animate-pulse" />
                Lädt...
              </>
            ) : (
              "Leads erhalten"
            )}
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

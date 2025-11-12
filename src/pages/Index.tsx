import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const WEBHOOK_URL = ""; // URL will be provided by user

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
            action: 'daten_erlangen',
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
      <div className="text-center space-y-8 px-4">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Willkommen
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Erhalten Sie Zugang zu Ihren wertvollen Daten
          </p>
        </div>
        
        <Button 
          onClick={handleClick}
          disabled={isLoading}
          size="lg"
          className="text-lg px-12 py-6 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          {isLoading ? "Lädt..." : "Daten erlangen"}
        </Button>
      </div>
    </div>
  );
};

export default Index;

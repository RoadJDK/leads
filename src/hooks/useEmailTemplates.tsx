import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ManualFields {
  absender_vorname: string;
  absender_name: string;
  absender_telefon: string;
  absender_email: string;
  weitere_eigene: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string | null;
  body_template: string;
  manual_fields: ManualFields;
  created_at: string;
  updated_at: string;
}

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data) {
      setTemplates(data.map(item => ({
        ...item,
        manual_fields: item.manual_fields as unknown as ManualFields
      })));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTemplates();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("email_templates_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "email_templates",
        },
        () => {
          fetchTemplates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { templates, isLoading, refetch: fetchTemplates };
}

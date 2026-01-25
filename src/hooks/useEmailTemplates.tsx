import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CustomPlaceholder {
  name: string;
  value: string;
}

interface ManualFields {
  custom_placeholders: CustomPlaceholder[];
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
      setTemplates(data.map(item => {
        // Handle legacy format migration
        const rawFields = item.manual_fields as any;
        let manualFields: ManualFields;
        
        if (rawFields && Array.isArray(rawFields.custom_placeholders)) {
          manualFields = rawFields as ManualFields;
        } else {
          // Migrate from old format
          manualFields = { custom_placeholders: [] };
        }
        
        return {
          ...item,
          manual_fields: manualFields
        };
      }));
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

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProcessingStatus {
  id: string;
  is_processing: boolean;
  has_error: boolean;
}

export const useProcessingStatus = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [statusId, setStatusId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial status
  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("processing_status")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setIsProcessing(data.is_processing);
        setHasError(data.has_error);
        setStatusId(data.id);
      }
      setIsLoading(false);
    };

    fetchStatus();
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("processing_status_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "processing_status",
        },
        (payload) => {
          const newData = payload.new as ProcessingStatus;
          setIsProcessing(newData.is_processing);
          setHasError(newData.has_error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setProcessing = async (value: boolean) => {
    if (!statusId) return;
    
    await supabase
      .from("processing_status")
      .update({ is_processing: value, updated_at: new Date().toISOString() })
      .eq("id", statusId);
    
    setIsProcessing(value);
  };

  const resetError = async () => {
    if (!statusId) return;
    
    await supabase
      .from("processing_status")
      .update({ has_error: false, updated_at: new Date().toISOString() })
      .eq("id", statusId);
    
    setHasError(false);
  };

  return {
    isProcessing,
    hasError,
    isLoading,
    setProcessing,
    resetError,
  };
};

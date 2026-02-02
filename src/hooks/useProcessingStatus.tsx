import { useState, useEffect, useCallback } from "react";
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

  // Fetch status function (reusable)
  const fetchStatus = useCallback(async () => {
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
  }, []);

  // Fetch initial status
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("processing_status_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "processing_status",
        },
        (payload) => {
          const newData = payload.new as ProcessingStatus;
          setIsProcessing(newData.is_processing);
          setHasError(newData.has_error);
        }
      )
      .subscribe((status) => {
        // If subscription fails, poll every 5 seconds as fallback
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("Realtime subscription failed, using polling fallback");
        }
      });

    // Fallback polling every 5 seconds in case realtime doesn't work
    const pollInterval = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [fetchStatus]);

  const setProcessing = async (value: boolean) => {
    if (!statusId) return;

    const { error } = await supabase
      .from("processing_status")
      .update({ is_processing: value, updated_at: new Date().toISOString() })
      .eq("id", statusId);

    // Only update local state if the database update succeeded
    if (!error) {
      setIsProcessing(value);
    }
  };

  const resetError = async () => {
    if (!statusId) return;

    const { error } = await supabase
      .from("processing_status")
      .update({ has_error: false, updated_at: new Date().toISOString() })
      .eq("id", statusId);

    if (!error) {
      setHasError(false);
    }
  };

  // Manual refresh function
  const refreshStatus = () => {
    fetchStatus();
  };

  return {
    isProcessing,
    hasError,
    isLoading,
    setProcessing,
    resetError,
    refreshStatus,
  };
};

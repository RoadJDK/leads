import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Analytics {
  id: string;
  leads_uploaded: number;
  phones_found: number;
  emails_found: number;
  emails_sent: number;
  replies_received: number;
  updated_at: string;
}

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);

  // Fetch initial analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data, error } = await supabase
        .from("analytics")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setAnalytics(data);
        setAnalyticsId(data.id);
      }
      setIsLoading(false);
    };

    fetchAnalytics();
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("analytics_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "analytics",
        },
        (payload) => {
          const newData = payload.new as Analytics;
          setAnalytics(newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Increment leads uploaded count
  const incrementLeadsUploaded = async (count: number = 1) => {
    if (!analyticsId || !analytics) return;

    const newValue = analytics.leads_uploaded + count;
    await supabase
      .from("analytics")
      .update({ leads_uploaded: newValue, updated_at: new Date().toISOString() })
      .eq("id", analyticsId);
  };

  // Reset all analytics to zero
  const resetAnalytics = async () => {
    if (!analyticsId) return;

    await supabase
      .from("analytics")
      .update({
        leads_uploaded: 0,
        phones_found: 0,
        emails_found: 0,
        emails_sent: 0,
        replies_received: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analyticsId);
  };

  return {
    analytics,
    isLoading,
    incrementLeadsUploaded,
    resetAnalytics,
    // Expose individual metrics for convenience
    leadsUploaded: analytics?.leads_uploaded ?? 0,
    phonesFound: analytics?.phones_found ?? 0,
    emailsFound: analytics?.emails_found ?? 0,
    emailsSent: analytics?.emails_sent ?? 0,
    repliesReceived: analytics?.replies_received ?? 0,
  };
};

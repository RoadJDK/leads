-- Create analytics table for tracking lead generation metrics
-- This table stores cumulative statistics that can be updated by n8n workflows

CREATE TABLE public.analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Lead metrics
  leads_uploaded INTEGER NOT NULL DEFAULT 0,

  -- Contact discovery metrics (updated by n8n)
  phones_found INTEGER NOT NULL DEFAULT 0,
  emails_found INTEGER NOT NULL DEFAULT 0,

  -- Email campaign metrics (updated by n8n)
  emails_sent INTEGER NOT NULL DEFAULT 0,

  -- Response metrics (for future use)
  replies_received INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (but allow public access for n8n integration)
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read analytics
CREATE POLICY "Anyone can read analytics"
ON public.analytics
FOR SELECT
USING (true);

-- Allow anyone to update analytics (for n8n webhook)
CREATE POLICY "Anyone can update analytics"
ON public.analytics
FOR UPDATE
USING (true);

-- Allow insert for initial row
CREATE POLICY "Anyone can insert analytics"
ON public.analytics
FOR INSERT
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_analytics_updated_at
BEFORE UPDATE ON public.analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for analytics table
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics;

-- Insert the initial analytics row with zero values
INSERT INTO public.analytics (leads_uploaded, phones_found, emails_found, emails_sent, replies_received)
VALUES (0, 0, 0, 0, 0);

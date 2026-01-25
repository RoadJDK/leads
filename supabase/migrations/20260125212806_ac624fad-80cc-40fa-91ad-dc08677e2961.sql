-- Create processing_status table
CREATE TABLE public.processing_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_processing BOOLEAN NOT NULL DEFAULT false,
  has_error BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (but allow public access since this is a shared status)
ALTER TABLE public.processing_status ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the status
CREATE POLICY "Anyone can read processing status" 
ON public.processing_status 
FOR SELECT 
USING (true);

-- Allow anyone to update the status (for n8n webhook)
CREATE POLICY "Anyone can update processing status" 
ON public.processing_status 
FOR UPDATE 
USING (true);

-- Allow insert for initial row
CREATE POLICY "Anyone can insert processing status" 
ON public.processing_status 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.processing_status;

-- Insert the initial status row
INSERT INTO public.processing_status (is_processing, has_error) VALUES (false, false);
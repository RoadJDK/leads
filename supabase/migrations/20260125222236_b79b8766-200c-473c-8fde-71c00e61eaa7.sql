-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create email_templates table for storing email templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT,
  body_template TEXT NOT NULL,
  manual_fields JSONB NOT NULL DEFAULT '{
    "absender_vorname": "",
    "absender_name": "",
    "absender_telefon": "",
    "absender_email": "",
    "weitere_eigene": ""
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for n8n integration)
CREATE POLICY "Anyone can read email templates" 
ON public.email_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert email templates" 
ON public.email_templates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update email templates" 
ON public.email_templates 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete email templates" 
ON public.email_templates 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for email_templates table
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_templates;
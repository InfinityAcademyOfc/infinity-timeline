-- Create timeline_comments table for interactive comments
CREATE TABLE public.timeline_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timeline_item_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.timeline_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for timeline comments
CREATE POLICY "Users can view comments on their timeline items" 
ON public.timeline_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.timeline_items ti
    JOIN public.client_timelines ct ON ti.client_timeline_id = ct.id
    WHERE ti.id = timeline_comments.timeline_item_id 
    AND ct.client_id = auth.uid()
  )
  OR is_admin()
);

CREATE POLICY "Users can create comments on their timeline items" 
ON public.timeline_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = author_id
  AND (
    EXISTS (
      SELECT 1 FROM public.timeline_items ti
      JOIN public.client_timelines ct ON ti.client_timeline_id = ct.id
      WHERE ti.id = timeline_comments.timeline_item_id 
      AND ct.client_id = auth.uid()
    )
    OR is_admin()
  )
);

CREATE POLICY "Admins can manage all comments" 
ON public.timeline_comments 
FOR ALL 
USING (is_admin());

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_timeline_comments_updated_at
BEFORE UPDATE ON public.timeline_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
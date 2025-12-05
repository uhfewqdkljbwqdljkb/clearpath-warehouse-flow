-- Create table to store JARDE reconciliation reports
CREATE TABLE public.jarde_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  report_data JSONB NOT NULL,
  total_products INTEGER DEFAULT 0,
  items_with_variance INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jarde_reports ENABLE ROW LEVEL SECURITY;

-- Admins can manage all reports
CREATE POLICY "Admins can manage JARDE reports"
ON public.jarde_reports
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'warehouse_manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'warehouse_manager'::app_role)
);

-- Create index for faster queries
CREATE INDEX idx_jarde_reports_date ON public.jarde_reports(report_date DESC);
CREATE INDEX idx_jarde_reports_company ON public.jarde_reports(company_id);
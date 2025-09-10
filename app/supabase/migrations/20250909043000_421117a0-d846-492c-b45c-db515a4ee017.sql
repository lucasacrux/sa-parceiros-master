-- Create consultations table for storing CNPJ lookup results
CREATE TABLE public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES public.wallets(id),
  dataset text NOT NULL,
  document text NOT NULL,
  result jsonb,
  requested_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

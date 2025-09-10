-- Create datasets table
CREATE TABLE IF NOT EXISTS public.datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cpf','cnpj')),
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Seed basic datasets
INSERT INTO public.datasets (code, name, type, price) VALUES
  ('owners_lawsuits_distribution_data','Distribuicao de processos dos socios','cnpj', 10.00),
  ('cpf_basic_data','Dados basicos do CPF','cpf',5.00);

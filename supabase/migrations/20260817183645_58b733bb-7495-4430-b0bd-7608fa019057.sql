ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cozinhas integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS copa integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS salas_reuniao integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recepcao integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS faixa_pessoas text,
  ADD COLUMN IF NOT EXISTS faixa_metragem text,
  ADD COLUMN IF NOT EXISTS qtd_profissionais integer NOT NULL DEFAULT 1;

UPDATE public.pricing_config SET valor = 0 WHERE chave = 'valor_seguro';

INSERT INTO public.pricing_config (chave, valor, descricao) VALUES
  ('adicional_por_sala_extra', 0, 'Adicional por sala a partir da 2ª (residencial)'),
  ('adicional_por_cozinha', 0, 'Adicional por cozinha (residencial)'),
  ('com_adicional_sala', 25, 'Escritório/Empresa: adicional por sala'),
  ('com_adicional_banheiro', 25, 'Escritório/Empresa: adicional por banheiro'),
  ('com_adicional_copa', 20, 'Escritório/Empresa: adicional por copa'),
  ('com_adicional_sala_reuniao', 30, 'Escritório/Empresa: adicional por sala de reunião'),
  ('com_adicional_recepcao', 20, 'Escritório/Empresa: adicional por recepção'),
  ('pessoas_ate_5', 0, 'Escritório/Empresa: adicional para até 5 pessoas'),
  ('pessoas_6_10', 30, 'Escritório/Empresa: adicional para 6 a 10 pessoas'),
  ('pessoas_11_20', 60, 'Escritório/Empresa: adicional para 11 a 20 pessoas'),
  ('pessoas_21_40', 110, 'Escritório/Empresa: adicional para 21 a 40 pessoas'),
  ('pessoas_mais_40', 180, 'Escritório/Empresa: adicional para mais de 40 pessoas'),
  ('metragem_20_50', 0, 'Empresa: adicional de 20 a 50 m²'),
  ('metragem_51_100', 40, 'Empresa: adicional de 51 a 100 m²'),
  ('metragem_101_200', 90, 'Empresa: adicional de 101 a 200 m²'),
  ('metragem_201_300', 150, 'Empresa: adicional de 201 a 300 m²'),
  ('metragem_mais_301', 220, 'Empresa: adicional acima de 301 m²'),
  ('mult_com_essencial', 1, 'Multiplicador Limpeza Essencial (comercial)'),
  ('mult_com_completa', 1.2, 'Multiplicador Limpeza Completa (comercial)'),
  ('mult_com_intensiva', 1.45, 'Multiplicador Limpeza Intensiva (comercial)')
ON CONFLICT (chave) DO NOTHING;
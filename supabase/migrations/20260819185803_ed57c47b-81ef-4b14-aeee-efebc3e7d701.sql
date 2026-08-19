ALTER TABLE public.notificacoes_whatsapp
  ADD COLUMN IF NOT EXISTS erro text,
  ADD COLUMN IF NOT EXISTS zapi_message_id text,
  ADD COLUMN IF NOT EXISTS tentativas integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tentado_em timestamp with time zone;

CREATE INDEX IF NOT EXISTS notificacoes_whatsapp_pendentes_idx
  ON public.notificacoes_whatsapp (status, criado_em);
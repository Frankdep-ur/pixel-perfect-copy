CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('drenar-fila-whatsapp')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'drenar-fila-whatsapp');

SELECT cron.schedule(
  'drenar-fila-whatsapp',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://lar77.lovable.app/api/public/zapi-drenar',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_RHXluw7K8bpZYss62iCN7w_zvfpsalS"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
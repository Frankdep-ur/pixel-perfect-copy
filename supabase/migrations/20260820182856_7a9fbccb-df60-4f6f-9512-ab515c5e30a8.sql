SELECT cron.unschedule(1);

SELECT cron.schedule(
  'zapi-drenar-fila',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://lar10.lovable.app/api/public/zapi-drenar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_RHXluw7K8bpZYss62iCN7w_zvfpsalS'
    ),
    body := '{}'::jsonb
  );
  $$
);
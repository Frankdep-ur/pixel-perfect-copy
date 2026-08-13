WITH novos(id, email, meta) AS (VALUES
('87917977-3158-59f6-a2e6-8eb30e7f1c81','admin@lar10.app','{"nome": "Equipe LAR10", "role": "admin", "telefone": "(48) 99000-0000"}'),
('14d0414c-fe20-518b-8c07-f08201a6fd71','maria.aparecida.silva@demo.lar10.app','{"nome": "Maria Aparecida Silva", "role": "profissional", "telefone": "(48) 90001-0001"}'),
('7f59de92-f09f-5edd-93a2-2bcb4deba210','fernanda.souza.lima@demo.lar10.app','{"nome": "Fernanda Souza Lima", "role": "profissional", "telefone": "(48) 90002-0002"}'),
('e6aba1f2-ad06-5716-b2e6-98ed535b05e4','juliana.rodrigues@demo.lar10.app','{"nome": "Juliana Rodrigues", "role": "profissional", "telefone": "(48) 90003-0003"}'),
('0a5c2b94-057a-5083-9c45-b269183890db','patricia.gomes@demo.lar10.app','{"nome": "Patrícia Gomes", "role": "profissional", "telefone": "(48) 90004-0004"}'),
('4ab2d969-c07e-51e1-89f8-ecfabfda27a1','rosangela.martins@demo.lar10.app','{"nome": "Rosângela Martins", "role": "profissional", "telefone": "(48) 90005-0005"}'),
('14a0d4ce-4820-56fd-9dba-7eca164b314e','claudia.ferreira@demo.lar10.app','{"nome": "Cláudia Ferreira", "role": "profissional", "telefone": "(48) 90006-0006"}'),
('c1e3a760-9846-506c-b054-8e84136ad5b2','simone.batista@demo.lar10.app','{"nome": "Simone Batista", "role": "profissional", "telefone": "(48) 90007-0007"}'),
('2bb85e96-842c-57b4-bf66-95e6134f4217','adriana.nunes@demo.lar10.app','{"nome": "Adriana Nunes", "role": "profissional", "telefone": "(48) 90008-0008"}'),
('480a80a1-8a47-5b8b-aabc-1fc748e215a0','vanessa.cardoso@demo.lar10.app','{"nome": "Vanessa Cardoso", "role": "profissional", "telefone": "(48) 90009-0009"}'),
('798aab71-4080-587b-8c96-419c96afe180','eliane.ramos@demo.lar10.app','{"nome": "Eliane Ramos", "role": "profissional", "telefone": "(48) 90010-0010"}'),
('81934f50-84ce-5221-8d83-91d9ebcb218f','debora.alves@demo.lar10.app','{"nome": "Débora Alves", "role": "profissional", "telefone": "(48) 90011-0011"}'),
('c8a89c2d-aac2-5587-b116-20689eac6096','luciana.moraes@demo.lar10.app','{"nome": "Luciana Moraes", "role": "profissional", "telefone": "(48) 90012-0012"}'),
('ffacd2da-d969-5a56-98a6-8dfeec8215cd','tatiane.correia@demo.lar10.app','{"nome": "Tatiane Correia", "role": "profissional", "telefone": "(48) 90013-0013"}'),
('0cc95bbf-ee81-5d91-aad8-2cb9ce6e07ea','marcia.pereira@demo.lar10.app','{"nome": "Márcia Pereira", "role": "profissional", "telefone": "(48) 90014-0014"}'),
('8a7d15c7-8c4f-53bc-852f-db75c14c3acc','sandra.oliveira@demo.lar10.app','{"nome": "Sandra Oliveira", "role": "profissional", "telefone": "(48) 90015-0015"}'),
('59889606-b539-596c-8eaa-d8b8f09e1bf1','rafael.andrade@demo.lar10.app','{"nome": "Rafael Andrade", "role": "cliente", "telefone": "(48) 99101-1001"}'),
('81d0c83a-2e3d-5a56-8d06-3870ca944f30','camila.duarte@demo.lar10.app','{"nome": "Camila Duarte", "role": "cliente", "telefone": "(48) 99102-1002"}'),
('df4cfbd3-d512-5436-9dab-5a8813bd5503','bruno.teixeira@demo.lar10.app','{"nome": "Bruno Teixeira", "role": "cliente", "telefone": "(48) 99103-1003"}'),
('4ca8fde8-4a8d-54e0-a853-f9e4e101066b','leticia.moreira@demo.lar10.app','{"nome": "Letícia Moreira", "role": "cliente", "telefone": "(48) 99104-1004"}'),
('ec2dd938-b512-5091-84e4-470cc3c92302','diego.barbosa@demo.lar10.app','{"nome": "Diego Barbosa", "role": "cliente", "telefone": "(47) 99105-1005"}'),
('29e0344f-0296-5aab-8ee1-0fe4412ca414','aline.castro@demo.lar10.app','{"nome": "Aline Castro", "role": "cliente", "telefone": "(47) 99106-1006"}'),
('ef9bbd7b-888c-518f-9a19-8397db0916ee','thiago.mendes@demo.lar10.app','{"nome": "Thiago Mendes", "role": "cliente", "telefone": "(47) 99107-1007"}'),
('c0c906f4-37c7-5d09-980e-a694610e039d','priscila.rocha@demo.lar10.app','{"nome": "Priscila Rocha", "role": "cliente", "telefone": "(47) 99108-1008"}')
)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
SELECT '00000000-0000-0000-0000-000000000000', n.id::uuid, 'authenticated', 'authenticated', n.email,
       extensions.crypt('lar10demo', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, n.meta::jsonb, now() - interval '60 days', now()
FROM novos n
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
FROM auth.users u
WHERE u.email LIKE '%@demo.lar10.app' OR u.email = 'admin@lar10.app'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role) VALUES ('87917977-3158-59f6-a2e6-8eb30e7f1c81','admin') ON CONFLICT DO NOTHING;

UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=1' WHERE id='14d0414c-fe20-518b-8c07-f08201a6fd71';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=2' WHERE id='7f59de92-f09f-5edd-93a2-2bcb4deba210';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=3' WHERE id='e6aba1f2-ad06-5716-b2e6-98ed535b05e4';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=4' WHERE id='0a5c2b94-057a-5083-9c45-b269183890db';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=5' WHERE id='4ab2d969-c07e-51e1-89f8-ecfabfda27a1';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=6' WHERE id='14a0d4ce-4820-56fd-9dba-7eca164b314e';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=7' WHERE id='c1e3a760-9846-506c-b054-8e84136ad5b2';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=8' WHERE id='2bb85e96-842c-57b4-bf66-95e6134f4217';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=9' WHERE id='480a80a1-8a47-5b8b-aabc-1fc748e215a0';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=10' WHERE id='798aab71-4080-587b-8c96-419c96afe180';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=11' WHERE id='81934f50-84ce-5221-8d83-91d9ebcb218f';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=12' WHERE id='c8a89c2d-aac2-5587-b116-20689eac6096';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=13' WHERE id='ffacd2da-d969-5a56-98a6-8dfeec8215cd';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=14' WHERE id='0cc95bbf-ee81-5d91-aad8-2cb9ce6e07ea';
UPDATE public.profiles SET foto_url='https://i.pravatar.cc/150?img=15' WHERE id='8a7d15c7-8c4f-53bc-852f-db75c14c3acc';

INSERT INTO public.profissionais (id, user_id, bio, anos_experiencia, status, nota_media, total_avaliacoes, total_servicos, raio_km, cidade, regiao, cidades_atendidas, latitude, longitude, tipos_limpeza, verificada, disponivel) VALUES
('9608f1b0-69ce-5ac6-ade8-f4c283a0b103','14d0414c-fe20-518b-8c07-f08201a6fd71','Profissional de limpeza em Florianópolis, 8 anos de experiência.',8,'aprovada',4.9,39,312,20,'Florianópolis','grande_floripa',ARRAY['Florianópolis']::text[],-27.5954,-48.548,ARRAY['padrao','completa','pesada']::text[],true,true),
('177de0ae-4147-5ae0-861b-888c58e9611a','7f59de92-f09f-5edd-93a2-2bcb4deba210','Profissional de limpeza em Florianópolis, 5 anos de experiência.',5,'aprovada',4.8,23,187,20,'Florianópolis','grande_floripa',ARRAY['Florianópolis']::text[],-27.5869,-48.5216,ARRAY['padrao','completa']::text[],true,true),
('f04b5020-5a1e-54ac-a5c9-c042baf50f90','e6aba1f2-ad06-5716-b2e6-98ed535b05e4','Profissional de limpeza em Florianópolis, 3 anos de experiência.',3,'aprovada',4.7,12,96,20,'Florianópolis','grande_floripa',ARRAY['Florianópolis']::text[],-27.6764,-48.4938,ARRAY['padrao','pos_locacao']::text[],true,true),
('bf4009ff-1213-5226-9543-8a4accd2c2d2','0a5c2b94-057a-5083-9c45-b269183890db','Profissional de limpeza em Florianópolis, 11 anos de experiência.',11,'aprovada',5.0,50,401,20,'Florianópolis','grande_floripa',ARRAY['Florianópolis']::text[],-27.436,-48.396,ARRAY['padrao','completa','pos_locacao']::text[],true,true),
('080d9f7f-7962-5048-8a61-8df10a93b439','4ab2d969-c07e-51e1-89f8-ecfabfda27a1','Profissional de limpeza em Florianópolis, 2 anos de experiência.',2,'aprovada',4.6,8,64,20,'Florianópolis','grande_floripa',ARRAY['Florianópolis']::text[],-27.5872,-48.5789,ARRAY['padrao','comercial']::text[],false,true),
('e1e46697-78a7-5a3f-b2ea-768d879eb15c','14a0d4ce-4820-56fd-9dba-7eca164b314e','Profissional de limpeza em São José, 6 anos de experiência.',6,'aprovada',4.8,18,145,20,'São José','grande_floripa',ARRAY['São José']::text[],-27.5936,-48.6122,ARRAY['padrao','completa','comercial']::text[],true,true),
('812c02d1-06e0-5a55-b788-4932599a0455','c1e3a760-9846-506c-b054-8e84136ad5b2','Profissional de limpeza em São José, 2 anos de experiência.',2,'aprovada',4.5,5,41,20,'São José','grande_floripa',ARRAY['São José']::text[],-27.6015,-48.618,ARRAY['padrao','pesada']::text[],false,true),
('b2229481-96d3-5503-8505-78c16531c4bf','2bb85e96-842c-57b4-bf66-95e6134f4217','Profissional de limpeza em Balneário Camboriú, 7 anos de experiência.',7,'aprovada',4.9,33,268,20,'Balneário Camboriú','balneario',ARRAY['Balneário Camboriú']::text[],-26.9906,-48.6348,ARRAY['padrao','pos_locacao','completa']::text[],true,true),
('28b2c237-22e6-50e1-9bd7-326d15752146','480a80a1-8a47-5b8b-aabc-1fc748e215a0','Profissional de limpeza em Balneário Camboriú, 4 anos de experiência.',4,'aprovada',4.7,15,122,20,'Balneário Camboriú','balneario',ARRAY['Balneário Camboriú']::text[],-26.98,-48.63,ARRAY['padrao','pos_locacao']::text[],false,true),
('41e4d890-0976-5da1-a7fa-ce511cb52784','798aab71-4080-587b-8c96-419c96afe180','Profissional de limpeza em Balneário Camboriú, 3 anos de experiência.',3,'aprovada',4.6,11,88,20,'Balneário Camboriú','balneario',ARRAY['Balneário Camboriú']::text[],-26.999,-48.628,ARRAY['padrao','pos_locacao','pesada']::text[],false,true),
('997815a1-18e0-5295-aa65-2e0384ebda1b','81934f50-84ce-5221-8d83-91d9ebcb218f','Profissional de limpeza em Camboriú, 5 anos de experiência.',5,'aprovada',4.8,19,153,20,'Camboriú','balneario',ARRAY['Camboriú']::text[],-27.0247,-48.6539,ARRAY['padrao','pos_locacao','comercial']::text[],false,true),
('3a42e9b5-a98a-54b7-872e-42eaa2bd79e0','c8a89c2d-aac2-5587-b116-20689eac6096','Profissional de limpeza em Itapema, 9 anos de experiência.',9,'aprovada',5.0,28,229,20,'Itapema','balneario',ARRAY['Itapema']::text[],-27.09,-48.612,ARRAY['padrao','pos_locacao','completa']::text[],true,true),
('a5b7ac2d-cd4d-56be-9963-438b1fffad27','ffacd2da-d969-5a56-98a6-8dfeec8215cd','Profissional de limpeza em Palhoça, 1 ano de experiência.',1,'pendente',0,0,0,20,'Palhoça','grande_floripa',ARRAY['Palhoça']::text[],-27.645,-48.67,ARRAY['padrao']::text[],false,true),
('01743d02-fd3a-5d1a-b76c-45d26233b707','0cc95bbf-ee81-5d91-aad8-2cb9ce6e07ea','Profissional de limpeza em Itajaí, 2 anos de experiência.',2,'pendente',0,0,0,20,'Itajaí','balneario',ARRAY['Itajaí']::text[],-26.908,-48.662,ARRAY['padrao','pos_locacao']::text[],false,true),
('2c8c199f-87eb-5032-a582-5affdd74b4c6','8a7d15c7-8c4f-53bc-852f-db75c14c3acc','Profissional de limpeza em Biguaçu, 4 anos de experiência.',4,'pendente',0,0,0,20,'Biguaçu','grande_floripa',ARRAY['Biguaçu']::text[],-27.494,-48.656,ARRAY['padrao','completa']::text[],false,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.enderecos (id, user_id, cep, rua, numero, complemento, bairro, cidade, estado, regiao, latitude, longitude, padrao) VALUES
('02d5b866-ba81-575d-bee3-98d28beab454','59889606-b539-596c-8eaa-d8b8f09e1bf1','88015-200','Rua Bocaiúva','320',NULL,'Centro','Florianópolis','SC','grande_floripa',-27.5901,-48.551,true),
('a9d51c19-168f-582c-8fbd-47e829a1eb73','81d0c83a-2e3d-5a56-8d06-3870ca944f30','88036-000','Rua Lauro Linhares','1150',NULL,'Trindade','Florianópolis','SC','grande_floripa',-27.5869,-48.5216,true),
('aabbf490-66dd-5f37-aee4-030ca8ea6312','df4cfbd3-d512-5436-9dab-5a8813bd5503','88102-100','Rua Koesa','145',NULL,'Kobrasol','São José','SC','grande_floripa',-27.5936,-48.6122,true),
('20a6d890-c6fa-5ee2-a51a-a4226eb6b9dd','4ca8fde8-4a8d-54e0-a853-f9e4e101066b','88063-000','Av. Pequeno Príncipe','2100',NULL,'Campeche','Florianópolis','SC','grande_floripa',-27.6764,-48.4938,true),
('6346f00c-7139-504b-b0f9-953112f8f69e','ec2dd938-b512-5091-84e4-470cc3c92302','88330-000','Av. Brasil','1500',NULL,'Centro','Balneário Camboriú','SC','balneario',-26.9906,-48.6348,true),
('0a72cd6b-0cf6-52ff-9170-ef77d30c4ca9','29e0344f-0296-5aab-8ee1-0fe4412ca414','88337-000','Rua 3300','210',NULL,'Nações','Balneário Camboriú','SC','balneario',-26.999,-48.628,true),
('af1fa443-9537-5c3d-a77d-651566f8cf71','ef9bbd7b-888c-518f-9a19-8397db0916ee','88220-000','Av. Nereu Ramos','880',NULL,'Meia Praia','Itapema','SC','balneario',-27.09,-48.612,true),
('bab57a91-8e4d-50a7-a823-c16ddf0b7844','c0c906f4-37c7-5d09-980e-a694610e039d','88340-000','Rua Santa Catarina','77',NULL,'Centro','Camboriú','SC','balneario',-27.0247,-48.6539,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bookings (id, cliente_id, profissional_id, endereco_id, regiao, tipo_imovel, quartos, salas, banheiros, cozinha, area_externa, outros_ambientes, duracao_horas, tipo_limpeza, data, hora, observacoes, status, valor_profissional, valor_extras, taxa_admin, valor_seguro, valor_total, checkin_em, iniciado_em, finalizado_em, criado_em) VALUES
('587b9699-09ce-540d-ad62-d567e941dfea','29e0344f-0296-5aab-8ee1-0fe4412ca414',NULL,'0a72cd6b-0cf6-52ff-9170-ef77d30c4ca9','balneario','apartamento',3,1,2,true,'nao',NULL,6,'pos_locacao',(now() + interval '8 days')::date,'08:00',NULL,'solicitada',286.5,50.0,42.98,5,334.48,NULL,NULL,NULL,now() + interval '5 days'),
('bb31cdc2-f0c5-5aab-a225-9f6ccebbec5e','59889606-b539-596c-8eaa-d8b8f09e1bf1',NULL,'02d5b866-ba81-575d-bee3-98d28beab454','grande_floripa','apartamento',2,1,1,true,'nao',NULL,4,'padrao',(now() + interval '6 days')::date,'09:00',NULL,'solicitada',130.0,0.0,19.5,5,154.5,NULL,NULL,NULL,now() + interval '3 days'),
('4ec85123-6508-59ff-a2b7-a8cfe8970173','81d0c83a-2e3d-5a56-8d06-3870ca944f30','177de0ae-4147-5ae0-861b-888c58e9611a','a9d51c19-168f-582c-8fbd-47e829a1eb73','grande_floripa','apartamento',3,1,2,true,'pequena',NULL,6,'completa',(now() + interval '4 days')::date,'13:00',NULL,'aceita',295.25,25.0,44.29,5,344.54,NULL,NULL,NULL,now() + interval '1 days'),
('4060617d-015e-5195-bb1c-fb2e401ff591','df4cfbd3-d512-5436-9dab-5a8813bd5503','e1e46697-78a7-5a3f-b2ea-768d879eb15c','aabbf490-66dd-5f37-aee4-030ca8ea6312','grande_floripa','apartamento',4,1,3,true,'media',NULL,8,'pesada',(now() + interval '10 days')::date,'08:00',NULL,'confirmada',539.0,80.0,80.85,5,624.85,NULL,NULL,NULL,now() + interval '7 days'),
('2ac8ac51-019f-5af1-b718-07e4a208d94a','ec2dd938-b512-5091-84e4-470cc3c92302','b2229481-96d3-5503-8505-78c16531c4bf','6346f00c-7139-504b-b0f9-953112f8f69e','balneario','apartamento',2,1,2,true,'nao',NULL,6,'pos_locacao',(now() + interval '14 days')::date,'09:00',NULL,'confirmada',250.0,30.0,37.5,5,292.5,NULL,NULL,NULL,now() + interval '11 days'),
('8a763e7f-fc1c-5fd5-b6cb-88ba01bb3568','4ca8fde8-4a8d-54e0-a853-f9e4e101066b','f04b5020-5a1e-54ac-a5c9-c042baf50f90','20a6d890-c6fa-5ee2-a51a-a4226eb6b9dd','grande_floripa','apartamento',2,1,1,true,'nao',NULL,4,'padrao',(now())::date,'08:00',NULL,'em_andamento',130.0,0.0,19.5,5,154.5,now() - interval '2 hours',now() - interval '90 minutes',NULL,now() - interval '3 days'),
('8dc8a1f4-873b-5c50-b9ab-0af49ddf6f4b','c0c906f4-37c7-5d09-980e-a694610e039d','997815a1-18e0-5295-aa65-2e0384ebda1b','bab57a91-8e4d-50a7-a823-c16ddf0b7844','balneario','apartamento',3,1,2,true,'pequena',NULL,6,'padrao',(now() - interval '4 days')::date,'09:00',NULL,'concluida',260.0,25.0,39.0,5,304.0,now() - interval '4 days' - interval '10 minutes',now() - interval '4 days',now() - interval '4 days' + interval '6 hours',now() - interval '7 days'),
('d1af76fa-16ef-5c0b-9ba0-5d838dfa24ae','ef9bbd7b-888c-518f-9a19-8397db0916ee','3a42e9b5-a98a-54b7-872e-42eaa2bd79e0','af1fa443-9537-5c3d-a77d-651566f8cf71','balneario','apartamento',3,1,2,true,'grande',NULL,8,'pos_locacao',(now() - interval '12 days')::date,'08:00',NULL,'concluida',448.5,80.0,67.28,5,520.78,now() - interval '12 days' - interval '10 minutes',now() - interval '12 days',now() - interval '12 days' + interval '8 hours',now() - interval '15 days'),
('777ff1da-d5cd-503f-9964-63fed2514143','59889606-b539-596c-8eaa-d8b8f09e1bf1','9608f1b0-69ce-5ac6-ade8-f4c283a0b103','02d5b866-ba81-575d-bee3-98d28beab454','grande_floripa','apartamento',2,1,1,true,'nao',NULL,4,'completa',(now() - interval '25 days')::date,'14:00',NULL,'concluida',189.5,40.0,28.43,5,222.93,now() - interval '25 days' - interval '10 minutes',now() - interval '25 days',now() - interval '25 days' + interval '4 hours',now() - interval '28 days'),
('8b50fa04-25d1-5e10-b752-421bd68996ef','81d0c83a-2e3d-5a56-8d06-3870ca944f30','812c02d1-06e0-5a55-b788-4932599a0455','a9d51c19-168f-582c-8fbd-47e829a1eb73','grande_floripa','apartamento',2,1,1,true,'nao',NULL,4,'padrao',(now() - interval '9 days')::date,'10:00',NULL,'cancelada',130.0,0.0,19.5,5,154.5,NULL,NULL,NULL,now() - interval '12 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.booking_extras (booking_id, extra_id, preco_congelado) SELECT '587b9699-09ce-540d-ad62-d567e941dfea', id, 50 FROM public.extras WHERE nome='Preparação para hóspedes';
INSERT INTO public.booking_extras (booking_id, extra_id, preco_congelado) SELECT '4ec85123-6508-59ff-a2b7-a8cfe8970173', id, 25 FROM public.extras WHERE nome='Limpeza de geladeira';
INSERT INTO public.booking_extras (booking_id, extra_id, preco_congelado) SELECT '4060617d-015e-5195-bb1c-fb2e401ff591', id, 35 FROM public.extras WHERE nome='Limpeza de janelas';
INSERT INTO public.booking_extras (booking_id, extra_id, preco_congelado) SELECT '4060617d-015e-5195-bb1c-fb2e401ff591', id, 45 FROM public.extras WHERE nome='Passar roupas';
INSERT INTO public.booking_extras (booking_id, extra_id, preco_congelado) SELECT '2ac8ac51-019f-5af1-b718-07e4a208d94a', id, 30 FROM public.extras WHERE nome='Troca de roupa de cama e banho';
INSERT INTO public.booking_extras (booking_id, extra_id, preco_congelado) SELECT '8dc8a1f4-873b-5c50-b9ab-0af49ddf6f4b', id, 25 FROM public.extras WHERE nome='Limpeza de forno';
INSERT INTO public.booking_extras (booking_id, extra_id, preco_congelado) SELECT 'd1af76fa-16ef-5c0b-9ba0-5d838dfa24ae', id, 50 FROM public.extras WHERE nome='Preparação para hóspedes';
INSERT INTO public.booking_extras (booking_id, extra_id, preco_congelado) SELECT 'd1af76fa-16ef-5c0b-9ba0-5d838dfa24ae', id, 30 FROM public.extras WHERE nome='Limpeza de varanda';
INSERT INTO public.booking_extras (booking_id, extra_id, preco_congelado) SELECT '777ff1da-d5cd-503f-9964-63fed2514143', id, 40 FROM public.extras WHERE nome='Organização de ambientes';

INSERT INTO public.avaliacoes (id, booking_id, avaliador_id, avaliado_id, nota, pontualidade, qualidade, cordialidade, comentario, criado_em) VALUES
('63820f16-e88e-58af-9523-7f96b28b8e8d','8dc8a1f4-873b-5c50-b9ab-0af49ddf6f4b','c0c906f4-37c7-5d09-980e-a694610e039d','81934f50-84ce-5221-8d83-91d9ebcb218f',5,5,5,5,'Chegou no horário e deixou tudo impecável. Recomendo!',now() - interval '3 days'),
('d0adc3f8-605a-51c5-9523-f599920445f7','d1af76fa-16ef-5c0b-9ba0-5d838dfa24ae','ef9bbd7b-888c-518f-9a19-8397db0916ee','c8a89c2d-aac2-5587-b116-20689eac6096',5,5,5,4,'Apartamento pronto para os hóspedes, muito atenciosa.',now() - interval '11 days'),
('59a8a60d-b5a0-56d9-a658-9ed35e20409e','777ff1da-d5cd-503f-9964-63fed2514143','59889606-b539-596c-8eaa-d8b8f09e1bf1','14d0414c-fe20-518b-8c07-f08201a6fd71',4,4,5,5,'Ótimo serviço, só atrasou alguns minutos.',now() - interval '24 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lista_espera (id, email, cidade, criado_em) VALUES
('3202846c-4565-54f3-bb58-d4a09e979f8a','marcos.vieira@exemplo.com','Joinville', now() - interval '2 days'),
('5d046a88-d92f-5f79-a882-f4dbd1c93bbf','carla.dias@exemplo.com','Joinville', now() - interval '5 days'),
('61fecc9c-e058-5f3c-b613-77fdc5f1c1d1','renata.lopes@exemplo.com','Blumenau', now() - interval '8 days'),
('5c8c1db5-1808-57de-b995-3b496bd10cae','paulo.henrique@exemplo.com','Curitiba', now() - interval '11 days'),
('73c7a7db-904e-563e-a7fd-4e10c61cb50d','julia.matos@exemplo.com','Joinville', now() - interval '14 days'),
('95fcd3b8-56b3-53e5-b897-917317debeb6','sergio.brito@exemplo.com','Blumenau', now() - interval '17 days'),
('9deca1f0-e46d-5f55-8b61-9f23fedcacfe','ana.paula@exemplo.com','Porto Alegre', now() - interval '20 days')
ON CONFLICT (id) DO NOTHING;

UPDATE public.profissionais SET nota_media=4.9, total_avaliacoes=39 WHERE id='9608f1b0-69ce-5ac6-ade8-f4c283a0b103';
UPDATE public.profissionais SET nota_media=4.8, total_avaliacoes=23 WHERE id='177de0ae-4147-5ae0-861b-888c58e9611a';
UPDATE public.profissionais SET nota_media=4.7, total_avaliacoes=12 WHERE id='f04b5020-5a1e-54ac-a5c9-c042baf50f90';
UPDATE public.profissionais SET nota_media=5.0, total_avaliacoes=50 WHERE id='bf4009ff-1213-5226-9543-8a4accd2c2d2';
UPDATE public.profissionais SET nota_media=4.6, total_avaliacoes=8 WHERE id='080d9f7f-7962-5048-8a61-8df10a93b439';
UPDATE public.profissionais SET nota_media=4.8, total_avaliacoes=18 WHERE id='e1e46697-78a7-5a3f-b2ea-768d879eb15c';
UPDATE public.profissionais SET nota_media=4.5, total_avaliacoes=5 WHERE id='812c02d1-06e0-5a55-b788-4932599a0455';
UPDATE public.profissionais SET nota_media=4.9, total_avaliacoes=33 WHERE id='b2229481-96d3-5503-8505-78c16531c4bf';
UPDATE public.profissionais SET nota_media=4.7, total_avaliacoes=15 WHERE id='28b2c237-22e6-50e1-9bd7-326d15752146';
UPDATE public.profissionais SET nota_media=4.6, total_avaliacoes=11 WHERE id='41e4d890-0976-5da1-a7fa-ce511cb52784';
UPDATE public.profissionais SET nota_media=4.8, total_avaliacoes=19 WHERE id='997815a1-18e0-5295-aa65-2e0384ebda1b';
UPDATE public.profissionais SET nota_media=5.0, total_avaliacoes=28 WHERE id='3a42e9b5-a98a-54b7-872e-42eaa2bd79e0';
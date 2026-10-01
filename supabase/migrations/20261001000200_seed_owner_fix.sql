-- ============================================================
-- Миграция 6: сидинг демо-данных совместим с триггером владельца.
--
-- Найдено скриптом скриншотов на production: новый пользователь получал
-- пустое приложение. Миграция 4 добавила триггер handle_new_org (создатель →
-- участник-подписант), а seed_demo_data создавал организации без created_by →
-- insert в org_members с user_id = NULL падал → исключение проглатывалось
-- обработчиком в handle_new_user (фикс аудита F-02) → регистрация проходила,
-- данные — нет. Два правильных по отдельности решения сломали друг друга.
-- ============================================================

begin;

-- триггер владельца не должен падать на организациях без создателя
create or replace function public.handle_new_org()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into org_members (org_id, user_id, role) values (new.id, new.created_by, 'signer')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

-- сидинг: организации с владельцем; членства остаются как были
-- (владелец-подписант в А и Б, в В — оператор без права подписи для демо ролей)
create or replace function public.seed_demo_data(uid uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  org_a uuid; org_b uuid; org_c uuid;
begin
  insert into organizations (name, created_by) values ('Компания А', uid) returning id into org_a;
  insert into organizations (name, created_by) values ('Компания Б', uid) returning id into org_b;
  insert into organizations (name) values ('Компания В') returning id into org_c;

  insert into org_members (org_id, user_id, role) values
    (org_a, uid, 'signer'),
    (org_b, uid, 'signer'),
    (org_c, uid, 'operator')
  on conflict (org_id, user_id) do update set role = excluded.role;

  insert into documents (org_id, counterparty, title, kind, sum, received_at, status, unread) values
    (org_a, 'ООО «ГетБлоггер»',    'УПД № 260810/54',   'УПД',  89800, now() - interval '2 hours', 'requires_signature', true),
    (org_b, 'ООО «ВебсайтСофт»',   'Акт сверки № 809',  'Акт',  null,  now() - interval '3 hours', 'requires_signature', true),
    (org_c, 'ООО «Крипто-Тест»',   'УПД № 4451/2',      'УПД',  31200, now() - interval '4 hours', 'requires_signature', true),
    (org_c, 'АО «ПФ «СКБ Контур»', 'Счёт № 31958300',   'Счёт', 26900, now() - interval '1 day',   'info',   false),
    (org_a, 'ООО «Аренда-Сервис»', 'Акт № 31 от 31.07', 'Акт',  54000, now() - interval '1 day',   'signed', false),
    (org_b, 'ООО «Клауд Хостинг»', 'УПД № 8807/2',      'УПД',  12400, now() - interval '2 days',  'signed', false);
end;
$$;
revoke execute on function public.seed_demo_data(uuid) from public, anon, authenticated;

-- досеять пользователей, зарегистрированных в период поломки (без организаций)
do $$
declare u record;
begin
  for u in select id from auth.users where not exists (select 1 from org_members m where m.user_id = auth.users.id) loop
    perform public.seed_demo_data(u.id);
  end loop;
end;
$$;

commit;

-- ============================================================
-- Миграция 3 (ДЗ-6): исправления по аудиту безопасности,
-- health-check для мониторинга, централизованные клиентские логи.
-- Применять после миграций 1 и 2 одним запуском.
-- ============================================================

begin;

-- ---------- F-01: служебные функции не должны быть вызываемы через RPC ----------
-- В PostgreSQL EXECUTE на функции по умолчанию есть у PUBLIC, а PostgREST публикует
-- всё из схемы public как /rest/v1/rpc/<name>. seed_demo_data любой залогиненный
-- мог вызывать в цикле (DoS квоты Free-tier).
revoke execute on function public.seed_demo_data(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user()    from public, anon, authenticated;
revoke execute on function public.is_member(uuid)      from public, anon;

-- ---------- F-08: анонимам — ни SELECT, ни OpenAPI-описания таблиц ----------
-- Раньше anon получал пустой 200 (RLS без политик); теперь — 401/403.
revoke all on all tables in schema public from anon;

-- ---------- F-09: user_id других членов организации не раскрываем ----------
revoke select on public.sign_attempts from authenticated;
grant  select (id, document_id, attempted_at, success, detail) on public.sign_attempts to authenticated;

-- ---------- F-10: удаление пользователя не должно падать на FK журнала ----------
alter table public.sign_attempts alter column user_id drop not null;
alter table public.sign_attempts drop constraint sign_attempts_user_id_fkey;
alter table public.sign_attempts
  add constraint sign_attempts_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;

-- ---------- F-02: идемпотентный сидинг, не ломающий регистрацию ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from org_members where user_id = new.id) then
    perform public.seed_demo_data(new.id);
  end if;
  return new;
exception when others then
  -- ошибка сидинга не должна превращать /auth/v1/signup в HTTP 500
  raise warning 'seed_demo_data failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- F-04: подписание без гонки (TOCTOU) ----------
create or replace function public.sign_document(doc_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  d public.documents;
begin
  -- for update: параллельный вызов ждёт и увидит уже изменённый статус
  select * into d from documents where id = doc_id and is_member(org_id) for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Документ не найден');
  end if;

  if not exists (
    select 1 from org_members
    where org_id = d.org_id and user_id = auth.uid() and role = 'signer'
  ) then
    insert into sign_attempts (document_id, user_id, success, detail)
    values (doc_id, auth.uid(), false, 'отказ: роль без права подписи');
    return jsonb_build_object('ok', false, 'error', 'Подписание доступно только роли «Подписант»');
  end if;

  -- защитное условие по статусу прямо в update — вторая линия против гонки
  update documents set status = 'signed', unread = false
  where id = doc_id and status = 'requires_signature'
  returning * into d;
  if not found then
    insert into sign_attempts (document_id, user_id, success, detail)
    values (doc_id, auth.uid(), false, 'отказ: документ не требует подписи');
    return jsonb_build_object('ok', false, 'error', 'Документ не требует подписи');
  end if;

  insert into sign_attempts (document_id, user_id, success)
  values (doc_id, auth.uid(), true);

  return jsonb_build_object('ok', true, 'document', to_jsonb(d));
end;
$$;
revoke execute on function public.sign_document(uuid) from public, anon;
grant  execute on function public.sign_document(uuid) to authenticated;

-- ---------- Health check (ДЗ-6, Шаг 6) ----------
-- GET /rest/v1/rpc/health?apikey=<publishable> — без входа, для внешнего мониторинга.
-- stable → PostgREST разрешает GET; security definer → считает по таблицам под RLS.
create or replace function public.health()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  docs bigint;
begin
  select count(*) into docs from documents;
  return jsonb_build_object(
    'status', 'ok',
    'service', 'docflow-db',
    'time', now(),
    'checks', jsonb_build_object(
      'database', 'ok',
      'documents_total', docs,
      'auth_users_reachable', (select count(*) >= 0 from auth.users)
    )
  );
end;
$$;
revoke execute on function public.health() from public;
grant  execute on function public.health() to anon, authenticated;

-- ---------- Централизованные клиентские логи (ДЗ-6, Шаг 7) ----------
-- Фронтенд пишет сюда записи уровня warn/error (см. src/lib/logger.ts).
create table public.client_logs (
  id       bigint generated always as identity primary key,
  ts       timestamptz not null default now(),
  level    text not null check (level in ('warn', 'error')),
  event    text not null,
  context  jsonb not null default '{}'::jsonb,
  user_id  uuid references auth.users (id) on delete set null,
  ua       text
);
create index client_logs_ts_idx on public.client_logs (ts desc);

alter table public.client_logs enable row level security;
revoke all on public.client_logs from anon, authenticated;
grant insert (level, event, context, user_id, ua) on public.client_logs to authenticated;
grant select on public.client_logs to authenticated;

-- писать можно только от своего имени; читать — только свои записи
create policy "пользователь пишет свои логи"
  on public.client_logs for insert to authenticated
  with check (user_id = auth.uid());
create policy "пользователь читает свои логи"
  on public.client_logs for select to authenticated
  using (user_id = auth.uid());

commit;

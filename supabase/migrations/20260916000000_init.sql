-- ============================================================
-- ДокПоток: схема БД (ДЗ-5, Шаги 1 и 3)
-- Применяется в Supabase SQL Editor одним запуском (или supabase db push).
-- Сущности: organizations ←→ org_members (роли) ←→ auth.users;
--           documents → organizations; sign_attempts → documents (журнал).
-- ============================================================

-- ---------- Таблицы ----------

create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- Роли из ТЗ (F-1): operator — чтение/отметки; signer — + подписание;
-- accountant — только чтение (в демо не выдаётся).
create type public.member_role as enum ('operator', 'signer', 'accountant');

create table public.org_members (
  org_id  uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role    public.member_role not null default 'operator',
  primary key (org_id, user_id)
);

create type public.doc_status as enum ('requires_signature', 'signed', 'info');

create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  counterparty text not null,
  title        text not null,
  kind         text not null check (kind in ('УПД', 'Акт', 'Счёт', 'Договор')),
  sum          numeric(14, 2),                       -- сумма без НДС; может отсутствовать
  received_at  timestamptz not null default now(),
  status       public.doc_status not null default 'info',
  unread       boolean not null default true
);

create index documents_org_received_idx on public.documents (org_id, received_at desc);

-- Журнал подписаний (ТЗ, F-5): append-only — политик update/delete нет вовсе.
create table public.sign_attempts (
  id           bigint generated always as identity primary key,
  document_id  uuid not null references public.documents (id) on delete cascade,
  user_id      uuid not null references auth.users (id),
  attempted_at timestamptz not null default now(),
  success      boolean not null,
  detail       text
);

-- ---------- Права уровня колонок ----------
-- Клиент не может менять статус документа напрямую: единственный путь к
-- подписанию — RPC sign_document (перенос правила 8 из CLAUDE.md на уровень БД).

revoke insert, update, delete on
  public.organizations, public.org_members, public.documents, public.sign_attempts
from anon, authenticated;

grant update (unread) on public.documents to authenticated; -- пометка «прочитан»

-- ---------- Row Level Security ----------

-- security definer, чтобы политики могли проверять членство без рекурсии RLS
create or replace function public.is_member(org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from org_members where org_id = org and user_id = auth.uid()
  );
$$;

alter table public.organizations enable row level security;
alter table public.org_members   enable row level security;
alter table public.documents     enable row level security;
alter table public.sign_attempts enable row level security;

create policy "члены видят свои организации"
  on public.organizations for select to authenticated
  using (public.is_member(id));

create policy "пользователь видит свои членства"
  on public.org_members for select to authenticated
  using (user_id = auth.uid());

create policy "члены видят документы своих организаций"
  on public.documents for select to authenticated
  using (public.is_member(org_id));

create policy "члены помечают документы прочитанными"
  on public.documents for update to authenticated
  using (public.is_member(org_id))
  with check (public.is_member(org_id));

create policy "члены видят журнал подписаний своих организаций"
  on public.sign_attempts for select to authenticated
  using (exists (
    select 1 from public.documents d
    where d.id = document_id and public.is_member(d.org_id)
  ));

-- анонимам не выдано ни одной политики: без входа данных нет вообще.

-- ---------- RPC: подписание (ТЗ, F-5) ----------

create or replace function public.sign_document(doc_id uuid)
returns public.documents
language plpgsql security definer set search_path = public
as $$
declare
  d public.documents;
begin
  select * into d from documents where id = doc_id and is_member(org_id);
  if not found then
    raise exception 'Документ не найден'; -- либо не существует, либо чужой (не раскрываем)
  end if;

  if not exists (
    select 1 from org_members
    where org_id = d.org_id and user_id = auth.uid() and role = 'signer'
  ) then
    insert into sign_attempts (document_id, user_id, success, detail)
    values (doc_id, auth.uid(), false, 'отказ: роль без права подписи');
    raise exception 'Подписание доступно только роли «Подписант»';
  end if;

  if d.status <> 'requires_signature' then
    raise exception 'Документ не требует подписи';
  end if;

  update documents set status = 'signed', unread = false
  where id = doc_id
  returning * into d;

  insert into sign_attempts (document_id, user_id, success)
  values (doc_id, auth.uid(), true);

  return d;
end;
$$;

revoke execute on function public.sign_document(uuid) from anon;
grant  execute on function public.sign_document(uuid) to authenticated;

-- ---------- Демо-данные для каждого нового пользователя ----------
-- При регистрации пользователь получает 3 организации и комплект документов;
-- в «Компании В» он operator (без права подписи) — для живой проверки политики.

-- Сидинг вынесен в отдельную функцию: её можно вызвать и для уже существующего
-- пользователя (например, после пересоздания схемы), не только из триггера.
create or replace function public.seed_demo_data(uid uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  org_a uuid; org_b uuid; org_c uuid;
begin
  insert into organizations (name) values ('Компания А') returning id into org_a;
  insert into organizations (name) values ('Компания Б') returning id into org_b;
  insert into organizations (name) values ('Компания В') returning id into org_c;

  insert into org_members (org_id, user_id, role) values
    (org_a, uid, 'signer'),
    (org_b, uid, 'signer'),
    (org_c, uid, 'operator');

  insert into documents (org_id, counterparty, title, kind, sum, received_at, status, unread) values
    (org_a, 'ООО «ГетБлоггер»',    'УПД № 260810/54',   'УПД',  89800, now() - interval '2 hours', 'requires_signature', true),
    (org_b, 'ООО «ВебсайтСофт»',   'Акт сверки № 809',  'Акт',  null,  now() - interval '3 hours', 'requires_signature', true),
    (org_c, 'ООО «Крипто-Тест»',   'УПД № 4451/2',      'УПД',  31200, now() - interval '4 hours', 'requires_signature', true),
    (org_c, 'АО «ПФ «СКБ Контур»', 'Счёт № 31958300',   'Счёт', 26900, now() - interval '1 day',   'info',   false),
    (org_a, 'ООО «Аренда-Сервис»', 'Акт № 31 от 31.07', 'Акт',  54000, now() - interval '1 day',   'signed', false),
    (org_b, 'ООО «Клауд Хостинг»', 'УПД № 8807/2',      'УПД',  12400, now() - interval '2 days',  'signed', false);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.seed_demo_data(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

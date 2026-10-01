-- ============================================================
-- Миграция 4 (проектная работа): CRUD организаций, участники по email,
-- ручное добавление документов с валидацией, файловое хранилище (PDF).
-- Применять после миграций 1–3 одним запуском.
-- ============================================================

begin;

-- ---------- Организации: владелец и CRUD ----------

alter table public.organizations
  add column if not exists created_by uuid references auth.users (id) on delete set null;

-- для существующих демо-организаций владелец = их подписант
update public.organizations o
set created_by = (select m.user_id from public.org_members m where m.org_id = o.id and m.role = 'signer' limit 1)
where created_by is null;

alter table public.organizations
  add constraint organizations_name_len check (char_length(trim(name)) between 2 and 80);

create or replace function public.is_owner(org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from organizations where id = org and created_by = auth.uid());
$$;
revoke execute on function public.is_owner(uuid) from public, anon;
grant  execute on function public.is_owner(uuid) to authenticated;

grant insert (name, created_by), update (name), delete on public.organizations to authenticated;

create policy "пользователь создаёт организацию"
  on public.organizations for insert to authenticated
  with check (created_by = auth.uid());
create policy "владелец переименовывает организацию"
  on public.organizations for update to authenticated
  using (public.is_owner(id)) with check (created_by = auth.uid());
create policy "владелец удаляет организацию"
  on public.organizations for delete to authenticated
  using (public.is_owner(id));

-- создатель организации автоматически становится её подписантом
create or replace function public.handle_new_org()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into org_members (org_id, user_id, role) values (new.id, new.created_by, 'signer')
  on conflict do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_org() from public, anon, authenticated;
create trigger on_org_created after insert on public.organizations
  for each row execute function public.handle_new_org();

-- ---------- Участники: владелец видит, добавляет по email, удаляет ----------

create policy "владелец видит участников своих организаций"
  on public.org_members for select to authenticated
  using (public.is_owner(org_id));

grant delete on public.org_members to authenticated;
create policy "владелец удаляет участников (кроме себя)"
  on public.org_members for delete to authenticated
  using (public.is_owner(org_id) and user_id <> auth.uid());

-- email живёт в auth.users, клиенту недоступной → только через RPC
create or replace function public.add_member_by_email(org uuid, member_email text, member_role public.member_role)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid;
begin
  if not public.is_owner(org) then
    return jsonb_build_object('ok', false, 'error', 'Добавлять участников может только владелец организации');
  end if;
  select id into uid from auth.users where lower(email) = lower(trim(member_email));
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Пользователь с таким email не зарегистрирован в ДокПотоке');
  end if;
  insert into org_members (org_id, user_id, role) values (org, uid, member_role)
  on conflict (org_id, user_id) do update set role = excluded.role;
  return jsonb_build_object('ok', true, 'member', jsonb_build_object('user_id', uid, 'email', lower(trim(member_email)), 'role', member_role));
end;
$$;
revoke execute on function public.add_member_by_email(uuid, text, public.member_role) from public, anon;
grant  execute on function public.add_member_by_email(uuid, text, public.member_role) to authenticated;

-- список участников с email (для владельца и самих участников)
create or replace function public.list_members(org uuid)
returns table (user_id uuid, email text, role public.member_role)
language sql stable security definer set search_path = public
as $$
  select m.user_id, u.email::text, m.role
  from org_members m join auth.users u on u.id = m.user_id
  where m.org_id = org and public.is_member(org)
  order by m.role desc, u.email;
$$;
revoke execute on function public.list_members(uuid) from public, anon;
grant  execute on function public.list_members(uuid) to authenticated;

-- ---------- Документы: ручное добавление, файл, удаление, валидация ----------

alter table public.documents
  add column if not exists file_path text,
  add column if not exists created_by uuid references auth.users (id) on delete set null;

alter table public.documents
  add constraint documents_title_len check (char_length(trim(title)) between 3 and 120),
  add constraint documents_counterparty_len check (char_length(trim(counterparty)) between 2 and 120),
  add constraint documents_sum_nonneg check (sum is null or sum >= 0),
  add constraint documents_file_path_fmt check (file_path is null or file_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.pdf$');

grant insert (org_id, counterparty, title, kind, sum, received_at, status, created_by) on public.documents to authenticated;
grant update (unread, file_path) on public.documents to authenticated;
grant delete on public.documents to authenticated;

create policy "члены добавляют документы в свою организацию"
  on public.documents for insert to authenticated
  with check (public.is_member(org_id) and created_by = auth.uid() and status <> 'signed');
create policy "владелец удаляет неподписанные документы"
  on public.documents for delete to authenticated
  using (public.is_owner(org_id) and status <> 'signed');

-- ---------- Файловое хранилище: приватный bucket, доступ по членству ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- путь файла: <org_id>/<document_id>.pdf — первая папка = организация
create policy "члены загружают PDF своей организации"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.is_member((storage.foldername(name))[1]::uuid));
create policy "члены читают PDF своей организации"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.is_member((storage.foldername(name))[1]::uuid));
create policy "владелец удаляет PDF"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and public.is_owner((storage.foldername(name))[1]::uuid));

commit;

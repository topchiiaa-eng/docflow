-- ============================================================
-- Миграция 2: sign_document возвращает jsonb {ok, error, document}
-- вместо raise exception.
--
-- Причина (найдено API-тестами, ДЗ-5 Шаг 8): raise exception откатывает
-- транзакцию функции целиком, включая insert в sign_attempts перед ним, —
-- отказы в журнал не попадали. Теперь отказ фиксируется и коммитится,
-- а клиент получает {ok:false, error}. Business-ошибки идут с HTTP 200 —
-- это осознанный компромисс RPC-стиля ради сохранности журнала.
-- ============================================================

begin;

create or replace function public.sign_document(doc_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  d public.documents;
begin
  select * into d from documents where id = doc_id and is_member(org_id);
  if not found then
    -- не раскрываем, существует ли чужой документ
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

  if d.status <> 'requires_signature' then
    insert into sign_attempts (document_id, user_id, success, detail)
    values (doc_id, auth.uid(), false, 'отказ: документ не требует подписи');
    return jsonb_build_object('ok', false, 'error', 'Документ не требует подписи');
  end if;

  update documents set status = 'signed', unread = false
  where id = doc_id
  returning * into d;

  insert into sign_attempts (document_id, user_id, success)
  values (doc_id, auth.uid(), true);

  return jsonb_build_object('ok', true, 'document', to_jsonb(d));
end;
$$;

revoke execute on function public.sign_document(uuid) from anon;
grant  execute on function public.sign_document(uuid) to authenticated;

commit;

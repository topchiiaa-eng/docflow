/** Чистые функции аутентификации (без React) */

/** Ошибка, с которой Supabase вернул после неудачного OAuth (…#error=…&error_description=…) */
export function parseOAuthError(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  if (!params.get('error')) return null
  const code = params.get('error_code') ?? params.get('error')
  const map: Record<string, string> = {
    access_denied: 'Вход через Google отменён',
    server_error: 'Провайдер входа временно недоступен',
    provider_email_needs_verification: 'Подтвердите email в аккаунте Google',
  }
  return map[code ?? ''] ?? 'Не удалось войти через внешнего провайдера'
}

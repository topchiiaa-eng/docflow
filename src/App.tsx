import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { EdoProvider } from './types'
import { provider as appProvider } from './api'
import { Layout } from './components/Layout'
import { InboxPage } from './pages/InboxPage'
import { JournalPage } from './pages/JournalPage'
import { OrganizationsPage } from './pages/OrganizationsPage'

// Единственный экземпляр на модуль (из src/api): дефолт, создающий провайдер
// в параметрах компонента, порождал бы НОВЫЙ объект на каждый рендер и через
// зависимости эффектов зацикливал загрузку (баг, найденный по логам консоли в ДЗ-4).
const defaultProvider = appProvider

interface AppProps {
  provider?: EdoProvider
  userEmail?: string | null
  displayName?: string | null
  onLogout?: (() => void) | null
}

/**
 * Корень приложения: HashRouter (GitHub Pages не умеет SPA-fallback для
 * history-роутинга) + 4 экрана внутри общего каркаса.
 */
export default function App({
  provider = defaultProvider,
  userEmail = null,
  displayName = null,
  onLogout = null,
}: AppProps) {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout userEmail={userEmail} displayName={displayName} onLogout={onLogout} />}>
          <Route index element={<InboxPage provider={provider} mode="inbox" />} />
          <Route path="sign" element={<InboxPage provider={provider} mode="sign" />} />
          <Route path="journal" element={<JournalPage provider={provider} />} />
          <Route path="organizations" element={<OrganizationsPage provider={provider} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

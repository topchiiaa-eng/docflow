import { createMockProvider } from './mockProvider'
import { createSupabaseClient, createSupabaseLogSink, createSupabaseProvider } from './supabaseProvider'
import { log } from '../lib/logger'
import { initAnalytics } from '../lib/analytics'

/**
 * Выбор источника данных: если в окружении заданы VITE_SUPABASE_URL и
 * VITE_SUPABASE_ANON_KEY — реальный бэкенд (Supabase), иначе демо-режим
 * на мок-провайдере (тесты и локальная разработка без бэкенда).
 */
export const supabase = createSupabaseClient()
export const isDemo = supabase === null
export const provider = supabase ? createSupabaseProvider(supabase) : createMockProvider()

// Централизованное хранение логов и аналитика включаются только с реальным бэкендом
if (supabase) log.addSink(createSupabaseLogSink(supabase))
initAnalytics()

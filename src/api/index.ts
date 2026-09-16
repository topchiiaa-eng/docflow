import { createMockProvider } from './mockProvider'
import { createSupabaseClient, createSupabaseProvider } from './supabaseProvider'

/**
 * Выбор источника данных: если в окружении заданы VITE_SUPABASE_URL и
 * VITE_SUPABASE_ANON_KEY — реальный бэкенд (Supabase), иначе демо-режим
 * на мок-провайдере (тесты и локальная разработка без бэкенда).
 */
export const supabase = createSupabaseClient()
export const isDemo = supabase === null
export const provider = supabase ? createSupabaseProvider(supabase) : createMockProvider()

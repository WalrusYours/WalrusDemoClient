import { httpApi, setToken, setUnauthorizedHandler } from './http'
import { mockApi } from './mock'
import type { HostApi } from './types'

// VITE_API_MODE=http talks to the app server; anything else (the default) uses the mock.
export const api: HostApi = import.meta.env.VITE_API_MODE === 'http' ? httpApi : mockApi
export const isMock = api === mockApi

// The mock has no sessions, so these only matter in http mode.
export const setAuthToken: (t: string | null) => void = isMock ? () => {} : setToken
export const onSessionRejected: (fn: () => void) => void = isMock
  ? () => {}
  : setUnauthorizedHandler

export * from './types'

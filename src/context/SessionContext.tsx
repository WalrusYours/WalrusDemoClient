import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api'
import type { KnobConfig, KnobValues, Profile } from '../api'
import { personas } from '../data/personas'
import { useAuth } from './AuthContext'

interface SessionContextValue {
  userId: string
  setUserId: (id: string) => void
  config: KnobConfig | null
  knobs: KnobValues
  preset: string | null
  /** False until the knob config and the persona's profile have both loaded. */
  ready: boolean
  setKnob: (id: string, value: number) => void
  applyPreset: (id: string) => void
  /** Persist the current knobs; call when the user stops dragging. */
  commit: () => void
  /** Put the given knobs back to their defaults and save, in one step. */
  resetKnobs: (ids: string[]) => void
  /** Set one knob and save, in one step: for toggles and choices, which have no drag. */
  saveKnob: (id: string, value: number) => void
  saveState: SaveState
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [userId, setUserId] = useState(user?.id ?? personas[0].id)
  const [config, setConfig] = useState<KnobConfig | null>(null)
  const [knobs, setKnobs] = useState<KnobValues>({})
  const [preset, setPreset] = useState<string | null>(null)
  const [profileUser, setProfileUser] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const latest = useRef({ userId, knobs, preset })
  useEffect(() => {
    latest.current = { userId, knobs, preset }
  })

  useEffect(() => {
    api.getKnobConfig().then(setConfig, console.error)
  }, [])

  useEffect(() => {
    let cancelled = false
    api.getProfile(userId).then(
      (profile) => {
        if (cancelled) return
        setKnobs(profile.knobs)
        setPreset(profile.preset)
        setProfileUser(userId)
      },
      console.error,
    )
    return () => {
      cancelled = true
    }
  }, [userId])

  const setKnob = useCallback((id: string, value: number) => {
    setKnobs((prev) => ({ ...prev, [id]: value }))
    setPreset(null) // moving a slider deselects the preset
  }, [])

  const persist = useCallback((patch: Partial<Profile>) => {
    setSaveState('saving')
    api.saveProfile(latest.current.userId, patch).then(
      () => setSaveState('saved'),
      () => setSaveState('error'),
    )
  }, [])

  const applyPreset = useCallback(
    (id: string) => {
      const p = config?.presets.find((x) => x.id === id)
      if (!p) return
      setKnobs({ ...p.knobs })
      setPreset(p.id)
      persist({ knobs: p.knobs, preset: p.id })
    },
    [config, persist],
  )

  const commit = useCallback(() => {
    const { knobs: k, preset: p } = latest.current
    persist({ knobs: k, preset: p })
  }, [persist])

  // Not setKnob + commit: commit reads the last render's knobs, so it would save the old values.
  const resetKnobs = useCallback(
    (ids: string[]) => {
      if (!config) return
      const next = { ...latest.current.knobs }
      for (const id of ids) {
        const def = config.knobs.find((k) => k.id === id)
        if (def) next[id] = def.default
      }
      setKnobs(next)
      setPreset(null)
      persist({ knobs: next, preset: null })
    },
    [config, persist],
  )

  const saveKnob = useCallback(
    (id: string, value: number) => {
      const next = { ...latest.current.knobs, [id]: value }
      setKnobs(next)
      setPreset(null)
      persist({ knobs: next, preset: null })
    },
    [persist],
  )

  const value = useMemo<SessionContextValue>(
    () => ({
      userId,
      setUserId,
      config,
      knobs,
      preset,
      ready: config !== null && profileUser === userId,
      setKnob,
      applyPreset,
      commit,
      resetKnobs,
      saveKnob,
      saveState,
    }),
    [userId, config, knobs, preset, profileUser, setKnob, applyPreset, commit, resetKnobs, saveKnob, saveState],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}

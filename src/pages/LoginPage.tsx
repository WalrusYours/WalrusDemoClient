import { useState } from 'react'
import type { FormEvent } from 'react'
import { isMock, USERNAME_RE } from '../api'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/ui/Logo'
import { personas } from '../data/personas'

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const name = username.trim().toLowerCase()
  const valid = USERNAME_RE.test(name)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      await login(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-[var(--bg)] px-4 py-8 text-[var(--text)] lg:flex-row lg:gap-16">
      <div className="max-w-md text-center lg:text-left">
        <Logo className="mx-auto mb-2 h-16 w-16 lg:mx-0" />
        <h1 className="text-4xl font-bold tracking-tight text-primary lg:text-5xl">Visagemanuscript</h1>
        <p className="mt-3 text-xl lg:text-2xl">Connect with friends and the world around you on Visagemanuscript.</p>
      </div>
      <form onSubmit={submit} className="w-full max-w-[400px] space-y-4 rounded-lg bg-[var(--container)] p-5 shadow-xl">
        <p className="text-center text-sm text-[var(--text-muted)]">
          Pick a username to continue. New names are created on the spot; there is no password.
        </p>
        {isMock && (
          <p className="rounded bg-amber-500/10 px-2 py-1 text-center text-xs text-amber-400">
            mock data, WALRUS not connected
          </p>
        )}
        <div className="space-y-2">
          <input
            id="username"
            aria-label="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError(null)
            }}
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={20}
            placeholder="Username (maya)"
            aria-invalid={username !== '' && !valid}
            aria-describedby="username-hint"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-[17px] text-[var(--text)] placeholder:text-[var(--placeholder)] outline-none focus:border-primary"
          />
          <p
            id="username-hint"
            className={`text-xs ${username !== '' && !valid ? 'text-lightred' : 'text-[var(--text-muted)]'}`}
          >
            3 to 20 characters: letters, digits or underscore.
          </p>
          {error && (
            <p role="alert" className="text-sm text-lightred">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={!valid || busy}
          className="w-full rounded-md bg-primary px-4 py-3 text-lg font-bold text-white transition-colors hover:bg-primaryfocus disabled:opacity-40"
        >
          {busy ? 'Signing in...' : 'Log in'}
        </button>
        <div className="space-y-2 border-t border-[var(--border)] pt-4">
          <p className="text-center text-xs text-[var(--text-muted)]">Demo users with a history</p>
          <div className="flex flex-wrap justify-center gap-2">
            {personas.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.blurb}
                onClick={() => {
                  setUsername(p.id)
                  setError(null)
                }}
                className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text)] hover:bg-[var(--surface-active)]"
              >
                {p.id}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  )
}

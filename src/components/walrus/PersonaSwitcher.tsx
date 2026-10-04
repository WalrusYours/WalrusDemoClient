import { useSession } from '../../context/SessionContext'
import { personas } from '../../data/personas'

export function PersonaSwitcher() {
  const { userId, setUserId } = useSession()

  return (
    <select
      value={userId}
      onChange={(e) => setUserId(e.target.value)}
      aria-label="Viewing as"
      className="rounded-full border border-[var(--border)] bg-[var(--container)] px-3 py-1.5 text-sm text-[var(--text)]"
    >
      {personas.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}: {p.blurb}
        </option>
      ))}
    </select>
  )
}

import { Link, NavLink, Outlet } from 'react-router-dom'
import { isMock } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { personas } from '../../data/personas'
import { Avatar } from '../ui/Avatar'
import { HomeIcon, MusicIcon, PlayIcon, SearchIcon, StoreIcon, UsersIcon } from '../ui/icons'
import { Logo } from '../ui/Logo'
import { UserMenu } from './UserMenu'

// Only Home goes anywhere. The other tabs are there so the bar looks like the real thing.
const decorativeTabs = [
  { label: 'Friends', Icon: UsersIcon },
  { label: 'Watch', Icon: PlayIcon },
  { label: 'Marketplace', Icon: StoreIcon },
]

const shortcuts = ['Friends', 'Groups', 'Memories', 'Saved', 'Pages', 'Events']

export function AppLayout() {
  const { user } = useAuth()
  return (
    <div className="min-h-svh bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--nav-bg)] shadow-sm">
        <div className="mx-auto grid h-14 max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-2 px-3 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              aria-label="Visagemanuscript home"
              className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Logo className="h-10 w-10" />
            </Link>
            <div className="hidden h-10 items-center gap-2 rounded-full bg-[var(--surface)] px-3 text-[var(--text-muted)] sm:flex lg:w-60">
              <SearchIcon className="h-4 w-4 shrink-0" />
              <input
                aria-label="Search Visagemanuscript"
                placeholder="Search Visagemanuscript"
                className="w-full min-w-0 bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          <nav aria-label="Main" className="hidden h-full items-stretch md:flex">
            <NavLink
              to="/"
              end
              aria-label="Home"
              className={({ isActive }) =>
                `relative grid w-24 place-items-center border-b-[3px] lg:w-28 ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                } my-0.5 rounded-lg rounded-b-none`
              }
            >
              {({ isActive }) => <HomeIcon filled={isActive} className="h-6 w-6" />}
            </NavLink>
            <NavLink
              to="/music"
              aria-label="Music"
              title="Music"
              className={({ isActive }) =>
                `relative grid w-24 place-items-center border-b-[3px] lg:w-28 ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                } my-0.5 rounded-lg rounded-b-none`
              }
            >
              {({ isActive }) => <MusicIcon filled={isActive} className="h-6 w-6" />}
            </NavLink>
            {decorativeTabs.map(({ label, Icon }) => (
              <span
                key={label}
                title={label}
                className="my-0.5 grid w-24 cursor-default place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] lg:w-28"
              >
                <Icon className="h-6 w-6" />
              </span>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2 md:col-start-3">
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] justify-center gap-4 px-0 sm:px-4">
        {/* Left rail: profile and shortcuts. Cosmetic. */}
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-[280px] shrink-0 flex-col gap-1 overflow-y-auto py-4 pr-2 xl:flex">
          {user && (
            <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--surface-hover)]">
              <Avatar name={user.username} color={user.avatarColor} size="sm" />
              <span className="truncate font-medium">{user.username}</span>
            </div>
          )}
          {shortcuts.map((s) => (
            <div
              key={s}
              className="flex cursor-default items-center gap-3 rounded-lg px-2 py-2 text-[15px] hover:bg-[var(--surface-hover)]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface)] text-xs font-semibold text-primary">
                {s.charAt(0)}
              </span>
              {s}
            </div>
          ))}
        </aside>

        <main className="min-h-[calc(100svh-3.5rem)] w-full max-w-[680px] py-4">
          {isMock && (
            <p className="mb-4 rounded-lg bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-400">
              Mock data. WALRUS is not connected.
            </p>
          )}
          <Outlet />
        </main>

        {/* Right rail: the demo users, like the contacts list. Cosmetic. */}
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-[280px] shrink-0 flex-col gap-1 overflow-y-auto py-4 pl-2 xl:flex">
          <h2 className="px-2 pb-1 text-[17px] font-semibold text-[var(--text-muted)]">Contacts</h2>
          {personas.map((p) => (
            <div
              key={p.id}
              title={p.blurb}
              className="flex cursor-default items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--surface-hover)]"
            >
              <span className="relative">
                <Avatar name={p.name} color="bg-primarydeep" size="sm" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--bg)] bg-wt-ok" />
              </span>
              <span className="truncate text-[15px]">{p.name}</span>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}

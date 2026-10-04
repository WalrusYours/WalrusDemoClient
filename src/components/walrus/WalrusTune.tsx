import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { KnobDef } from '../../api'
import { usePosts } from '../../context/PostsContext'
import { useSession } from '../../context/SessionContext'
import type { SaveState } from '../../context/SessionContext'

const DEFAULT_LOGO = `${import.meta.env.BASE_URL}walrus.png`
const DEFAULT_SITE_URL =
  (import.meta.env.VITE_WALRUS_SITE_URL as string | undefined) ?? 'https://walrusyours.github.io/'

function PoweredBy({ href, label, children }: { href: string | false; label: string; children: ReactNode }) {
  const cls = 'flex items-center gap-1.5 text-[11px] text-wt-faint'
  if (!href) {
    return (
      <span className={cls}>
        {children}
        {label}
      </span>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (opens in a new tab)`}
      className={`${cls} transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--text-muted)]`}
    >
      {children}
      {label}
    </a>
  )
}

/** Every string the component renders. Pass only the ones you want to change. */
export interface WalrusTuneLabels {
  trigger: string
  title: string
  subtitle: string
  presets: string
  custom: string // badge text when no preset is active
  reset: string
  resetGroup: string // resets every knob in one section
  changed: (n: number) => string // badge on a section that has moved knobs
  resetAll: string
  close: string
  dialog: string // accessible name of the panel
  saving: string
  saved: string
  saveError: string
  reranking: string
  upToDate: string
  poweredBy: string
  reranked: (tookMs: number, candidates?: number) => string
}

/**
 * An icon slot. `undefined` uses the WALRUS logo, `false` or `null` removes the icon, a
 * string is an image URL, and any React node is rendered as is.
 */
export type IconProp = ReactNode | string | false

/** Switch individual parts of the panel on or off. Everything defaults to on. */
export interface WalrusTuneShow {
  header: boolean
  presets: boolean
  badge: boolean // preset name next to the trigger
  values: boolean // the percentage next to each slider
  endLabels: boolean // the low/high text under each slider
  perKnobReset: boolean
  status: boolean // live "re-ranked in N ms" line
  saveState: boolean
  resetAll: boolean
  poweredBy: boolean
  footer: boolean
}

export interface WalrusTuneProps {
  labels?: Partial<WalrusTuneLabels>
  triggerIcon?: IconProp
  headerIcon?: IconProp
  footerIcon?: IconProp
  closeIcon?: IconProp
  show?: Partial<WalrusTuneShow>
  /** Which edge of the trigger the panel aligns to on wide screens. */
  align?: 'left' | 'right'
  /** Controlled open state. Leave unset to let the component manage it. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Extra classes for the trigger button and the panel. */
  className?: string
  panelClassName?: string
  /**
   * Where the "Powered by WALRUS" line links to (opens in a new tab). Defaults to the
   * WALRUS website, or VITE_WALRUS_SITE_URL if set. Pass `false` for plain, unlinked text.
   */
  siteUrl?: string | false
  /**
   * The page the panel is on (a recommender id such as home or playlist_add). Only knobs and
   * presets whose scope includes it are shown; without it, everything is.
   */
  surface?: string
}

const DEFAULT_LABELS: WalrusTuneLabels = {
  trigger: 'Tune',
  title: 'WALRUS Tune',
  subtitle: 'You decide how your feed is ranked.',
  presets: 'Presets',
  custom: 'Custom',
  reset: 'Reset',
  resetGroup: 'Reset section',
  changed: (n) => `${n} changed`,
  resetAll: 'Reset all',
  close: 'Close',
  dialog: 'Adjust your feed',
  saving: 'Saving...',
  saved: 'Saved',
  saveError: 'Not saved',
  reranking: 'Re-ranking...',
  upToDate: 'Feed up to date',
  poweredBy: 'Powered by WALRUS',
  reranked: (ms, n) => `Re-ranked in ${ms} ms${n !== undefined ? ` from ${n} candidates` : ''}`,
}

const DEFAULT_SHOW: WalrusTuneShow = {
  header: true,
  presets: true,
  badge: true,
  values: true,
  endLabels: true,
  perKnobReset: true,
  status: true,
  saveState: true,
  resetAll: true,
  poweredBy: true,
  footer: true,
}

function Icon({ icon, size, fallback }: { icon: IconProp | undefined; size: number; fallback?: ReactNode }) {
  if (icon === false || icon === null) return null
  if (icon === undefined) {
    return fallback !== undefined ? (
      <>{fallback}</>
    ) : (
      <img src={DEFAULT_LOGO} alt="" width={size} height={size} style={{ height: 'auto' }} draggable={false} />
    )
  }
  if (typeof icon === 'string') {
    return <img src={icon} alt="" width={size} height={size} style={{ height: 'auto' }} draggable={false} />
  }
  return <>{icon}</>
}

/**
 * The default trigger icon: a gear at rest, the WALRUS logo while the button is hovered,
 * focused or its panel is open. It must sit inside an element with the `group` class.
 */
function GearThenLogo({ size }: { size: number }) {
  const fade = 'absolute inset-0 transition-opacity duration-150'
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
        className={`${fade} text-wt-muted group-hover:opacity-0 group-focus-visible:opacity-0 group-aria-expanded:opacity-0`}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <rect
            key={deg}
            x="10.4"
            y="1.8"
            width="3.2"
            height="4"
            rx="1"
            fill="currentColor"
            stroke="none"
            transform={`rotate(${deg} 12 12)`}
          />
        ))}
        <circle cx="12" cy="12" r="6.6" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>
      <img
        src={DEFAULT_LOGO}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className={`${fade} object-contain opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-aria-expanded:opacity-100`}
      />
    </span>
  )
}

const CloseGlyph = (
  <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M5 5l10 10M15 5L5 15" />
  </svg>
)

/** Knobs grouped by their `group`, in the order each group first appears. Ungrouped come first. */
function groupKnobs(list: KnobDef[]): { name: string; knobs: KnobDef[] }[] {
  const out: { name: string; knobs: KnobDef[] }[] = []
  for (const k of list) {
    const name = k.group ?? ''
    const section = out.find((s) => s.name === name)
    if (section) section.knobs.push(k)
    else out.push({ name, knobs: [k] })
  }
  return out.sort((a, b) => Number(b.name === '') - Number(a.name === ''))
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
    >
      <path d="M7 4l6 6-6 6" />
    </svg>
  )
}

function SaveBadge({ state, labels }: { state: SaveState; labels: WalrusTuneLabels }) {
  if (state === 'idle') return null
  const text = { saving: labels.saving, saved: labels.saved, error: labels.saveError }[state]
  const color = state === 'error' ? 'text-wt-bad' : state === 'saved' ? 'text-wt-ok' : 'text-wt-muted'
  return (
    <span role="status" className={`text-xs ${color}`}>
      {text}
    </span>
  )
}

/**
 * The end user's ranking controls, rendered entirely from the knob definitions the app
 * server returns (which come from the WALRUS schema). No knob id, label or range is
 * hard-coded, and signal names or weights are never shown: knobs only.
 *
 * Text, icons and every section are configurable through props; see WalrusTuneProps.
 */
export function WalrusTune({
  labels: labelOverrides,
  triggerIcon,
  headerIcon,
  footerIcon,
  closeIcon,
  show: showOverrides,
  align = 'right',
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className = '',
  panelClassName = '',
  siteUrl = DEFAULT_SITE_URL,
  surface,
}: WalrusTuneProps) {
  const { config, knobs, preset, setKnob, applyPreset, commit, resetKnobs, saveKnob, saveState } = useSession()
  const { loading, meta } = usePosts()
  const labels = { ...DEFAULT_LABELS, ...labelOverrides }
  const show = { ...DEFAULT_SHOW, ...showOverrides }

  // Which sections the user opened or closed; untouched ones follow the default (first is open).
  const [toggled, setToggled] = useState<Record<string, boolean>>({})
  const [openState, setOpenState] = useState(defaultOpen)
  const controlled = openProp !== undefined
  const open = controlled ? openProp : openState
  const setOpen = (next: boolean) => {
    if (!controlled) setOpenState(next)
    onOpenChange?.(next)
  }
  const setOpenRef = useRef(setOpen)
  useEffect(() => {
    setOpenRef.current = setOpen
  })

  const rootRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close on Escape or on a click outside the panel; move focus in on open, back on close.
  useEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenRef.current(false)
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenRef.current(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
      trigger?.focus()
    }
  }, [open])

  if (!config) return null

  // Only what belongs to this page: a knob or preset without scope shows everywhere.
  const inScope = (scope?: string[]) => !surface || !scope || scope.includes(surface)
  const visibleKnobs = config.knobs.filter((k) => inScope(k.scope))
  const visiblePresets = config.presets.filter((p) => inScope(p.scope))

  const presetLabel = visiblePresets.find((p) => p.id === preset)?.label ?? labels.custom
  // A knob missing from the saved values is at its default, not at 0.
  const isDefault = (k: KnobDef) => (knobs[k.id] ?? k.default) === k.default
  const allDefault = visibleKnobs.every(isDefault)
  const sections = groupKnobs(visibleKnobs)
  const firstPreset = visiblePresets[0]

  const statusText = loading
    ? labels.reranking
    : meta.tookMs !== undefined
      ? labels.reranked(meta.tookMs, meta.candidates)
      : labels.upToDate

  const showFooter = show.footer && (show.status || show.saveState || show.resetAll || show.poweredBy)

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`group flex items-center gap-2 rounded-full border border-wt-line bg-wt-panel py-1 text-sm text-[var(--text)] transition-colors hover:border-wt-line-strong hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-muted)] ${
          triggerIcon === false || triggerIcon === null ? 'pl-3' : 'pl-1.5'
        } ${show.badge || labels.trigger ? 'pr-3' : 'pr-1.5'} ${className}`}
      >
        {triggerIcon === undefined ? <GearThenLogo size={22} /> : <Icon icon={triggerIcon} size={22} />}
        {labels.trigger && <span className="font-medium">{labels.trigger}</span>}
        {show.badge && (
          <span className="text-xs text-wt-muted">{presetLabel}</span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop only matters on small screens, where the panel is a bottom sheet. */}
          <div className="fixed inset-0 z-30 bg-black/60 sm:hidden" aria-hidden="true" />

          <div
            role="dialog"
            aria-label={labels.title ? `${labels.title}: ${labels.dialog}` : labels.dialog}
            className={`fixed inset-x-0 bottom-0 z-40 max-h-[85svh] animate-wt-sheet overflow-y-auto rounded-t-2xl border border-wt-line bg-wt-panel sm:absolute sm:inset-x-auto sm:top-full sm:bottom-auto sm:mt-2 sm:max-h-[calc(100svh-5rem)] sm:w-[24rem] sm:animate-wt-pop sm:rounded-xl ${
              align === 'right' ? 'sm:right-0' : 'sm:left-0'
            } ${panelClassName}`}
          >
            {show.header && (
              <div className="flex items-start gap-3 p-4 pb-2">
                {headerIcon !== false && headerIcon !== null && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center">
                    <Icon icon={headerIcon} size={22} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {labels.title && (
                    <h2 className="text-sm font-medium text-[var(--text)]">{labels.title}</h2>
                  )}
                  {labels.subtitle && <p className="text-xs text-wt-muted">{labels.subtitle}</p>}
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={labels.close}
                  className="rounded-lg p-1.5 text-wt-muted transition-colors hover:bg-wt-raised hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--text-muted)]"
                >
                  <Icon icon={closeIcon} size={18} fallback={CloseGlyph} />
                </button>
              </div>
            )}

            <div className="flex flex-col gap-5 p-4">
              {show.presets && visiblePresets.length > 0 && (
                <div>
                  {labels.presets && (
                    <p className="mb-2 text-xs text-wt-faint">
                      {labels.presets}
                    </p>
                  )}
                  <div role="group" aria-label={labels.presets || 'Presets'} className="flex flex-wrap gap-2">
                    {visiblePresets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p.id)}
                        aria-pressed={preset === p.id}
                        className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-muted)] ${
                          preset === p.id
                            ? 'border-[var(--text)] text-[var(--text)]'
                            : 'border-wt-line text-wt-muted hover:border-wt-line-strong hover:text-[var(--text)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {sections.map((section, index) => {
                  const knobRows = section.knobs.map((k) => {
                    const value = knobs[k.id] ?? k.default
                    const span = k.max - k.min || 1
                    const pct = Math.round(((value - k.min) / span) * 100)
                    const changed = value !== k.default
                    // A direction knob has no effect while the knob it depends on is at its minimum.
                    const parent = k.dependsOn ? config.knobs.find((p) => p.id === k.dependsOn) : undefined
                    const inactive = parent !== undefined && (knobs[parent.id] ?? parent.default) <= parent.min
                    return (
                      <div
                        key={k.id}
                        className={`transition-opacity ${inactive ? 'opacity-40' : ''}`}
                        title={inactive ? `No effect while "${parent.label}" is at its lowest` : undefined}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <label htmlFor={`wt-${k.id}`} className="flex-1 text-sm text-[var(--text)]">
                            {k.label}
                          </label>
                          {show.values && (k.kind ?? 'slider') === 'slider' && (
                            <span className="text-xs text-wt-faint tabular-nums">
                              {pct}%
                            </span>
                          )}
                          {k.kind === 'toggle' && (
                            <button
                              id={`wt-${k.id}`}
                              type="button"
                              role="switch"
                              aria-checked={value >= 0.5}
                              onClick={() => saveKnob(k.id, value >= 0.5 ? 0 : 1)}
                              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-muted)] ${
                                value >= 0.5 ? 'bg-walrus' : 'bg-wt-line-strong'
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] ${value >= 0.5 ? 'left-[18px]' : 'left-0.5'}`}
                              />
                            </button>
                          )}
                          {show.perKnobReset && (
                            <button
                              type="button"
                              onClick={() => resetKnobs([k.id])}
                              disabled={!changed}
                              aria-label={`${labels.reset} ${k.label}`}
                              className="rounded-md px-1.5 py-0.5 text-xs text-wt-muted transition-colors hover:text-[var(--text)] disabled:invisible"
                            >
                              {labels.reset}
                            </button>
                          )}
                        </div>
                        {k.help && <p className="mb-1.5 text-xs text-wt-muted">{k.help}</p>}
                        {k.kind === 'choice' && k.options && (
                          <div
                            id={`wt-${k.id}`}
                            role="radiogroup"
                            aria-label={k.label}
                            className="flex overflow-hidden rounded-lg border border-wt-line"
                          >
                            {k.options.map((o) => (
                              <button
                                key={o.value}
                                type="button"
                                role="radio"
                                aria-checked={value === o.value}
                                onClick={() => saveKnob(k.id, o.value)}
                                className={`flex-1 px-2 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[var(--text-muted)] ${
                                  value === o.value ? 'bg-walrus text-walrus-ink' : 'text-wt-muted hover:text-[var(--text)]'
                                }`}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {(k.kind ?? 'slider') === 'slider' && (
                          <input
                            id={`wt-${k.id}`}
                            type="range"
                            className="wt-range"
                            min={k.min}
                            max={k.max}
                            step={0.01}
                            value={value}
                            style={{ ['--wt-fill' as string]: `${pct}%` }}
                            onChange={(e) => setKnob(k.id, Number(e.target.value))}
                            onPointerUp={commit}
                            onKeyUp={commit}
                            aria-valuetext={`${pct}%, between ${k.low} and ${k.high}`}
                          />
                        )}
                        {show.endLabels && (k.kind ?? 'slider') === 'slider' && (
                          <div className="flex justify-between gap-4 text-xs text-wt-faint">
                            <span>{k.low}</span>
                            <span className="text-right">{k.high}</span>
                          </div>
                        )}
                      </div>
                    )
                  })

                  // Knobs without a group are listed plainly, with no heading.
                  if (section.name === '') {
                    return (
                      <div key="ungrouped" className="flex flex-col gap-5">
                        {knobRows}
                      </div>
                    )
                  }

                  const isOpen = toggled[section.name] ?? index === 0
                  const moved = section.knobs.filter((k) => !isDefault(k))
                  const bodyId = `wt-section-${index}`
                  return (
                    <section key={section.name} className="rounded-lg border border-wt-line">
                      <div className="flex items-center gap-2 pr-2">
                        <button
                          type="button"
                          onClick={() => setToggled((t) => ({ ...t, [section.name]: !isOpen }))}
                          aria-expanded={isOpen}
                          aria-controls={bodyId}
                          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--text-muted)]"
                        >
                          <Chevron open={isOpen} />
                          <span className="truncate">{section.name}</span>
                          {moved.length > 0 && (
                            <span className="rounded-full bg-wt-raised px-2 py-0.5 text-[11px] font-normal text-wt-muted">
                              {labels.changed(moved.length)}
                            </span>
                          )}
                        </button>
                        {show.perKnobReset && moved.length > 0 && (
                          <button
                            type="button"
                            onClick={() => resetKnobs(moved.map((k) => k.id))}
                            className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-wt-muted transition-colors hover:text-[var(--text)]"
                          >
                            {labels.resetGroup}
                          </button>
                        )}
                      </div>
                      {isOpen && (
                        <div id={bodyId} className="flex flex-col gap-5 border-t border-wt-line p-3">
                          {knobRows}
                        </div>
                      )}
                    </section>
                  )
                })}
              </div>
            </div>

            {showFooter && (
              <div className="flex flex-col gap-2 p-4 pt-2">
                {(show.status || show.saveState) && (
                  <div className="flex items-center gap-2 text-xs text-wt-muted" aria-live="polite">
                    {show.status ? (
                      <>
                        <span
                          className={`h-2 w-2 rounded-full ${loading ? 'animate-wt-pulse bg-walrus' : 'bg-wt-faint'}`}
                          aria-hidden="true"
                        />
                        <span className="flex-1">{statusText}</span>
                      </>
                    ) : (
                      <span className="flex-1" />
                    )}
                    {show.saveState && <SaveBadge state={saveState} labels={labels} />}
                  </div>
                )}

                {(show.resetAll || show.poweredBy) && (
                  <div className="flex items-center justify-between">
                    {show.resetAll ? (
                      <button
                        type="button"
                        onClick={() => firstPreset && applyPreset(firstPreset.id)}
                        disabled={allDefault && preset === firstPreset?.id}
                        className="text-xs text-wt-muted transition-colors hover:text-[var(--text)] disabled:cursor-default disabled:opacity-40 disabled:hover:text-wt-muted"
                      >
                        {labels.resetAll}
                      </button>
                    ) : (
                      <span />
                    )}
                    {show.poweredBy && labels.poweredBy && (
                      <PoweredBy href={siteUrl} label={labels.poweredBy}>
                        <Icon icon={footerIcon} size={14} />
                      </PoweredBy>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

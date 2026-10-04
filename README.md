# Visagemanuscript: demo host client

The end-user UI of the demo host platform (a small social feed). It talks only to the
platform's own backend, the app server. It never calls WALRUS and never holds a WALRUS
key; the app server relays to WALRUS and hydrates the returned ids into posts.

```
npm install
npm run dev          # mock mode, no backend needed
npm run build && npm run lint
```

Copy `.env.example` to `.env` to switch modes.

## Where WALRUS plugs in

Everything the UI needs from the backend goes through one interface, `HostApi` in
`src/api/types.ts`, with two implementations:

| File | Used when | What it does |
|------|-----------|--------------|
| `src/api/mock.ts` | `VITE_API_MODE` unset or `mock` | in-memory stand-in; fixed feed order, placeholder explanations |
| `src/api/http.ts` | `VITE_API_MODE=http` | calls the app server under `/api` (or `VITE_API_URL`) |

To integrate, build the app server endpoints below and switch the mode. The client needs
no other change.

| Client call | App server endpoint | Relays to WALRUS |
|-------------|--------------------|------------------|
| `getKnobConfig` | `GET /knobs` | `GET /schema/knobs` |
| `getProfile` | `GET /users/:id/profile` | `GET /users/:id/profile` |
| `saveProfile` | `PUT /users/:id/profile` | `PUT /users/:id/profile` |
| `getFeed` | `GET /feed?knobs.<id>=<0..1>` | `GET /recommend/:id`, then hydrate ids to posts |
| `explain` | `GET /explain/:postId` | `GET /explain/:id/:item` |
| `sendEvent` | `POST /events` | `POST /events` (ingest key) |
| `addComment` | `POST /posts/:id/comments` | host-owned; also an ingest event |

The persona is sent as an `X-Demo-User` header; a real platform would use its own session.
Response shapes are in `src/api/types.ts` and mirror `.claude/ADAPT.md` steps 6 to 8.

## What the UI already does

- **Persona switcher** (`src/data/personas.ts`): ids must match what `platform/seed` creates.
- **WalrusTune panel** (`components/walrus/WalrusTune.tsx`): built only from the definitions
  `getKnobConfig` returns, so no knob is hard-coded. Sliders refetch the feed live
  (per-request overrides) and save the profile when released; presets sit above them.
  Every string, icon and section is a prop, for example
  `<WalrusTune labels={{ trigger: 'My feed', title: 'Feed settings' }} triggerIcon={false}
  show={{ poweredBy: false, presets: false }} />`. An icon prop takes `false` to remove it,
  a string for an image URL, or any React node; see `WalrusTuneProps`.
  A knob definition may carry `group` (a collapsible section heading; the first section starts
  open, knobs without a group are listed above the sections) and `help` (one sentence under
  the label), and `dependsOn` (a knob names the one it only makes sense with, and is dimmed
  while that one is at its lowest; the mock does not use it now). Sections show how many
  knobs moved and have their own reset. The mock config (`src/api/mockKnobs.ts`) has 22 knobs
  in 6 sections. The first, "Match similar posts by", is a percentage weight per attribute of a
  post (topic, tags, mood, length, author): the mock backend (`src/api/mockRank.ts`) uses them
  to order "More like this" and, once you have liked a post, the feed. The mock derives each
  post's attributes from its text (`mockAttributes.ts`), standing in for what a host platform
  would send. The other knobs are saved and sent but the mock ignores them, and the WALRUS
  schema defines only three knobs so far, so they are demo knobs until the vocabulary grows.
- **Why am I seeing this?** (`components/walrus/WhyThis.tsx`): shows the server's
  per-signal breakdown for a post.
- **Interaction events**: like, dislike, comment and hide ("Not interested" in the post menu) are sent as events; `useViewTime`
  reports seconds on screen as a `view` event when a post leaves the viewport.
- **Not interested, with a reason** (`components/post/PostMenu.tsx`): the reasons come from the
  server (`getFeedbackReasons`, the schema v2 `feedback` section) and the `hide` event carries
  the chosen one. A reason reaches other posts through the reacted post's attributes (same
  author, same topic, similar posts); the mock applies that in `src/api/mockFeedback.ts`.
  Everything said is listed under **Your feedback** in the account menu, each with an undo.
- **Knob kinds**: a knob definition may set `kind: toggle` (a switch) or `kind: choice` with
  `options` (segmented buttons); both save on click. Sliders save when released.
- **Music tab** (`pages/MusicPage.tsx`, `pages/PlaylistPage.tsx`): six playlists, one of them
  mostly rock ("Rock Anthems"), and a "New playlist" box. At the bottom of a playlist,
  **You might want to add here...** lists songs that fit it, each with a reason ("Often added to
  playlists with Back in Black", "Fits the vibe: rock, hard rock") and an Add button. The mock
  ranks them in `src/api/mockMusic.ts`, a port of the `playlist_add` recommender in
  `walrus/docs/schema/schema-examples/spotify.yml`: co-playlisting, genre, sound, the playlist's
  average energy, a one-per-artist rule, weights that depend on the playlist's size, and an
  empty playlist that falls back to its name ("Rock workout" suggests rock). The catalogue and
  the other people's playlists it learns from are in `src/data/music.ts`.
- **Tune where the recommendations are**: the Tune button sits in the feed (above the posts), in
  "More like this" on a post, and in "You might want to add here..." on a playlist. It is not in
  the header and not on pages without recommendations (the playlists list). A knob or preset may
  carry `scope` (recommender ids) and each button passes its `surface`, so the feed and "More like
  this" show the feed's knobs (`home`) and a playlist shows its four (stick to the vibe or branch out,
  deep cuts or hits, fit the whole playlist or any song, use my taste).

## Rules

- The feed order comes from the server. The client must never sort or score posts.
- Do not show signal names or weights as controls; knobs only.
- A failed event must never block the UI (events are fire and forget).

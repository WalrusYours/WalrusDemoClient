import type { KnobConfig, KnobDef, KnobValues } from './types'

// What the app server would return from GET /knobs. The "Match similar posts by" section is
// live in the mock: mockRank.ts reads those weights (ids must match MATCH_KNOB there) to rank
// "More like this" and, once you have liked something, the feed. The other knobs are saved
// and sent like any other but the mock ignores them. The WALRUS schema in walrus/docs only
// defines taste_vs_crowd, horizon and explore so far.

function knob(
  group: string,
  id: string,
  label: string,
  low: string,
  high: string,
  def: number,
  help: string,
): KnobDef {
  return { id, label, low, high, min: 0, max: 1, default: def, group, help }
}

const knobs: KnobDef[] = [
  // One weight per attribute of a post. Each is independent: 80% mood and 50% topic means mood
  // counts a bit more than topic, not that they split 100%.
  knob('Match similar posts by', 'match_topic', 'Topic', 'Ignore', 'Only this', 0.5,
    'How much sharing the same topic counts when looking for similar posts.'),
  knob('Match similar posts by', 'match_tags', 'Tags', 'Ignore', 'Only this', 0.4,
    'How much sharing the same tags counts.'),
  knob('Match similar posts by', 'match_mood', 'Mood', 'Ignore', 'Only this', 0.8,
    'How much a similar tone and intensity count: a calm post matches calm posts.'),
  knob('Match similar posts by', 'match_length', 'Length', 'Ignore', 'Only this', 0.2,
    'How much a similar length counts: short takes match short takes.'),
  knob('Match similar posts by', 'match_author', 'Author', 'Ignore', 'Only this', 0.3,
    'How much posts from the same author count.'),

  // What I like
  knob('What I like', 'taste_vs_crowd', 'Taste vs crowd', 'What similar people like', 'Just my taste', 0.5,
    'Whose opinion counts more: yours, or people with similar habits.'),
  knob('What I like', 'similar_people', 'How many similar people', 'A few close matches', 'A wide crowd', 0.5,
    'How many people with similar habits are consulted.'),
  {
    ...knob('What I like', 'use_people_like_me', 'Use what people like me like', 'Off', 'On', 1,
      'Turn off to rank only by your own history.'),
    kind: 'toggle',
  },

  // Time and memory
  knob('Time and memory', 'horizon', 'Memory horizon', 'This week', 'Long-term interests', 0.5,
    'How far back your activity counts. Lower fades it faster.'),
  knob('Time and memory', 'view_decay', 'Reading fades', 'Forget quickly', 'Remember long', 0.3,
    'How long the posts you read keep shaping your feed.'),
  knob('Time and memory', 'like_decay', 'Likes fade', 'Forget quickly', 'Remember long', 0.7,
    'How long your likes keep shaping your feed.'),
  knob('Time and memory', 'dislike_memory', 'Dislikes last', 'Forget quickly', 'Remember long', 0.8,
    'How long a dislike keeps similar posts away.'),
  knob('Time and memory', 'freshness', 'Fresh posts', 'Timeless', 'Newest first', 0.4,
    'How much newer posts are favoured over older ones.'),
  knob('Time and memory', 'shelf_life', 'Post shelf life', 'Hours', 'Weeks', 0.4,
    'How quickly a post stops counting as fresh.'),

  // What counts
  knob('What counts', 'like_weight', 'Likes count', 'Barely', 'A lot', 0.6,
    'How strongly a like says what you want more of.'),
  knob('What counts', 'comment_weight', 'Comments count', 'Barely', 'A lot', 0.7,
    'How strongly a comment says what you want more of.'),
  knob('What counts', 'view_weight', 'Reading time counts', 'Barely', 'A lot', 0.3,
    'How much the time you spend on a post matters.'),
  knob('What counts', 'dislike_weight', 'Dislikes count', 'Barely', 'A lot', 0.8,
    'How strongly a dislike pushes similar posts down.'),

  // The crowd
  knob('The crowd', 'trending', 'Trending posts', 'Quiet corners', "What's trending", 0.1,
    'How much posts many people are engaging with are favoured.'),
  {
    ...knob('The crowd', 'trending_window', 'Trending over', 'Today', 'This month', 0.5,
      'The period used to decide what is trending.'),
    kind: 'choice', // one of a few values, not a slider (schema v2 knob kinds)
    options: [
      { value: 0, label: 'Today' },
      { value: 0.5, label: 'This week' },
      { value: 1, label: 'This month' },
    ],
  },

  // Discovery
  knob('Discovery', 'explore', 'Exploration', 'Familiar', 'Surprise me', 0.2,
    'How often you are shown posts outside your usual interests.'),
  knob('Discovery', 'variety', 'Author variety', 'Same voices', 'Many voices', 0.4,
    'How much the feed avoids repeating the same authors.'),
  knob('Discovery', 'novelty', 'New topics', 'Known topics', 'New topics', 0.2,
    'How much topics you have not seen before are favoured.'),
]

// Knobs written above belong to the feed ('home'); the playlist ones below say their own scope.
// The panel shows only the knobs and presets of the page you are on.
knobs.push(
  // The playlist_add recommender in spotify.yml: whoever builds a playlist tunes these.
  { ...knob('Playlist suggestions', 'vibe_vs_branch_out', 'Stick to the vibe', 'Stick to the vibe', 'Branch out', 0.3,
    'How closely suggestions follow the playlist, or how far they wander.'), scope: ['playlist_add'] },
  { ...knob('Playlist suggestions', 'deep_cuts_vs_hits', 'Deep cuts or hits', 'Deep cuts', 'Hits', 0.3,
    'Whether lesser-known songs or popular ones are favoured.'), scope: ['playlist_add'] },
  { ...knob('Playlist suggestions', 'whole_vs_any', 'Fit the whole playlist', 'Fit the whole playlist', 'Fit any song in it', 0,
    'Match the playlist as a whole, or any one song in it (good for mixed playlists).'), scope: ['playlist_add'] },
  { ...knob('Playlist suggestions', 'mix_in_my_taste', 'Also use my own taste', 'Off', 'On', 1,
    'Lean on songs you like, most when the playlist is short.'), kind: 'toggle', scope: ['playlist_add'] },
)
for (const k of knobs) k.scope ??= ['home']

const base: KnobValues = Object.fromEntries(knobs.filter((k) => k.scope?.includes('home')).map((k) => [k.id, k.default]))
const preset = (id: string, label: string, changes: KnobValues) => ({
  id,
  label,
  knobs: { ...base, ...changes },
  scope: ['home'],
})

export const knobConfig: KnobConfig = {
  knobs,
  presets: [
    preset('default', 'Default', {}),
    preset('mood_first', 'Mood first', {
      match_mood: 1, match_topic: 0.3, match_tags: 0.2, match_length: 0, match_author: 0,
    }),
    preset('same_topic', 'Same topic', {
      match_topic: 1, match_tags: 0.7, match_mood: 0.1, match_length: 0, match_author: 0,
    }),
    preset('discover', 'Discover', {
      taste_vs_crowd: 0.7, horizon: 0.6, explore: 0.8, novelty: 0.8, variety: 0.8, trending: 0.3,
      match_topic: 0.2, match_mood: 0.5,
    }),
    preset('latest', 'Latest', { taste_vs_crowd: 0.3, horizon: 0, explore: 0.1, freshness: 1, shelf_life: 0.1 }),
  ],
}

import type { Post } from '../types'

export const initialPosts: Post[] = [
  {
    id: '1',
    author: 'Mara Lin',
    handle: 'maralin',
    avatarColor: 'bg-violet-600',
    content:
      'Spent the whole afternoon debugging a race condition that turned out to be a missing dependency array. Classic.',
    createdAt: '2h',
    likes: 128,
    dislikes: 3,
    userVote: null,
    comments: [
      {
        id: 'c1',
        author: 'Theo Brandt',
        avatarColor: 'bg-emerald-600',
        content: 'The useEffect curse strikes again.',
        createdAt: '1h',
      },
    ],
  },
  {
    id: '2',
    author: 'Kofi Ansah',
    handle: 'kofiansah',
    avatarColor: 'bg-amber-600',
    content:
      "Reminder: your thesis doesn't need to be perfect, it needs to be done. Ship the draft, then iterate.",
    createdAt: '4h',
    likes: 342,
    dislikes: 12,
    userVote: null,
    comments: [
      {
        id: 'c2',
        author: 'Ines Popescu',
        avatarColor: 'bg-rose-600',
        content: 'Printing this and taping it above my desk.',
        createdAt: '3h',
      },
      {
        id: 'c3',
        author: 'Theo Brandt',
        avatarColor: 'bg-emerald-600',
        content: 'Needed this today, thank you.',
        createdAt: '2h',
      },
    ],
  },
  {
    id: '3',
    author: 'Ines Popescu',
    handle: 'inespop',
    avatarColor: 'bg-rose-600',
    content:
      "Three espresso shots in and I've finally figured out why the migration kept failing on staging but not locally. Timezones. It's always timezones.",
    createdAt: '6h',
    likes: 89,
    dislikes: 1,
    userVote: null,
    comments: [],
  },
  {
    id: '4',
    author: 'Theo Brandt',
    handle: 'theobrandt',
    avatarColor: 'bg-emerald-600',
    content:
      'Unpopular opinion: writing the README before the code makes the code better, not just the docs.',
    createdAt: '9h',
    likes: 210,
    dislikes: 47,
    userVote: null,
    comments: [
      {
        id: 'c4',
        author: 'Mara Lin',
        avatarColor: 'bg-violet-600',
        content: 'Forces you to actually think about the API surface first. Agreed.',
        createdAt: '7h',
      },
    ],
  },
  {
    id: '5',
    author: 'Sana Iqbal',
    handle: 'sanaiqbal',
    avatarColor: 'bg-cyan-600',
    content:
      'Finished my defense slides at 2am and somehow they look better than the ones I made sober last week.',
    createdAt: '12h',
    likes: 501,
    dislikes: 9,
    userVote: null,
    comments: [
      {
        id: 'c5',
        author: 'Kofi Ansah',
        avatarColor: 'bg-amber-600',
        content: 'Sleep deprivation is just a different creative mode.',
        createdAt: '11h',
      },
    ],
  },
  {
    id: '6',
    author: 'Diego Reyes',
    handle: 'diegoreyes',
    avatarColor: 'bg-fuchsia-600',
    content:
      "Refactored a 900-line component into six small ones today. Same behavior, half the bugs I didn't know I had.",
    createdAt: '1d',
    likes: 176,
    dislikes: 5,
    userVote: null,
    comments: [],
  },
]

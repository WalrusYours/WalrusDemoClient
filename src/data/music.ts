import type { Playlist, Track } from '../types'

// Demo catalogue for the Music tab (metadata only, no audio). Energy and valence are 0..1 like
// the audio features a streaming platform's own analysis would send to WALRUS; plays is the
// popularity the mock's "hits" knob reads.

function t(
  id: string,
  title: string,
  artist: string,
  year: number,
  genres: string[],
  energy: number,
  valence: number,
  seconds: number,
  plays: number,
): Track {
  return { id, title, artist, year, genres, energy, valence, seconds, plays }
}

export const tracks: Track[] = [
  // rock, classic and hard
  t('back_in_black', 'Back in Black', 'AC/DC', 1980, ['rock', 'hard rock'], 0.92, 0.65, 255, 1500),
  t('thunderstruck', 'Thunderstruck', 'AC/DC', 1990, ['rock', 'hard rock'], 0.95, 0.45, 292, 1300),
  t('highway_to_hell', 'Highway to Hell', 'AC/DC', 1979, ['rock', 'hard rock'], 0.9, 0.7, 208, 1100),
  t('sweet_child', "Sweet Child o' Mine", "Guns N' Roses", 1987, ['rock', 'hard rock'], 0.85, 0.6, 356, 1700),
  t('livin_prayer', "Livin' on a Prayer", 'Bon Jovi', 1986, ['rock', 'glam rock'], 0.88, 0.75, 249, 1400),
  t('dont_stop', "Don't Stop Believin'", 'Journey', 1981, ['rock', 'classic rock'], 0.72, 0.65, 251, 1800),
  t('bohemian', 'Bohemian Rhapsody', 'Queen', 1975, ['rock', 'classic rock'], 0.6, 0.4, 355, 2100),
  t('we_will_rock_you', 'We Will Rock You', 'Queen', 1977, ['rock', 'classic rock'], 0.7, 0.55, 122, 1300),
  t('hotel_california', 'Hotel California', 'Eagles', 1976, ['rock', 'classic rock', 'folk rock'], 0.45, 0.35, 391, 1500),
  t('stairway', 'Stairway to Heaven', 'Led Zeppelin', 1971, ['rock', 'classic rock'], 0.4, 0.3, 482, 1200),
  t('whole_lotta_love', 'Whole Lotta Love', 'Led Zeppelin', 1969, ['rock', 'hard rock'], 0.85, 0.45, 333, 900),
  t('smoke_water', 'Smoke on the Water', 'Deep Purple', 1972, ['rock', 'hard rock'], 0.75, 0.5, 340, 800),
  t('paranoid', 'Paranoid', 'Black Sabbath', 1970, ['rock', 'metal'], 0.9, 0.35, 168, 700),
  t('enter_sandman', 'Enter Sandman', 'Metallica', 1991, ['metal', 'hard rock'], 0.9, 0.3, 331, 1500),
  t('crazy_train', 'Crazy Train', 'Ozzy Osbourne', 1980, ['rock', 'metal', 'hard rock'], 0.85, 0.6, 292, 600),
  t('born_to_run', 'Born to Run', 'Bruce Springsteen', 1975, ['rock', 'heartland rock'], 0.75, 0.6, 270, 700),
  // rock, 90s and 2000s
  t('teen_spirit', 'Smells Like Teen Spirit', 'Nirvana', 1991, ['rock', 'grunge', 'alternative'], 0.91, 0.35, 301, 1600),
  t('under_bridge', 'Under the Bridge', 'Red Hot Chili Peppers', 1991, ['rock', 'alternative'], 0.5, 0.4, 264, 1000),
  t('basket_case', 'Basket Case', 'Green Day', 1994, ['punk', 'rock'], 0.88, 0.7, 181, 900),
  t('wonderwall', 'Wonderwall', 'Oasis', 1995, ['rock', 'britpop'], 0.55, 0.45, 258, 1700),
  t('seven_nation', 'Seven Nation Army', 'The White Stripes', 2003, ['rock', 'indie'], 0.7, 0.45, 232, 1500),
  t('mr_brightside', 'Mr. Brightside', 'The Killers', 2003, ['rock', 'indie'], 0.9, 0.5, 223, 1900),
  // indie
  t('do_i_wanna_know', 'Do I Wanna Know?', 'Arctic Monkeys', 2013, ['indie', 'rock', 'alternative'], 0.6, 0.4, 272, 1700),
  t('r_u_mine', 'R U Mine?', 'Arctic Monkeys', 2012, ['indie', 'rock'], 0.85, 0.55, 201, 800),
  t('take_me_out', 'Take Me Out', 'Franz Ferdinand', 2004, ['indie', 'rock'], 0.85, 0.6, 237, 600),
  t('last_nite', 'Last Nite', 'The Strokes', 2001, ['indie', 'rock'], 0.75, 0.65, 193, 700),
  t('float_on', 'Float On', 'Modest Mouse', 2004, ['indie', 'rock'], 0.7, 0.7, 208, 500),
  // pop and dance
  t('take_on_me', 'Take on Me', 'a-ha', 1985, ['pop', 'synth-pop'], 0.8, 0.9, 225, 1900),
  t('blinding_lights', 'Blinding Lights', 'The Weeknd', 2019, ['pop', 'synth-pop'], 0.8, 0.33, 200, 4000),
  t('levitating', 'Levitating', 'Dua Lipa', 2020, ['pop', 'dance'], 0.83, 0.92, 203, 2500),
  t('shake_it_off', 'Shake It Off', 'Taylor Swift', 2014, ['pop'], 0.8, 0.94, 219, 2200),
  t('uptown_funk', 'Uptown Funk', 'Mark Ronson', 2014, ['pop', 'funk'], 0.85, 0.93, 270, 2300),
  t('dancing_queen', 'Dancing Queen', 'ABBA', 1976, ['pop', 'disco'], 0.78, 0.85, 231, 1500),
  // electronic
  t('strobe', 'Strobe', 'deadmau5', 2009, ['electronic', 'progressive house'], 0.55, 0.3, 637, 300),
  t('around_world', 'Around the World', 'Daft Punk', 1997, ['electronic', 'house'], 0.8, 0.7, 429, 500),
  t('one_more_time', 'One More Time', 'Daft Punk', 2000, ['electronic', 'house', 'dance'], 0.85, 0.9, 320, 900),
  t('sunset_lover', 'Sunset Lover', 'Petit Biscuit', 2015, ['electronic', 'chill'], 0.45, 0.5, 237, 700),
  // quiet
  t('weightless', 'Weightless', 'Marconi Union', 2011, ['ambient'], 0.1, 0.1, 480, 150),
  t('the_xx_intro', 'Intro', 'The xx', 2009, ['indie', 'chill'], 0.3, 0.3, 127, 600),
  t('holocene', 'Holocene', 'Bon Iver', 2011, ['indie folk', 'folk'], 0.25, 0.3, 337, 350),
  t('skinny_love', 'Skinny Love', 'Bon Iver', 2007, ['indie folk', 'folk'], 0.3, 0.2, 238, 700),
  t('fast_car', 'Fast Car', 'Tracy Chapman', 1988, ['folk', 'acoustic'], 0.35, 0.35, 296, 900),
  t('mad_world', 'Mad World', 'Gary Jules', 2001, ['alternative', 'acoustic'], 0.15, 0.1, 191, 800),
  t('clair_de_lune', 'Clair de Lune', 'Claude Debussy', 1905, ['classical'], 0.1, 0.3, 300, 500),
  t('gymnopedie', 'Gymnopédie No. 1', 'Erik Satie', 1888, ['classical', 'ambient'], 0.05, 0.3, 190, 400),
  // country and folk
  t('country_roads', 'Take Me Home, Country Roads', 'John Denver', 1971, ['folk', 'country'], 0.45, 0.7, 190, 1500),
  t('ring_of_fire', 'Ring of Fire', 'Johnny Cash', 1963, ['country', 'folk'], 0.5, 0.7, 158, 700),
  t('jolene', 'Jolene', 'Dolly Parton', 1973, ['country'], 0.5, 0.5, 162, 800),
]

export const initialPlaylists: Playlist[] = [
  {
    id: 'rock_anthems',
    name: 'Rock Anthems',
    description: 'Loud guitars, big choruses.',
    // mostly rock, plus one 80s pop song that sneaked in
    trackIds: [
      'back_in_black', 'thunderstruck', 'sweet_child', 'livin_prayer', 'dont_stop', 'bohemian',
      'whole_lotta_love', 'smoke_water', 'teen_spirit', 'mr_brightside', 'take_on_me',
    ],
  },
  {
    id: 'quiet_evenings',
    name: 'Quiet Evenings',
    description: 'Slow down.',
    trackIds: ['holocene', 'skinny_love', 'fast_car', 'weightless', 'the_xx_intro', 'clair_de_lune', 'gymnopedie', 'mad_world'],
  },
  {
    id: 'workout',
    name: 'Workout',
    description: 'Keep moving.',
    trackIds: ['thunderstruck', 'enter_sandman', 'blinding_lights', 'basket_case', 'levitating', 'one_more_time', 'mr_brightside', 'uptown_funk', 'crazy_train', 'around_world'],
  },
  {
    id: 'road_trip',
    name: 'Road Trip',
    description: 'Windows down.',
    trackIds: ['hotel_california', 'born_to_run', 'country_roads', 'dont_stop', 'wonderwall', 'seven_nation', 'under_bridge', 'ring_of_fire'],
  },
  {
    id: 'indie_nights',
    name: 'Indie Nights',
    description: 'Small venues, loud nights.',
    trackIds: ['do_i_wanna_know', 'r_u_mine', 'take_me_out', 'last_nite', 'float_on', 'seven_nation', 'mr_brightside', 'the_xx_intro'],
  },
  {
    id: 'throwback_pop',
    name: 'Throwback Pop',
    description: 'Sing along.',
    trackIds: ['dancing_queen', 'take_on_me', 'uptown_funk', 'shake_it_off', 'livin_prayer'],
  },
]

/**
 * Other people's playlists, never shown: the mock's stand-in for the "added to playlists
 * together" events WALRUS would see from the whole platform (`co_occurrence`).
 */
export const communityPlaylists: string[][] = [
  ['back_in_black', 'thunderstruck', 'highway_to_hell', 'crazy_train', 'paranoid', 'enter_sandman'],
  ['back_in_black', 'highway_to_hell', 'sweet_child', 'whole_lotta_love', 'smoke_water', 'stairway'],
  ['sweet_child', 'livin_prayer', 'dont_stop', 'we_will_rock_you', 'bohemian', 'teen_spirit'],
  ['stairway', 'hotel_california', 'whole_lotta_love', 'bohemian', 'smoke_water'],
  ['teen_spirit', 'mr_brightside', 'under_bridge', 'basket_case', 'wonderwall', 'last_nite'],
  ['seven_nation', 'mr_brightside', 'r_u_mine', 'take_me_out', 'last_nite', 'do_i_wanna_know'],
  ['thunderstruck', 'enter_sandman', 'paranoid', 'crazy_train', 'back_in_black'],
  ['dont_stop', 'livin_prayer', 'take_on_me', 'dancing_queen', 'sweet_child'],
  ['holocene', 'skinny_love', 'fast_car', 'mad_world', 'the_xx_intro'],
  ['holocene', 'skinny_love', 'fast_car', 'clair_de_lune', 'gymnopedie', 'weightless'],
  ['mad_world', 'skinny_love', 'holocene', 'sunset_lover', 'the_xx_intro'],
  ['fast_car', 'country_roads', 'jolene', 'ring_of_fire', 'skinny_love'],
  ['weightless', 'clair_de_lune', 'gymnopedie', 'sunset_lover', 'mad_world'],
  ['sunset_lover', 'the_xx_intro', 'holocene', 'weightless', 'fast_car'],
  ['blinding_lights', 'levitating', 'shake_it_off', 'uptown_funk', 'one_more_time'],
  ['hotel_california', 'born_to_run', 'dont_stop', 'wonderwall', 'country_roads'],
  ['back_in_black', 'thunderstruck', 'smoke_water', 'whole_lotta_love', 'highway_to_hell', 'sweet_child', 'teen_spirit'],
  ['do_i_wanna_know', 'r_u_mine', 'the_xx_intro', 'seven_nation'],
  ['strobe', 'around_world', 'one_more_time', 'blinding_lights'],
  ['bohemian', 'we_will_rock_you', 'dont_stop', 'livin_prayer', 'back_in_black'],
]

/** Songs this user liked: the mock's "my taste". */
export const likedTrackIds = ['back_in_black', 'bohemian', 'seven_nation', 'do_i_wanna_know', 'holocene']

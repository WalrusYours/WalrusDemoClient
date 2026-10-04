// Demo personas. The ids must match the users created by platform/seed; the client only
// uses them to tell the app server who is looking at the feed.
export interface Persona {
  id: string
  name: string
  blurb: string
}

export const personas: Persona[] = [
  { id: 'u_maya', name: 'Maya', blurb: 'Developer, reads about code and tooling' },
  { id: 'u_ines', name: 'Ines', blurb: 'Student, reads about study and thesis life' },
  { id: 'u_theo', name: 'Theo', blurb: 'New user with no history' },
]

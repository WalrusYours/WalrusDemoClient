import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PostsProvider } from './context/PostsContext'
import { SessionProvider } from './context/SessionContext'
import { FeedPage } from './pages/FeedPage'
import { LoginPage } from './pages/LoginPage'
import { MusicPage } from './pages/MusicPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlaylistPage } from './pages/PlaylistPage'
import { PostPage } from './pages/PostPage'

// Everything that needs a user sits behind the sign-in. The key remounts the session and
// posts state when the user changes, so nobody sees the previous user's feed.
function SignedIn() {
  const { user } = useAuth()
  if (!user) return <LoginPage />
  return (
    <SessionProvider key={user.id}>
      <PostsProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<FeedPage />} />
              <Route path="post/:postId" element={<PostPage />} />
              <Route path="music" element={<MusicPage />} />
              <Route path="music/:playlistId" element={<PlaylistPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PostsProvider>
    </SessionProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <SignedIn />
    </AuthProvider>
  )
}

export default App

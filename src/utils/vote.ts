import type { Post, Vote } from '../types'

/**
 * The post after the user clicks like or dislike: clicking the active vote removes it, and
 * clicking the other one moves the vote across. Shared by the feed and "More like this".
 */
export function applyVote(post: Post, type: Vote): Post {
  const alreadyVoted = post.userVote === type
  const switchingVote = post.userVote !== null && post.userVote !== type

  return {
    ...post,
    likes: post.likes + (type === 'like' ? (alreadyVoted ? -1 : 1) : switchingVote ? -1 : 0),
    dislikes: post.dislikes + (type === 'dislike' ? (alreadyVoted ? -1 : 1) : switchingVote ? -1 : 0),
    userVote: alreadyVoted ? null : type,
  }
}

export type Profile = {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export type Video = {
  id: string
  user_id: string
  title: string
  description: string | null
  video_url: string
  created_at: string
  profiles?: Profile
  likes_count?: number
  covers_count?: number
  user_has_liked?: boolean
}

export type Cover = {
  id: string
  original_video_id: string
  user_id: string
  cover_video_url: string
  created_at: string
  profiles?: Profile
  videos?: Video
}

export type Like = {
  id: string
  user_id: string
  video_id: string
  created_at: string
}

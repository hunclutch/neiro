import { createClient } from '@/lib/supabase/server'
import FeedClient from './FeedClient'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: videos } = await supabase
    .from('videos')
    .select(`
      *,
      profiles (id, username, avatar_url),
      likes_count:likes(count),
      covers_count:covers(count)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch user's likes to mark liked videos
  let likedVideoIds: string[] = []
  if (user) {
    const { data: likes } = await supabase
      .from('likes')
      .select('video_id')
      .eq('user_id', user.id)
    likedVideoIds = (likes ?? []).map((l) => l.video_id)
  }

  const enrichedVideos = (videos ?? []).map((v) => ({
    ...v,
    likes_count: v.likes_count?.[0]?.count ?? 0,
    covers_count: v.covers_count?.[0]?.count ?? 0,
    user_has_liked: likedVideoIds.includes(v.id),
  }))

  return <FeedClient videos={enrichedVideos} currentUser={user} />
}

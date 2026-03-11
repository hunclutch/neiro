export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import VideoPlayer from '@/components/VideoPlayer'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const { data: videos } = await supabase
    .from('videos')
    .select(`*, likes_count:likes(count), covers_count:covers(count)`)
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const { data: covers } = await supabase
    .from('covers')
    .select(`*, videos (id, title, video_url, profiles(username))`)
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const enrichedVideos = (videos ?? []).map((v) => ({
    ...v,
    likes_count: v.likes_count?.[0]?.count ?? 0,
    covers_count: v.covers_count?.[0]?.count ?? 0,
  }))

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold text-white shrink-0">
            {profile.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">@{profile.username}</h1>
            {profile.bio && <p className="text-gray-400 mt-1">{profile.bio}</p>}
            <div className="flex gap-4 mt-2 text-sm text-gray-400">
              <span><span className="text-white font-semibold">{enrichedVideos.length}</span> intros</span>
              <span><span className="text-white font-semibold">{covers?.length ?? 0}</span> covers</span>
            </div>
          </div>
        </div>

        {/* Intros */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4">🎵 Intros</h2>
          {!enrichedVideos.length ? (
            <p className="text-gray-500 text-sm">No intros uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {enrichedVideos.map((video) => (
                <Link key={video.id} href={`/video/${video.id}`} className="group">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                    <VideoPlayer src={video.video_url} className="w-full h-full" muted />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-white text-xs font-medium truncate">{video.title}</span>
                    </div>
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-gray-400">
                    <span>👍 {video.likes_count}</span>
                    <span>🎤 {video.covers_count}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Covers */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">🎤 Covers</h2>
          {!covers?.length ? (
            <p className="text-gray-500 text-sm">No covers created yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {covers.map((cover) => (
                <Link key={cover.id} href={`/video/${cover.original_video_id}`} className="group">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                    <VideoPlayer src={cover.cover_video_url} className="w-full h-full" muted />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-white text-xs font-medium truncate">
                        Cover of: {cover.videos?.title}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-400 truncate">
                    Cover of: {cover.videos?.title}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import VideoPlayer from '@/components/VideoPlayer'
import LikeButton from '@/components/LikeButton'

interface VideoPageProps {
  params: Promise<{ id: string }>
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: video } = await supabase
    .from('videos')
    .select(`*, profiles (id, username, avatar_url)`)
    .eq('id', id)
    .single()

  if (!video) notFound()

  const { data: covers } = await supabase
    .from('covers')
    .select(`*, profiles (id, username, avatar_url)`)
    .eq('original_video_id', id)
    .order('created_at', { ascending: false })

  const { count: likesCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', id)

  let userHasLiked = false
  if (user) {
    const { data: like } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_id', id)
      .maybeSingle()
    userHasLiked = !!like
  }

  return (
    <div className="min-h-screen pt-16 pb-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Video player */}
        <div className="mt-6 rounded-2xl overflow-hidden bg-black aspect-video">
          <VideoPlayer src={video.video_url} className="w-full h-full" />
        </div>

        {/* Video info */}
        <div className="mt-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{video.title}</h1>
            {video.description && (
              <p className="text-gray-400 mt-2">{video.description}</p>
            )}
            <Link
              href={`/profile/${video.user_id}`}
              className="inline-flex items-center gap-2 mt-3 group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                {video.profiles?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-gray-300 group-hover:text-white transition-colors text-sm">
                @{video.profiles?.username}
              </span>
            </Link>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <LikeButton
              videoId={video.id}
              initialLiked={userHasLiked}
              initialCount={likesCount ?? 0}
              user={user}
            />

            <Link
              href={`/cover/${video.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-medium"
            >
              <span>🎤</span> Cover
            </Link>
          </div>
        </div>

        {/* Covers section */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-white mb-4">
            🎤 Covers ({covers?.length ?? 0})
          </h2>

          {!covers?.length ? (
            <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-gray-400">No covers yet. Be the first!</p>
              <Link
                href={`/cover/${video.id}`}
                className="inline-block mt-4 px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-medium"
              >
                Create Cover
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {covers.map((cover) => (
                <div key={cover.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="aspect-video bg-black">
                    <VideoPlayer src={cover.cover_video_url} className="w-full h-full" />
                  </div>
                  <div className="p-3">
                    <Link href={`/profile/${cover.user_id}`} className="flex items-center gap-2 group">
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                        {cover.profiles?.username?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                        @{cover.profiles?.username}
                      </span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

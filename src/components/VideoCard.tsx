'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import VideoPlayer from '@/components/VideoPlayer'
import type { Video } from '@/types'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface VideoCardProps {
  video: Video
  user: User | null
  autoPlay?: boolean
}

export default function VideoCard({ video, user, autoPlay = false }: VideoCardProps) {
  const [liked, setLiked] = useState(video.user_has_liked ?? false)
  const [likesCount, setLikesCount] = useState(video.likes_count ?? 0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLike = useCallback(async () => {
    if (!user) { router.push('/login'); return }
    if (loading) return
    setLoading(true)

    if (liked) {
      await supabase.from('likes').delete().match({ user_id: user.id, video_id: video.id })
      setLiked(false)
      setLikesCount((c) => c - 1)
    } else {
      await supabase.from('likes').insert({ user_id: user.id, video_id: video.id })
      setLiked(true)
      setLikesCount((c) => c + 1)
    }
    setLoading(false)
  }, [user, liked, loading, video.id])

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/video/${video.id}`
    if (navigator.share) {
      navigator.share({ title: video.title, url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }, [video.id, video.title])

  const handleRepost = useCallback(() => {
    if (!user) { router.push('/login'); return }
    const url = `${window.location.origin}/video/${video.id}`
    navigator.clipboard.writeText(url)
    alert('Video link copied — share it anywhere!')
  }, [user, video.id])

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Video */}
      <div className="relative w-full h-full max-w-sm mx-auto">
        <VideoPlayer
          src={video.video_url}
          className="w-full h-full"
          autoPlay={autoPlay}
          muted={true}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Top: title & description */}
        <div className="absolute top-16 left-4 right-16">
          <Link href={`/video/${video.id}`} className="block">
            <h2 className="font-bold text-white text-lg leading-tight line-clamp-1 hover:text-blue-300 transition-colors">
              {video.title}
            </h2>
            {video.description && (
              <p className="text-gray-300 text-sm mt-1 line-clamp-2">{video.description}</p>
            )}
          </Link>
        </div>

        {/* Bottom: username */}
        <div className="absolute bottom-6 left-4 right-16">
          <Link href={`/profile/${video.user_id}`} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {video.profiles?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors">
              @{video.profiles?.username ?? 'unknown'}
            </span>
          </Link>
        </div>

        {/* Right side action buttons */}
        <div className="absolute right-2 bottom-24 flex flex-col items-center gap-5">
          {/* Like */}
          <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${liked ? 'bg-blue-600 scale-110' : 'bg-white/10 group-hover:bg-white/20'}`}>
              <span className="text-xl">{liked ? '👍' : '👍'}</span>
            </div>
            <span className="text-white text-xs font-medium">{likesCount}</span>
          </button>

          {/* Cover */}
          <Link href={`/cover/${video.id}`} className="flex flex-col items-center gap-1 group">
            <div className="w-11 h-11 rounded-full bg-white/10 group-hover:bg-blue-600 flex items-center justify-center transition-all">
              <span className="text-xl">🎤</span>
            </div>
            <span className="text-white text-xs font-medium">{video.covers_count ?? 0}</span>
          </Link>

          {/* Repost */}
          <button onClick={handleRepost} className="flex flex-col items-center gap-1 group">
            <div className="w-11 h-11 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all">
              <span className="text-xl">🔁</span>
            </div>
            <span className="text-white text-xs font-medium">Repost</span>
          </button>

          {/* Share */}
          <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
            <div className="w-11 h-11 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all">
              <span className="text-xl">🔗</span>
            </div>
            <span className="text-white text-xs font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  )
}

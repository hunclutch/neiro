'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface LikeButtonProps {
  videoId: string
  initialLiked: boolean
  initialCount: number
  user: User | null
}

export default function LikeButton({ videoId, initialLiked, initialCount, user }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLike = useCallback(async () => {
    if (!user) { router.push('/login'); return }
    if (loading) return
    setLoading(true)

    if (liked) {
      await supabase.from('likes').delete().match({ user_id: user.id, video_id: videoId })
      setLiked(false)
      setCount((c) => c - 1)
    } else {
      await supabase.from('likes').insert({ user_id: user.id, video_id: videoId })
      setLiked(true)
      setCount((c) => c + 1)
    }
    setLoading(false)
  }, [user, liked, loading, videoId])

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${
        liked
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white/5 border-white/20 text-gray-300 hover:border-blue-500 hover:text-white'
      }`}
    >
      <span>👍</span>
      <span>{count}</span>
    </button>
  )
}

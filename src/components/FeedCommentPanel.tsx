'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Comment } from '@/types'
import type { User } from '@supabase/supabase-js'

interface FeedCommentPanelProps {
  videoId: string
  user: User | null
  onClose: () => void
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function FeedCommentPanel({ videoId, user, onClose }: FeedCommentPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('comments')
      .select('*, profiles (id, username, avatar_url)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setComments(data ?? [])
        setLoading(false)
      })

    // Focus input after animation
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [videoId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push('/login'); return }
    if (!content.trim()) return

    setSubmitting(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ video_id: videoId, user_id: user.id, content: content.trim() })
      .select('*, profiles (id, username, avatar_url)')
      .single()

    if (!error && data) {
      setComments((prev) => [data, ...prev])
      setContent('')
    }
    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="absolute inset-0 z-20 flex items-end"
      onClick={handleBackdrop}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div
        className="relative w-full bg-[#111827] rounded-t-2xl max-h-[70%] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/10 shrink-0">
          <h3 className="text-white font-semibold text-sm">
            💬 Comments {!loading && `(${comments.length})`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {loading ? (
            <p className="text-gray-500 text-sm text-center py-4">Loading...</p>
          ) : !comments.length ? (
            <p className="text-gray-500 text-sm text-center py-4">No comments yet. Be the first!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5 group">
                <Link href={`/profile/${comment.user_id}`} onClick={onClose}>
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {comment.profiles?.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <Link
                      href={`/profile/${comment.user_id}`}
                      onClick={onClose}
                      className="text-xs font-semibold text-white hover:text-blue-300 transition-colors"
                    >
                      @{comment.profiles?.username}
                    </Link>
                    <span className="text-gray-600 text-xs">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-gray-300 text-sm break-words">{comment.content}</p>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/10 shrink-0">
          {user ? (
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a comment..."
                maxLength={500}
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shrink-0"
              >
                {submitting ? '...' : 'Post'}
              </button>
            </form>
          ) : (
            <p className="text-center text-gray-500 text-sm py-1">
              <Link href="/login" onClick={onClose} className="text-blue-400 hover:text-blue-300">Log in</Link> to comment.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DeleteVideoButtonProps {
  videoId: string
  videoUrl: string
  audioUrl: string | null
}

export default function DeleteVideoButton({ videoId, videoUrl, audioUrl }: DeleteVideoButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const extractStoragePath = (url: string) => {
    // Public URL format: .../storage/v1/object/public/videos/{path}
    const match = url.match(/\/storage\/v1\/object\/public\/videos\/(.+)/)
    return match ? match[1] : null
  }

  const handleDelete = async () => {
    setDeleting(true)

    // Delete from DB (cascade removes likes, covers, comments)
    const { error: dbError } = await supabase.from('videos').delete().eq('id', videoId)
    if (dbError) {
      alert(`Failed to delete: ${dbError.message}`)
      setDeleting(false)
      setConfirming(false)
      return
    }

    // Best-effort: delete video file from Storage
    const videoPath = extractStoragePath(videoUrl)
    if (videoPath) {
      await supabase.storage.from('videos').remove([videoPath])
    }

    // Best-effort: delete audio file from Storage
    if (audioUrl) {
      const audioPath = extractStoragePath(audioUrl)
      if (audioPath) {
        await supabase.storage.from('videos').remove([audioPath])
      }
    }

    router.push('/profile/' + (await supabase.auth.getUser()).data.user?.id)
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Delete this video?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {deleting ? 'Deleting...' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/50 text-gray-400 hover:text-red-400 text-sm transition-all"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Delete
    </button>
  )
}

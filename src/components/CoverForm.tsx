'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Video } from '@/types'
import VideoPlayer from '@/components/VideoPlayer'

interface CoverFormProps {
  originalVideo: Video
  user: User
}

export default function CoverForm({ originalVideo, user }: CoverFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.type.startsWith('video/')) {
      setError('Please select a video file.')
      return
    }
    if (selected.size > 100 * 1024 * 1024) {
      setError('File size must be under 100MB.')
      return
    }
    setError(null)
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select your cover video.')
      return
    }

    setUploading(true)
    setError(null)
    setProgress(10)

    try {
      const ext = file.name.split('.').pop()
      const fileName = `covers/${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError
      setProgress(70)

      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName)
      const coverVideoUrl = urlData.publicUrl
      setProgress(85)

      const { error: dbError } = await supabase.from('covers').insert({
        original_video_id: originalVideo.id,
        user_id: user.id,
        cover_video_url: coverVideoUrl,
      })

      if (dbError) throw dbError
      setProgress(100)

      router.push(`/video/${originalVideo.id}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-8">
      {/* Original video */}
      <div>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Original Intro</h2>
        <div className="rounded-2xl overflow-hidden bg-black aspect-video">
          <VideoPlayer src={originalVideo.video_url} className="w-full h-full" />
        </div>
        <p className="mt-2 text-white font-semibold">{originalVideo.title}</p>
        <p className="text-gray-400 text-sm">by @{originalVideo.profiles?.username}</p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-blue-400 font-bold text-lg">🎤 Your Cover</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Cover upload form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-blue-600/50 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors group"
        >
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {preview ? (
            <video src={preview} controls className="max-h-64 mx-auto rounded-xl" />
          ) : (
            <div className="text-gray-400 group-hover:text-blue-400 transition-colors">
              <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">Upload your continuation video</p>
              <p className="text-sm mt-1">MP4, MOV, WebM · Max 100MB</p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Uploading cover...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white transition-colors"
        >
          {uploading ? 'Uploading...' : '🎤 Publish Cover'}
        </button>
      </form>
    </div>
  )
}

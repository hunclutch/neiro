'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UploadFormProps {
  user: User
}

export default function UploadForm({ user }: UploadFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioName, setAudioName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)
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

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.type.startsWith('audio/')) {
      setError('Please select an audio file.')
      return
    }
    if (selected.size > 50 * 1024 * 1024) {
      setError('Audio file must be under 50MB.')
      return
    }
    setError(null)
    setAudioFile(selected)
    setAudioName(selected.name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title.trim()) {
      setError('Title and video file are required.')
      return
    }

    setUploading(true)
    setError(null)
    setProgress(10)

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('[UploadForm] currentUser:', currentUser)
      if (!currentUser) throw new Error('Not authenticated. Please log in again.')

      // Upload video
      const videoExt = file.name.split('.').pop()
      const videoFileName = `${currentUser.id}/${Date.now()}.${videoExt}`

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError
      setProgress(50)

      const { data: videoUrlData } = supabase.storage.from('videos').getPublicUrl(videoFileName)
      const videoUrl = videoUrlData.publicUrl

      // Upload audio (optional)
      let audioUrl: string | null = null
      if (audioFile) {
        const audioExt = audioFile.name.split('.').pop()
        const audioFileName = `audio/${currentUser.id}/${Date.now()}.${audioExt}`

        const { error: audioUploadError } = await supabase.storage
          .from('videos')
          .upload(audioFileName, audioFile, { cacheControl: '3600', upsert: false })

        if (audioUploadError) throw audioUploadError

        const { data: audioUrlData } = supabase.storage.from('videos').getPublicUrl(audioFileName)
        audioUrl = audioUrlData.publicUrl
      }
      setProgress(80)

      const insertPayload: Record<string, unknown> = {
        user_id: currentUser.id,
        title: title.trim(),
        description: description.trim() || null,
        video_url: videoUrl,
      }
      if (audioUrl) insertPayload.audio_url = audioUrl

      const { error: dbError } = await supabase.from('videos').insert(insertPayload)

      if (dbError) throw new Error(dbError.message)
      setProgress(100)

      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setError(msg)
      console.error('[UploadForm] error:', err)
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Video file drop zone */}
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
            <p className="text-lg font-medium">Click to select video</p>
            <p className="text-sm mt-1">MP4, MOV, WebM · Max 100MB</p>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name your video..."
          maxLength={100}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell others about this video..."
          rows={3}
          maxLength={500}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
        />
      </div>

      {/* Audio intro track (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Intro Audio Track
          <span className="ml-2 text-xs text-gray-500 font-normal">Optional — others can use this when covering your video</span>
        </label>
        <div
          onClick={() => audioRef.current?.click()}
          className="flex items-center gap-3 border border-white/10 hover:border-blue-500 rounded-xl px-4 py-3 cursor-pointer transition-colors group"
        >
          <input
            ref={audioRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioChange}
            className="hidden"
          />
          <div className="w-9 h-9 rounded-full bg-blue-600/20 group-hover:bg-blue-600/40 flex items-center justify-center shrink-0 transition-colors">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          {audioName ? (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{audioName}</p>
              <p className="text-gray-500 text-xs">Click to change</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm group-hover:text-gray-400 transition-colors">
              Click to select audio — MP3, WAV, AAC · Max 50MB
            </p>
          )}
          {audioName && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setAudioFile(null); setAudioName(null) }}
              className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Uploading...</span>
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
        disabled={uploading || !file || !title.trim()}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white transition-colors"
      >
        {uploading ? 'Uploading...' : 'Publish Video'}
      </button>
    </form>
  )
}

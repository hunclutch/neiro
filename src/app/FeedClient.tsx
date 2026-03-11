'use client'

import { useRef, useState, useEffect } from 'react'
import VideoCard from '@/components/VideoCard'
import type { Video } from '@/types'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface FeedClientProps {
  videos: Video[]
  currentUser: User | null
}

export default function FeedClient({ videos, currentUser }: FeedClientProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute('data-index') ?? '0')
            setActiveIndex(idx)
          }
        })
      },
      { root: container, threshold: 0.6 }
    )

    container.querySelectorAll('.feed-item').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [videos])

  if (!videos.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div className="text-6xl mb-4">🎵</div>
        <h1 className="text-2xl font-bold text-white mb-2">No videos yet</h1>
        <p className="text-gray-400 mb-6">Be the first to share a music intro!</p>
        {currentUser ? (
          <Link
            href="/upload"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white font-semibold transition-colors"
          >
            Upload First Intro
          </Link>
        ) : (
          <Link
            href="/signup"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white font-semibold transition-colors"
          >
            Get Started
          </Link>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="feed-container pt-14">
      {videos.map((video, idx) => (
        <div key={video.id} className="feed-item" data-index={idx}>
          <VideoCard
            video={video}
            user={currentUser}
            autoPlay={idx === activeIndex}
          />
        </div>
      ))}
    </div>
  )
}

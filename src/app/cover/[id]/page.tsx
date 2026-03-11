export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CoverForm from '@/components/CoverForm'

interface CoverPageProps {
  params: Promise<{ id: string }>
}

export default async function CoverPage({ params }: CoverPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: video } = await supabase
    .from('videos')
    .select(`*, profiles (id, username, avatar_url)`)
    .eq('id', id)
    .single()

  if (!video) notFound()

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Create Cover</h1>
          <p className="text-gray-400 mt-1">Watch the intro, then upload your continuation</p>
        </div>
        <CoverForm originalVideo={video} user={user} />
      </div>
    </div>
  )
}

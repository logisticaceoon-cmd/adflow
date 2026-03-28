'use client'
import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2, ImageIcon, Film } from 'lucide-react'

interface CreativeFile {
  name: string
  url: string
  type: 'image' | 'video'
  size: number
  path: string
}

export default function CreativesPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<CreativeFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function loadFiles() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.storage.from('creatives').list(user.id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
    const items: CreativeFile[] = (data || [])
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => {
        const path = `${user.id}/${f.name}`
        const { data: { publicUrl } } = supabase.storage.from('creatives').getPublicUrl(path)
        const isVideo = /\.(mp4|mov|webm|avi)$/i.test(f.name)
        return { name: f.name, url: publicUrl, type: isVideo ? 'video' : 'image', size: f.metadata?.size || 0, path }
      })
    setFiles(items)
    setLoaded(true)
  }

  if (!loaded) {
    loadFiles()
  }

  async function uploadFiles(fileList: FileList) {
    setUploading(true)
    setUploadError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const errors: string[] = []
    for (const file of Array.from(fileList)) {
      const ext  = file.name.split('.').pop()
      const name = `${Date.now()}_${file.name.replace(/\s/g, '_')}`
      const path = `${user.id}/${name}`
      const { error } = await supabase.storage.from('creatives').upload(path, file, { upsert: true })
      if (error) { errors.push(file.name); continue }
      const { data: { publicUrl } } = supabase.storage.from('creatives').getPublicUrl(path)
      const isVideo = /\.(mp4|mov|webm|avi)$/i.test(file.name)
      setFiles(prev => [{ name, url: publicUrl, type: isVideo ? 'video' : 'image', size: file.size, path }, ...prev])
    }

    if (errors.length) setUploadError(`No se pudieron subir: ${errors.join(', ')}`)
    setUploading(false)
  }

  async function deleteFile(path: string) {
    const supabase = createClient()
    await supabase.storage.from('creatives').remove([path])
    setFiles(prev => prev.filter(f => f.path !== path))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }, [])

  function formatSize(bytes: number) {
    if (!bytes) return ''
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="page-title mb-1">Biblioteca de creativos</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {files.length} archivo{files.length !== 1 ? 's' : ''} · Imágenes y videos para tus anuncios
          </p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary">
          <Upload size={15} />
          {uploading ? 'Subiendo...' : 'Subir archivos'}
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden"
               onChange={e => e.target.files && uploadFiles(e.target.files)} />
      </div>

      {uploadError && (
        <div className="mb-5 p-3 rounded-xl text-sm"
             style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
          ⚠ {uploadError}
        </div>
      )}

      {/* Drop zone */}
      <div
        className="border-2 border-dashed rounded-2xl p-10 text-center mb-8 transition-all cursor-pointer"
        style={{
          borderColor: dragging ? 'var(--accent)' : 'var(--border)',
          background: dragging ? 'rgba(233,30,140,0.06)' : 'transparent',
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
             style={{ background: 'rgba(233,30,140,0.1)' }}>
          <Upload size={22} style={{ color: 'var(--accent)' }} strokeWidth={1.75} />
        </div>
        <p className="text-sm font-medium mb-1">
          <span style={{ color: 'var(--accent)' }}>Hacé clic</span> o arrastrá archivos aquí
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>PNG, JPG, MP4, MOV · Máx. 50MB por archivo</p>
      </div>

      {/* Galería */}
      {files.length === 0 && !uploading ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🖼</div>
          <h2 className="font-display text-lg font-bold mb-2">Sin creativos todavía</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Subí tus imágenes y videos para usarlos en tus campañas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {files.map(f => (
            <div key={f.path} className="group relative rounded-2xl overflow-hidden"
                 style={{ background: 'var(--surface)', border: '1px solid var(--border)', aspectRatio: '1' }}>
              {f.type === 'image' ? (
                <img src={f.url} alt={f.name}
                     className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                     style={{ background: 'var(--surface2)' }}>
                  <Film size={32} style={{ color: 'var(--muted)' }} strokeWidth={1.5} />
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Video</p>
                </div>
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }}>
                <button
                  onClick={() => deleteFile(f.path)}
                  className="self-end w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
                  <Trash2 size={13} />
                </button>
                <div>
                  <p className="text-xs font-medium text-white truncate">{f.name}</p>
                  {f.size > 0 && <p className="text-[10px]" style={{ color: '#8892b0' }}>{formatSize(f.size)}</p>}
                </div>
              </div>

              {/* Type indicator */}
              <div className="absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center"
                   style={{ background: 'rgba(0,0,0,0.6)' }}>
                {f.type === 'image'
                  ? <ImageIcon size={12} color="white" />
                  : <Film size={12} color="white" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

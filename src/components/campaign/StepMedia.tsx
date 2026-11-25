'use client'
// Step 2: "Subí tu material" — optional media upload
import { useRef, useState } from 'react'
import { Upload, X, Play } from 'lucide-react'

interface Props {
  mediaFiles: File[]
  mediaPreviews: Array<string | null>
  onFilesAdded: (files: File[]) => Promise<void>
  onRemoveMedia: (idx: number) => void
  error: string
  onBack: () => void
  onGenerate: () => void
}

export default function StepMedia({ mediaFiles, mediaPreviews, onFilesAdded, onRemoveMedia, error, onBack, onGenerate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length) onFilesAdded(files)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="card" style={{ padding: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-display), Space Grotesk, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          Subí tu material
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
          Opcional. Si tenés fotos o videos de tu producto, la IA los analiza y crea copies personalizados. Si no, genera anuncios solo con texto.
        </p>

        {/* Upload zone */}
        <div
          className={`drop-zone-active ${isDragging ? 'ring-2 ring-primary' : ''}`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); onFilesAdded(Array.from(e.dataTransfer.files)) }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--ds-color-primary)' : 'var(--ds-card-border)'}`,
            borderRadius: 16, padding: mediaFiles.length ? 16 : 48,
            cursor: 'pointer', textAlign: 'center',
            background: isDragging ? 'rgba(79,110,247,0.06)' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <input ref={fileRef} type="file" multiple accept="image/*,video/mp4,video/quicktime" onChange={handleFileInput} hidden />

          {mediaFiles.length === 0 ? (
            <div>
              <Upload size={32} style={{ color: 'var(--ds-text-muted)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ds-text-secondary)', marginBottom: 4 }}>
                Arrastrá imágenes o videos acá
              </p>
              <p style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>
                JPG, PNG, WebP, MP4 · Máximo 10 archivos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {mediaFiles.map((file, idx) => (
                <div key={idx} className="relative group" style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: 'var(--ds-bg-elevated)' }}>
                  {file.type.startsWith('video/') ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={20} style={{ color: 'var(--ds-text-muted)' }} />
                    </div>
                  ) : mediaPreviews[idx] ? (
                    <img src={mediaPreviews[idx]!} alt="" className="w-full h-full object-cover" />
                  ) : null}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onRemoveMedia(idx) }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {mediaFiles.length < 10 && (
                <div className="flex items-center justify-center" style={{
                  aspectRatio: '1', borderRadius: 10,
                  border: '2px dashed var(--ds-card-border)',
                }}>
                  <Upload size={16} style={{ color: 'var(--ds-text-muted)' }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm" style={{ color: 'var(--ds-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Atrás
        </button>
        <button onClick={onGenerate} className="btn-primary" style={{
          padding: '14px 36px', fontSize: 15, fontWeight: 700,
          background: 'linear-gradient(135deg, var(--ds-color-primary), #7c3aed)',
        }}>
          ✨ Generar campaña con IA
        </button>
      </div>
    </div>
  )
}

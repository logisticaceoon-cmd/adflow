'use client'
// src/components/campaign/StepContent.tsx — Step 3: Contenido (media upload + optional extras)
import { useRef, useState } from 'react'
import { X, Upload, Play } from 'lucide-react'
import type { CreateCampaignForm } from '@/types'

interface Props {
  form: Pick<CreateCampaignForm, 'existing_copy' | 'target_audience'>
  setField: <K extends keyof CreateCampaignForm>(field: K, value: CreateCampaignForm[K]) => void
  mediaFiles: File[]
  mediaPreviews: Array<string | null>
  onFilesAdded: (files: File[]) => Promise<void>
  onRemoveMedia: (idx: number) => void
  error: string
  loading: boolean
  onBack: () => void
  onGenerate: () => void
}

export default function StepContent({
  form, setField, mediaFiles, mediaPreviews,
  onFilesAdded, onRemoveMedia, error, loading, onBack, onGenerate,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length) onFilesAdded(files)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragging(false)
    onFilesAdded(Array.from(e.dataTransfer.files))
  }

  return (
    <div className="space-y-5">
      {/* Media upload card */}
      <div style={{
        borderRadius: 18, padding: 22,
        background: 'linear-gradient(160deg, rgba(18,4,10,0.92) 0%, rgba(12,3,7,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
      }}>
        <h2 className="section-title mb-5">🎨 Materiales creativos</h2>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative rounded-2xl cursor-pointer transition-all ${isDragging ? 'drop-zone-active' : ''}`}
          style={{
            border: `1.5px dashed ${isDragging ? 'rgba(233,30,140,0.60)' : 'rgba(255,255,255,0.15)'}`,
            padding: '32px 20px', textAlign: 'center',
            background: isDragging ? 'rgba(233,30,140,0.04)' : 'rgba(255,255,255,0.02)',
          }}
        >
          <input
            ref={fileRef} type="file" multiple
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
            className="hidden"
            onChange={handleFileInput}
          />
          <Upload size={28} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Subí tus imágenes y videos</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            Imágenes: JPG, PNG, WebP, GIF (se comprimen automáticamente)<br />
            Videos: hasta 200MB (solo para storage, no se analizan por IA)<br />
            Formatos: JPG, PNG, WebP, GIF, MP4, MOV
          </p>
          {mediaFiles.length > 0 && (
            <p className="mt-2 text-xs font-semibold" style={{ color: '#62c4b0' }}>
              {mediaFiles.length} archivo{mediaFiles.length > 1 ? 's' : ''} seleccionado{mediaFiles.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Previews grid */}
        {mediaFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
            {mediaFiles.map((file, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden group"
                   style={{ aspectRatio: '1', background: 'var(--surface2)' }}>
                {file.type.startsWith('video/') ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                    <Play size={22} style={{ color: 'var(--muted)' }} />
                    <span className="text-[10px] text-center w-full overflow-hidden text-ellipsis" style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                  </div>
                ) : mediaPreviews[idx] ? (
                  <img src={mediaPreviews[idx]!} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Upload size={16} style={{ color: 'var(--muted)' }} />
                  </div>
                )}

                {/* Compression badge */}
                {!file.type.startsWith('video/') && (
                  <div style={{
                    position: 'absolute', top: 4, left: 4,
                    padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                    background: 'rgba(245,158,11,0.90)', color: '#fff',
                  }}>
                    Comprimiendo
                  </div>
                )}

                {/* Video size warning */}
                {file.type.startsWith('video/') && file.size > 200 * 1024 * 1024 && (
                  <div style={{
                    position: 'absolute', top: 4, left: 4,
                    padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                    background: 'rgba(239,68,68,0.90)', color: '#fff',
                  }}>
                    &gt;200MB
                  </div>
                )}

                <button
                  onClick={e => { e.stopPropagation(); onRemoveMedia(idx) }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.65)' }}
                >
                  <X size={11} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optional extras */}
      <div style={{
        borderRadius: 18, padding: 20,
        background: 'linear-gradient(160deg, rgba(18,4,10,0.92) 0%, rgba(12,3,7,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
      }}>
        <h2 className="section-title mb-4">
          ✏️ Información adicional
          <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 12, marginLeft: 6 }}>(opcional)</span>
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label">Copy o mensaje previo</label>
            <textarea className="input-field" rows={2}
              placeholder="Si tenés un copy que ya usaste antes, pegalo acá para que la IA lo mejore"
              value={form.existing_copy}
              onChange={e => setField('existing_copy', e.target.value as any)}
            />
          </div>
          <div>
            <label className="label">Audiencia específica</label>
            <input className="input-field"
              placeholder='Ej: "Mujeres 25-45 interesadas en yoga y bienestar"'
              value={form.target_audience}
              onChange={e => setField('target_audience', e.target.value as any)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="btn-ghost" disabled={loading}>← Atrás</button>
        <button onClick={onGenerate} className="btn-primary px-8" style={{ fontSize: 14 }} disabled={loading}>
          ✨ Generar estrategia con IA
        </button>
      </div>
    </div>
  )
}


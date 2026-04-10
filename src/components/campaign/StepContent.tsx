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
      {/* Step header */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ds-color-primary)', marginBottom: 8 }}>
          Paso 4 de 5 · Contenido
        </p>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
          Subí tus creativos
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)' }}>
          Las imágenes y videos que va a usar la IA para diseñar tus anuncios. Cuanto mejor el material, mejor el resultado.
        </p>
      </div>

      {/* Media upload card */}
      <div className="card" style={{ padding: 22 }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          🎨 Materiales creativos
        </h3>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 16 }}>
          Arrastrá los archivos o hacé click para seleccionarlos
        </p>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative rounded-2xl cursor-pointer transition-all ${isDragging ? 'drop-zone-active' : ''}`}
          style={{
            border: `1.5px dashed ${isDragging ? 'transparent' : 'rgba(255,255,255,0.15)'}`,
            padding: '32px 20px', textAlign: 'center',
            background: isDragging ? 'var(--ds-color-primary-soft)' : 'rgba(255,255,255,0.02)',
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
          <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.6 }}>
            Imágenes: JPG, PNG, WebP, GIF (se comprimen automáticamente)<br />
            Videos: hasta 200MB (solo para storage, no se analizan por IA)<br />
            Formatos: JPG, PNG, WebP, GIF, MP4, MOV
          </p>
          {mediaFiles.length > 0 && (
            <p className="mt-2 text-xs font-semibold" style={{ color: 'var(--ds-color-primary)' }}>
              {mediaFiles.length} archivo{mediaFiles.length > 1 ? 's' : ''} seleccionado{mediaFiles.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Previews grid */}
        {mediaFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
            {mediaFiles.map((file, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden group"
                   style={{ aspectRatio: '1', background: 'var(--ds-bg-elevated)' }}>
                {file.type.startsWith('video/') ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                    <Play size={22} style={{ color: 'var(--ds-text-secondary)' }} />
                    <span className="text-[10px] text-center w-full overflow-hidden text-ellipsis" style={{ color: 'var(--ds-text-secondary)', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                  </div>
                ) : mediaPreviews[idx] ? (
                  <img src={mediaPreviews[idx]!} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Upload size={16} style={{ color: 'var(--ds-text-secondary)' }} />
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
      <div className="card" style={{ padding: 22 }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          ✏️ Información adicional
          <span style={{ fontWeight: 400, color: 'var(--ds-text-secondary)', fontSize: 11, marginLeft: 4 }}>(opcional)</span>
        </h3>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 16 }}>
          Si tenés contexto extra que pueda ayudar a la IA, sumalo acá
        </p>
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


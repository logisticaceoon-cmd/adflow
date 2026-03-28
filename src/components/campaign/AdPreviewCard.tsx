'use client'
// src/components/campaign/AdPreviewCard.tsx
import { useState, useEffect } from 'react'
import type { AdCopyItem } from '@/types'

// ── EditableField ────────────────────────────────────────────────────────────
interface EditableFieldProps {
  value: string
  fieldKey: string
  multiline?: boolean
  maxChars?: number
  onSave: (v: string) => void
  editingField: string | null
  setEditingField: (k: string | null) => void
  style?: React.CSSProperties
  className?: string
}

export function EditableField({
  value, fieldKey, multiline, maxChars, onSave,
  editingField, setEditingField, style, className,
}: EditableFieldProps) {
  const isEditing = editingField === fieldKey
  const [localVal, setLocalVal] = useState(value)

  // Keep local in sync when not editing
  useEffect(() => {
    if (!isEditing) setLocalVal(value)
  }, [value, isEditing])

  if (!isEditing) {
    return (
      <span
        onClick={() => setEditingField(fieldKey)}
        style={{
          cursor: 'text',
          textDecoration: 'underline dotted',
          textUnderlineOffset: 3,
          borderRadius: 3,
          padding: '0 2px',
          transition: 'background 0.15s',
          ...style,
        }}
        className={className}
        title="Click para editar"
      >
        {value || <em style={{ opacity: 0.4, fontStyle: 'italic' }}>Vacío</em>}
      </span>
    )
  }

  const save = () => { onSave(localVal); setEditingField(null) }

  if (multiline) {
    return (
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        <textarea
          autoFocus
          rows={3}
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onBlur={save}
          onKeyDown={e => e.key === 'Escape' && setEditingField(null)}
          style={{
            width: '100%', fontSize: 'inherit', lineHeight: 'inherit',
            background: 'rgba(0,0,0,0.12)', border: '1.5px solid rgba(0,0,0,0.25)',
            borderRadius: 6, padding: '4px 6px', resize: 'none',
            outline: 'none', color: 'inherit', fontFamily: 'inherit',
          }}
        />
        {maxChars && (
          <span style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 9, opacity: 0.5, pointerEvents: 'none' }}>
            {localVal.length}/{maxChars}
          </span>
        )}
      </div>
    )
  }

  return (
    <input
      autoFocus
      type="text"
      value={localVal}
      onChange={e => setLocalVal(e.target.value)}
      onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditingField(null) }}
      style={{
        fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit',
        background: 'rgba(0,0,0,0.12)', border: '1.5px solid rgba(0,0,0,0.25)',
        borderRadius: 6, padding: '2px 6px', outline: 'none',
        color: 'inherit', fontFamily: 'inherit', width: '100%',
      }}
    />
  )
}

// ── FacebookAdPreview ────────────────────────────────────────────────────────
interface AdPreviewProps {
  ad: AdCopyItem
  setIdx: number
  adIdx: number
  imageUrl?: string | null
  pageName: string
  destinationUrl?: string
  editingField: string | null
  setEditingField: (k: string | null) => void
  onPatchAd: (setIdx: number, adIdx: number, field: keyof AdCopyItem, value: string) => void
}

export function FacebookAdPreview({
  ad, setIdx, adIdx, imageUrl, pageName, destinationUrl,
  editingField, setEditingField, onPatchAd,
}: AdPreviewProps) {
  const hostname = (() => {
    if (!destinationUrl) return null
    try { return new URL(destinationUrl).hostname } catch { return destinationUrl }
  })()

  return (
    <div style={{
      background: '#ffffff', borderRadius: 10, overflow: 'hidden', color: '#1c1e21',
      boxShadow: '0 4px 24px rgba(0,0,0,0.30)', maxWidth: 440, width: '100%', margin: '0 auto',
      fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif', fontSize: 15,
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #ea1b7e, #62c4b0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#fff', fontWeight: 700,
        }}>
          {pageName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#050505' }}>{pageName}</p>
          <p style={{ fontSize: 12, color: '#65676b', margin: 0 }}>Patrocinado · 🌐</p>
        </div>
        <div style={{ marginLeft: 'auto', color: '#65676b', fontSize: 18, lineHeight: 1 }}>···</div>
      </div>

      {/* Primary text */}
      <div style={{ padding: '10px 16px 8px', color: '#1c1e21', lineHeight: 1.5 }}>
        <EditableField
          value={ad.primary_text || ''}
          fieldKey={`${setIdx}-${adIdx}-primary_text`}
          multiline maxChars={125}
          onSave={v => onPatchAd(setIdx, adIdx, 'primary_text', v)}
          editingField={editingField} setEditingField={setEditingField}
        />
      </div>

      {/* Image */}
      <div style={{ width: '100%', aspectRatio: '1.91/1', background: '#f0f2f5', overflow: 'hidden', position: 'relative' }}>
        {imageUrl
          ? <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#8a8d91' }}>
              <span style={{ fontSize: 28 }}>🖼️</span>
              <span style={{ fontSize: 12 }}>Tu imagen aparecerá aquí</span>
            </div>
          )
        }
        {(ad as any).creative_suggestion && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 10px', background: 'rgba(0,0,0,0.55)', fontSize: 10, color: 'rgba(255,255,255,0.88)', lineHeight: 1.4 }}>
            💡 {(ad as any).creative_suggestion}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e4e6eb', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {hostname && (
            <p style={{ fontSize: 11, color: '#65676b', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {hostname}
            </p>
          )}
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#050505' }}>
            <EditableField
              value={ad.headline || ''}
              fieldKey={`${setIdx}-${adIdx}-headline`}
              maxChars={40}
              onSave={v => onPatchAd(setIdx, adIdx, 'headline', v)}
              editingField={editingField} setEditingField={setEditingField}
            />
          </p>
          {ad.description && (
            <p style={{ fontSize: 13, color: '#65676b', margin: '2px 0 0' }}>
              <EditableField
                value={ad.description}
                fieldKey={`${setIdx}-${adIdx}-description`}
                maxChars={30}
                onSave={v => onPatchAd(setIdx, adIdx, 'description', v)}
                editingField={editingField} setEditingField={setEditingField}
              />
            </p>
          )}
        </div>
        <button style={{
          background: '#e4e6eb', border: 'none', borderRadius: 6,
          padding: '8px 14px', fontSize: 13, fontWeight: 600,
          cursor: 'default', whiteSpace: 'nowrap', flexShrink: 0, color: '#050505',
        }}>
          {ad.call_to_action || 'Más información'}
        </button>
      </div>
    </div>
  )
}

// ── InstagramStoriesPreview ──────────────────────────────────────────────────
export function InstagramAdPreview({
  ad, setIdx, adIdx, imageUrl, pageName,
  editingField, setEditingField, onPatchAd,
}: AdPreviewProps) {
  return (
    <div style={{
      background: '#000', borderRadius: 16, overflow: 'hidden', color: '#fff',
      width: 270, aspectRatio: '9/16', position: 'relative', margin: '0 auto',
      fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
      boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
    }}>
      {imageUrl
        ? <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }} />
      }

      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.88) 100%)' }} />

      {/* Progress bars */}
      <div style={{ position: 'absolute', top: 10, left: 12, right: 12, display: 'flex', gap: 3 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 2.5, borderRadius: 2, background: i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }} />
        ))}
      </div>

      {/* Header */}
      <div style={{ position: 'absolute', top: 22, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #ea1b7e, #62c4b0)', border: '1.5px solid rgba(255,255,255,0.8)', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{pageName}</p>
          <p style={{ fontSize: 10, margin: 0, opacity: 0.75 }}>Patrocinado</p>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 16, opacity: 0.8 }}>···</div>
      </div>

      {/* Content */}
      <div style={{ position: 'absolute', bottom: 58, left: 14, right: 14 }}>
        <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.25, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
          <EditableField
            value={ad.headline || ''}
            fieldKey={`ig-${setIdx}-${adIdx}-headline`}
            maxChars={40}
            onSave={v => onPatchAd(setIdx, adIdx, 'headline', v)}
            editingField={editingField} setEditingField={setEditingField}
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
          />
        </p>
        <div style={{ fontSize: 13, lineHeight: 1.4, opacity: 0.9, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
          <EditableField
            value={ad.primary_text || ''}
            fieldKey={`ig-${setIdx}-${adIdx}-primary_text`}
            multiline maxChars={125}
            onSave={v => onPatchAd(setIdx, adIdx, 'primary_text', v)}
            editingField={editingField} setEditingField={setEditingField}
          />
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
        <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 20, padding: '8px 0', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#000' }}>
          {ad.call_to_action || 'Más información'}
        </div>
      </div>
    </div>
  )
}

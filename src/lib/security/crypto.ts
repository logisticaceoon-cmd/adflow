// src/lib/security/crypto.ts
// Cifrado simétrico en reposo (AES-256-GCM) para secretos sensibles como los
// tokens de acceso de Facebook. Antes se guardaban en texto plano: ante
// cualquier fuga de la base, un token con `ads_management` permite gastar el
// presupuesto publicitario de todos los usuarios.
//
// Clave: variable de entorno TOKEN_ENCRYPTION_KEY (32 bytes → 64 hex o base64).
// Generar una con:  openssl rand -hex 32
//
// Compatibilidad hacia atrás: decryptSecret() detecta valores en texto plano
// (sin el prefijo) y los devuelve tal cual, para poder desplegar el cifrado y
// migrar los tokens existentes sin cortar el servicio.
import crypto from 'crypto'

const PREFIX = 'enc:v1:'

function getKey(): Buffer | null {
  const raw = process.env.TOKEN_ENCRYPTION_KEY
  if (!raw) return null
  const buf = raw.length === 64 ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64')
  if (buf.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY debe representar 32 bytes (64 hex o base64 de 32 bytes)')
  }
  return buf
}

/** Indica si el cifrado está activo (clave presente). */
export function encryptionEnabled(): boolean {
  return !!process.env.TOKEN_ENCRYPTION_KEY
}

/** Cifra un secreto. Si no hay clave configurada, devuelve el texto plano (dev). */
export function encryptSecret(plain: string): string {
  const key = getKey()
  if (!key) {
    console.warn('[crypto] TOKEN_ENCRYPTION_KEY no configurada — guardando token SIN cifrar')
    return plain
  }
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':')
}

/** Descifra un secreto. Valores sin el prefijo se consideran texto plano legacy. */
export function decryptSecret(value: string | null | undefined): string {
  if (!value) return ''
  if (!value.startsWith(PREFIX)) return value // legacy: texto plano
  const key = getKey()
  if (!key) throw new Error('Hay tokens cifrados pero falta TOKEN_ENCRYPTION_KEY')
  const rest = value.slice(PREFIX.length)
  const [ivB64, tagB64, dataB64] = rest.split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const data = Buffer.from(dataB64, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

/** True si el valor ya está cifrado con este esquema. */
export function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith(PREFIX)
}

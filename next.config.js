/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Reducido de 50mb: las imágenes de anuncios se comprimen en el cliente
      // antes de enviarse. 12mb cubre varias imágenes sin exponer la función a
      // payloads gigantes (abuso de memoria/costo).
      bodySizeLimit: '12mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
    ],
  },
}

module.exports = nextConfig

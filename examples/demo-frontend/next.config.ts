import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url))
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**'
      }
    ]
  }
}

export default nextConfig

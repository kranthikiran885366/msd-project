/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendUrl = process.env.INTERNAL_BACKEND_URL || process.env.API_URL || process.env.BACKEND_URL || 'http://backend:3001'
    const baseBackendUrl = backendUrl.replace(/\/api$/, '')
    return {
      // Keep local Next API routes active; only proxy unresolved API/auth paths.
      fallback: [
        {
          source: '/api/:path*',
          destination: `${baseBackendUrl}/api/:path*`,
        },
        {
          source: '/auth/:path*',
          destination: `${baseBackendUrl}/auth/:path*`,
        },
      ],
    }
  },
}

export default nextConfig

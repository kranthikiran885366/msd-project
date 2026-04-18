/** @type {import('next').NextConfig} */
const nextConfig = {
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
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const baseBackendUrl = backendUrl.replace(/\/api$/, '')
    return {
      beforeFiles: [
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

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
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deployer-6mfg.onrender.com/api'
    // Remove /api suffix if present to get base backend URL
    const baseBackendUrl = backendUrl.replace(/\/api$/, '')
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/:path*`,
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

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
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/:path*`,
        },
      ],
    }
  },
}

export default nextConfig

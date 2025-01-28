/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
    ],
  },
  // Enable static exports for Cloudflare Pages
  output: 'export',
  // Disable server components since we're doing static export
  experimental: {
    appDir: true,
  },
}

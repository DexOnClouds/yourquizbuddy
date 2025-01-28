/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['i.ibb.co'],
  },
  // Enable static exports for Cloudflare Pages
  output: 'export',
}

module.exports = nextConfig

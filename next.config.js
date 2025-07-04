/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Webpack fallbacks removed as ElevenLabs SDK is now isolated in a Node.js route
};

module.exports = nextConfig;

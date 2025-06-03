import type {NextConfig} from 'next';
const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: ['https://7000-firebase-studio-1747828800055.cluster-ejd22kqny5htuv5dfowoyipt52.cloudworkstations.dev'],
  }
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The AI tools chart moved to the end of AI impact.
      {
        source: '/insights/fingerprints',
        destination: '/insights#ai-tools',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

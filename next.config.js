/** @type {import('next').NextConfig} */
const isFirebase = process.env.FIREBASE_EXPORT === '1';

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.maariv.co.il' },
    ],
    unoptimized: true,
  },
  // Firebase build: static export that reads data from the Vercel API (NEXT_PUBLIC_API_BASE)
  ...(isFirebase
    ? { output: 'export' }
    : {
        // Allow the Firebase-hosted copy to call the API cross-origin
        async headers() {
          return [
            {
              source: '/api/:path*',
              headers: [
                { key: 'Access-Control-Allow-Origin', value: '*' },
                { key: 'Access-Control-Allow-Methods', value: 'GET' },
              ],
            },
          ];
        },
      }),
};

module.exports = nextConfig;

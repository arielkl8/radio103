/** @type {import('next').NextConfig} */
const isFirebase = process.env.FIREBASE_EXPORT === '1';
// App version shown in the UI: package.json "0.1.0" -> "0.1" (displayed as V0.1)
const { version } = require('./package.json');
const appVersion = version.split('.').slice(0, 2).join('.');

const nextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: appVersion },
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

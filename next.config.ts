import type {Config} from 'next';

const nextConfig: Config = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/chatbot/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-control-allow-origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          // Remove X-Frame-Options and use Content-Security-Policy for modern browsers
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' }, // Keeping this for older browser compatibility but allowing specific framing below
        ],
      },
      {
        source: '/chatbot/:id',
        headers: [
            // This allows the page to be framed anywhere. Be careful with this in production.
             { key: 'Content-Security-Policy', value: 'frame-ancestors *' }
        ]
      }
    ];
  },
};

export default nextConfig;

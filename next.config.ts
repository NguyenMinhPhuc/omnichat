import type {Config} from 'next';

const nextConfig: Config = {
  reactStrictMode: true,
  // Add the experimental block here
  experimental: {
    // This allows the Next.js dev server to accept requests from the
    // Firebase Studio preview URL.
    allowedDevOrigins: [
      'https://*.cluster-6dx7corvpngoivimwvvljgokdw.cloudworkstations.dev',
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Be more specific in production
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
      {
        // This is for the embedded chatbot page
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

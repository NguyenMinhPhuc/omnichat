
import type {Config} from 'next';

const nextConfig: Config = {
  reactStrictMode: true,
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
  experimental: {
    // This is to allow cross-origin requests in the development environment.
    // The Firebase Studio preview URL is considered a cross-origin request.
    allowedDevOrigins: ["*.cloudworkstations.dev"],
  }
};

export default nextConfig;

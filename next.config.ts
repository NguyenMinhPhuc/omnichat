
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Other experimental features can go here.
      // Thêm domain/IP mà Anh dùng để dev
    allowedDevOrigins: [
      "http://localhost:3000",
      "http://172.16.29.251:9002"
    ],
  },
  // Make server-side environment variables available to Next.js
  env: {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-control-allow-origin', value: '*' }, // Be more specific in production
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

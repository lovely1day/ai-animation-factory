/** @type {import('next').NextConfig} */
const ALLOWED_ORIGINS = [
  "https://feelthemusic.app",
  "https://www.feelthemusic.app",
  "http://localhost:8080",
];

const nextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${ALLOWED_ORIGINS.join(" ")}`,
          },
        ],
      },
    ];
  },

  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

module.exports = nextConfig;

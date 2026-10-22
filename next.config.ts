import path from 'node:path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: process.cwd(),
  webpack(config) {
    // Official Tide scaffold workarounds for SDK re-exports and its mixed CJS/ESM build.
    config.module.strictExportPresence = false;
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tidecloak/react': path.resolve(process.cwd(), 'node_modules/@tidecloak/react/dist/esm/index.js'),
    };
    return config;
  },
  async headers() {
    return [
      { source: '/:path*', headers: [
        { key: 'Content-Security-Policy', value: "frame-src 'self' http://localhost:8080 http://127.0.0.1:8080 https:; frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ] },
      { source: '/tide_dpop/:path*', headers: [
        // Tide's reviewed static relay is embedded by its HTTPS enclave, not by our own origin.
        // Main pages remain protected by frame-ancestors 'self'; X-Frame-Options must not block this relay.
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'unsafe-inline'; frame-ancestors https:" },
        { key: 'Allow-CSP-From', value: '*' },
      ] },
    ];
  },
  async rewrites() {
    return [{ source: '/tide_dpop/:path*', destination: '/tide_dpop_auth.html' }];
  },
};
export default config;

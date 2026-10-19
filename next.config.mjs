import os from "node:os";

// Let the dev server load its scripts when the app is opened through this computer's network addresses, not only localhost.
const localAddresses = Object.values(os.networkInterfaces())
  .flat()
  .filter(address => address && address.family === "IPv4")
  .map(address => address.address);

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" }
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  allowedDevOrigins: localAddresses,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  }
};

export default nextConfig;

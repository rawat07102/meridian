import { withRelatedProject } from '@vercel/related-projects';
import type { NextConfig } from 'next';

function getApiUrl(): string {
  // Explicit override
  if (process.env.API_URL) {
    console.log('API_URL found, using as NEXT_PUBLIC_API_URL');
    return process.env.API_URL;
  }

  // Running in vercel with no explicit override, use related project
  if (process.env.VERCEL) {
    const apiHost = withRelatedProject({
      projectName: 'meridian-api',
      defaultHost: 'meridian-api-opal.vercel.app',
    });
    console.log(`API_URL not found, using https://${apiHost} url as NEXT_PUBLIC_API_URL`);
    return `https://${apiHost}`;
  }

  // if nothing is set in local dev environment
  console.log('API_URL not set in .env.local, using http://loclhost:4000 as NEXT_PUBLIC_API_URL');
  return 'http://localhost:4000';
}
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: getApiUrl(),
  },
};

export default nextConfig;

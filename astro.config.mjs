import { defineConfig } from 'astro/config';

const [owner = 'halr9000', repository = 'sw5e-blacksite'] = (process.env.GITHUB_REPOSITORY || 'halr9000/sw5e-blacksite').split('/');
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const base = isGitHubPages ? `/${repository}` : '/blacksite';
const site = isGitHubPages
  ? `https://${owner}.github.io${base}`
  : 'https://neo.taileffc7.ts.net/blacksite';

export default defineConfig({
  site,
  base,
  output: 'static',
  vite: {
    server: {
      allowedHosts: ['neo.taileffc7.ts.net'],
    },
    preview: {
      allowedHosts: ['neo.taileffc7.ts.net'],
    },
  },
});

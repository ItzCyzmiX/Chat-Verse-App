import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'; // New import
export default {
  kit: {
    adapter: adapter({
      // Optional: Specify output directory (default is 'build')
      pages: 'build',
      assets: 'build',
      fallback: 'index.html', // Required for SPA mode
    }),
  },
  preprocess: vitePreprocess(),
};

import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess({})],

  kit: {
    adapter: adapter(),
    alias: {
      $lib: 'src/lib',
      $components: 'src/components',
      $cards: 'src/cards'
    }
  }
};

export default config;

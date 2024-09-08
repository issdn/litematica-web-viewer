import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	assetsInclude: ['**/*.litematic'],
	test: {
		include: ['src/test/**/*.{test,spec}.{js,ts}']
	}
});

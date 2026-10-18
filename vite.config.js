import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))

export default defineConfig({
	base: './',
	plugins: [react()],
	define: {
		__BUILD_DATE__: JSON.stringify(new Date().toISOString()),
		__APP_VERSION__: JSON.stringify(version),
	},
	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
})

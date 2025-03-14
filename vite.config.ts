import { defineConfig } from "vite";
import tailwindcss from '@tailwindcss/vite'
import path from "path";
import tsconfigPaths from 'vite-tsconfig-paths';

const root = path.resolve(__dirname, "src/app-web");

export default defineConfig({
	root: root,
	publicDir: path.resolve(__dirname, "static"),

	build: {
		outDir: path.resolve(__dirname, "dist/web-app"),
		emptyOutDir: true,

		modulePreload: {
			polyfill: false,
		}
	},
	plugins: [
		tailwindcss(),
		tsconfigPaths({
			loose: true,
		}),
	],
});
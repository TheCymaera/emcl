import rollup from 'rollup';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import node from "@rollup/plugin-node-resolve";
import shebang from 'rollup-plugin-add-shebang';
import { string } from 'rollup-plugin-string';

const useTerser = true;//!process.env.ROLLUP_WATCH;

export default rollup.defineConfig([
	{
		input: 'src/app-web/main.ts',
		output: {
			sourcemap: true,
			format: 'iife',
			file: 'app-web/dst/main.js',
			assetFileNames: '[name][extname]',
		},
		plugins: [
			node(),
			string({ include: "**/*.html" }),
			typescript(),
			useTerser ? terser() : undefined,
		]
	},


	{
		input: 'src/app-cli/main.ts',
		output: {
			sourcemap: true,
			format: 'iife',
			file: 'app-cli/dst/main.js'
		},
		plugins: [
			typescript(),
			node(),
			string({
				include: "**/*.html"
			}),
			shebang({
				include: 'app-cli/dst/main.js',
				shebang: '#!/usr/bin/env node',
			}),
			useTerser ? terser() : undefined,
		]
	},
]);

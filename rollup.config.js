import rollup from 'rollup';
import sourcemaps from "rollup-plugin-sourcemaps";
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import node from "@rollup/plugin-node-resolve";
import shebang from 'rollup-plugin-add-shebang';

const useTerser = true;//!process.env.ROLLUP_WATCH;

export default rollup.defineConfig([
	{
		input: 'src/app-web/main.ts',
		output: {
			sourcemap: true,
			format: 'iife',
			file: 'app-web/dst/main.js'
		},
		plugins: [
			typescript(),
			node(),
			sourcemaps(),
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
			sourcemaps(),
			shebang({
				include: 'app-cli/dst/main.js',
				shebang: '#!/usr/bin/env node',
			}),
			useTerser ? terser() : undefined,
		]
	},
]);

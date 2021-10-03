import rollup from 'rollup';
import sourcemaps from "rollup-plugin-sourcemaps";
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import node from "@rollup/plugin-node-resolve";

const useTerser = true;//!process.env.ROLLUP_WATCH;

export default rollup.defineConfig([
	{
		input: 'src/app/main.ts',
		output: {
			sourcemap: true,
			format: 'iife',
			file: 'public/dst/main.js'
		},
		plugins: [
			typescript(),
			node(),
			sourcemaps(),
			useTerser ? terser() : undefined,
		]
	},
	{
		input: 'src/app/service-worker.ww.ts',
		output: {
			sourcemap: true,
			format: 'iife',
			file: 'public/service-worker.ww.js'
		},
		plugins: [
			typescript(),
			node(),
			sourcemaps(),
			useTerser ? terser() : undefined,
		]
	}
]);

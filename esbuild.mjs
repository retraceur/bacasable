/**
 * Build script for bacÀsable.
 *
 * @module build
 * @since 0.9.0
 */

import * as esbuild from 'esbuild';
import { chmodSync } from 'fs';

await esbuild.build({
	entryPoints: [
		'src/index.ts',
		'src/main.ts',
	],
	outdir: 'build',
	target: 'node18',
	bundle: true,
	packages: 'external',
	format: 'esm',
	platform: 'node',
	banner: {
		js: '#!/usr/bin/env node\n',
	},
});

chmodSync('./build/main.js', 0o755);

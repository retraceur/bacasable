/**
 * Executes a PHP CLI command using the BacAsable environment.
 *
 * @module execute-php
 * @since 0.9.0
 */

import { useHostFilesystem } from '@php-wasm/node';
import startBacAsable from './bacasable';
import { BacAsableMode, BacAsableOptions } from './config';
import { disableOutput } from './output';
import * as path from 'path';
import fs from 'fs-extra';

/**
 * Execute a PHP cli given its parameters.
 *
 * @param phpArgs - Arguments to pass to the PHP cli. The first argument should be the string 'php'.
 * @param options - Optional configuration object for BacAsable. Defaults to an empty object.
 * @returns - Returns a Promise that resolves to an object containing
 * the exit name and status (0 for success).
 * @throws - Throws an error if the first element in phpArgs is not the string 'php'.
 */
export async function executePHP(
	phpArgs: string[],
	options: BacAsableOptions = {}
) {
	if (phpArgs[0] !== 'php') {
		throw new Error(
			'The first argument to executePHP must be the string "php".'
		);
	}
	disableOutput();
	const { php, options: wpNowOptions } = await startBacAsable({
		...options,
		mode: BacAsableMode.INDEX,
	});

	try {
		useHostFilesystem(php);
		if (!path.isAbsolute(phpArgs[1])) {
			const maybePhpFile = path.join(
				wpNowOptions.projectPath,
				phpArgs[1]
			);
			if (fs.existsSync(maybePhpFile)) {
				phpArgs[1] = maybePhpFile;
			}
		}
		await php.cli(phpArgs);
	} catch (resultOrError) {
		const success =
			resultOrError.name === 'ExitStatus' && resultOrError.status === 0;
		if (!success) {
			throw resultOrError;
		}
	}
}

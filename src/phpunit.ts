/**
 * bacÀsable - PHPUnit command
 *
 * Runs the Retraceur PHPUnit tests inside the PHP Wasm runtime of Playground, so no local PHP is required.
 * The PHPUnit PHAR (`.phpunit/phpunit.phar`) and the `phpunit-testcases` repository are installed in the
 * Retraceur directory by its `npm install` (see `bin/phpunit.mjs`): this command only runs them.
 *
 * @module phpunit
 * @since 1.1.0
 */

import { runCLI } from '@wp-playground/cli';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { output } from './output.js';
import { DEFAULT_PHP_VERSION } from './constants.js';
import { isRetraceurDirectory } from './utils/is-retraceur-directory.js';

export interface PhpunitOptions {
	path: string;
	php?: string;
	args?: string[];
}

const VFS_RETRACEUR = '/wordpress';
const TESTCASES_DIR = 'phpunit-testcases';
const PHAR_FILE = path.join( '.phpunit', 'phpunit.phar' );
const CONFIG_FILE = 'phpunit-playground.xml.dist';
const INSTALL_FILE = 'install.php';

// Where the SQLite integration stores its database. It is mounted from a temporary host
// directory, so the tests never touch the database of a running `bacasable start`.
const VFS_DATABASE = `${ VFS_RETRACEUR }/wp-content/database`;

/**
 * Run the Retraceur PHPUnit tests in PHP Wasm.
 *
 * @since 1.1.0
 *
 * @param options - The options for running PHPUnit.
 * @returns The exit code of PHPUnit (0: success, 1: failures, 2: errors).
 */
export async function runPhpunit( options: PhpunitOptions ): Promise<number> {
	const projectPath = path.resolve( options.path || process.cwd() );
	const userArgs = options.args ?? [];

	if ( ! isRetraceurDirectory( projectPath ) ) {
		throw new Error( `${ projectPath } is not a Retraceur directory.` );
	}

	for ( const required of [ PHAR_FILE, path.join( TESTCASES_DIR, CONFIG_FILE ) ] ) {
		if ( ! existsSync( path.join( projectPath, required ) ) ) {
			throw new Error( `${ required } not found in ${ projectPath }. Run "npm install" in Retraceur to set up the PHPUnit tests.` );
		}
	}

	// Existing host paths (test files or directories) are converted to VFS paths, other values are left as is (e.g. `--filter`).
	const phpunitArgs = userArgs.map( ( arg ) => {
		if ( arg.startsWith( '-' ) ) {
			return arg;
		}

		const hostPath = path.resolve( projectPath, arg );
		const relative = path.relative( projectPath, hostPath );

		return existsSync( hostPath ) && ! relative.startsWith( '..' )
			? path.posix.join( VFS_RETRACEUR, ...relative.split( path.sep ) )
			: arg;
	} );

	const hasOption = ( name: string ): boolean =>
		userArgs.some( ( arg ) => arg === name || ( arg === '-c' && name === '--configuration' ) || arg.startsWith( `${ name }=` ) );

	if ( ! hasOption( '--configuration' ) ) {
		phpunitArgs.unshift( '--configuration', `${ VFS_RETRACEUR }/${ TESTCASES_DIR }/${ CONFIG_FILE }` );
	}

	if ( process.stdout.isTTY && ! hasOption( '--colors' ) && ! hasOption( '--no-colors' ) ) {
		phpunitArgs.push( '--colors=always' );
	}

	// Empty and disposable: Retraceur is installed in it before each run.
	const databasePath = mkdtempSync( path.join( os.tmpdir(), 'bacasable-phpunit-' ) );

	const mounts: Array<{ hostPath: string; vfsPath: string }> = [
		{ hostPath: projectPath, vfsPath: VFS_RETRACEUR },
		{ hostPath: databasePath, vfsPath: VFS_DATABASE },
	];

	const common = {
		command: 'php' as const,
		php: ( options.php || DEFAULT_PHP_VERSION ) as any,
		mount: mounts,
		wordpressInstallMode: 'do-not-attempt-installing' as const,
		verbosity: 'quiet' as const,
	};

	// `_[0]` is the command name, the following tokens are the arguments of the PHP binary.
	const phpArgs = [ 'php', '-d', 'memory_limit=512M' ];

	try {
		output?.log( '[phpunit] Installing Retraceur in a temporary database…' );

		const installCode = await runCLI( {
			...common,
			_: [ ...phpArgs, `${ VFS_RETRACEUR }/${ TESTCASES_DIR }/${ INSTALL_FILE }` ],
		} );

		if ( installCode !== 0 ) {
			return installCode;
		}

		return await runCLI( {
			...common,
			_: [ ...phpArgs, `${ VFS_RETRACEUR }/${ PHAR_FILE.split( path.sep ).join( '/' ) }`, ...phpunitArgs ],
		} );
	} finally {
		rmSync( databasePath, { recursive: true, force: true } );
	}
}

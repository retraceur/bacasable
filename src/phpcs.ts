/**
 * bacÀsable - PHPCS command
 *
 * Runs PHP_CodeSniffer inside the PHP Wasm runtime of Playground, so no local PHP is required.
 * The PHAR and the coding standards are described by a `phpcs-deps.json` manifest located
 * at the root of the project, and are installed in its `.phpcs/` directory.
 *
 * @module phpcs
 * @since 1.1.0
 */

import { runCLI } from '@wp-playground/cli';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { output } from './output.js';
import { DEFAULT_PHP_VERSION } from './constants.js';

export interface PhpcsDependency {
	version: string;
	url: string;
	sha256?: string;
}

export type PhpcsDependencies = Record<string, PhpcsDependency>;

export interface PhpcsOptions {
	path: string;
	php?: string;
	args?: string[];
}

const MANIFEST_FILE = 'phpcs-deps.json';
const DEPS_DIR = '.phpcs';
const VFS_PROJECT = '/project';
const VFS_RETRACEUR_CS = '/retraceur-cs';

// Same value as `E_ALL & ~E_DEPRECATED`: PHPCS 3.13 emits deprecation notices on PHP 8.3 that would pollute the report.
// Passed with `-d` flags to the PHP binary, as `php-ini` is not available in the `RunCLIArgs` type of older @wp-playground/cli versions (3.1.54).
const ERROR_REPORTING = '24575';

// Same lookup order as PHPCS.
const RULESET_FILES = [ '.phpcs.xml', 'phpcs.xml', '.phpcs.xml.dist', 'phpcs.xml.dist' ];

/**
 * Download, verify (sha256) and extract the dependencies listed in `phpcs-deps.json`.
 *
 * @since 1.1.0
 *
 * @param projectPath - The path to the project.
 * @param localRetraceurCS - Optional path to a local clone of retraceur/php-coding-standards (skips its download).
 * @returns The names of the coding standards to register in PHPCS `installed_paths` (in manifest order).
 */
export async function installPhpcsDependencies(
	projectPath: string,
	localRetraceurCS?: string
): Promise<string[]> {
	const manifestPath = path.join( projectPath, MANIFEST_FILE );

	if ( ! existsSync( manifestPath ) ) {
		throw new Error( `${ MANIFEST_FILE } not found in ${ projectPath }.` );
	}

	const deps = JSON.parse( readFileSync( manifestPath, 'utf8' ) ) as PhpcsDependencies;
	const dir = path.join( projectPath, DEPS_DIR );
	const stampFile = path.join( dir, '.installed.json' );
	const stamp: Record<string, string> = existsSync( stampFile )
		? JSON.parse( readFileSync( stampFile, 'utf8' ) )
		: {};

	mkdirSync( dir, { recursive: true } );

	for ( const [ name, dep ] of Object.entries( deps ) ) {
		if ( name === 'RetraceurCS' && localRetraceurCS ) {
			output?.log( `[phpcs] RetraceurCS: using ${ localRetraceurCS }` );
			continue;
		}

		const target = path.join( dir, name === 'phpcs' ? 'phpcs.phar' : name );

		if ( stamp[ name ] === dep.version && existsSync( target ) ) {
			continue;
		}

		output?.log( `[phpcs] ${ name } ${ dep.version }…` );

		const response = await fetch( dep.url );
		if ( ! response.ok ) {
			throw new Error( `${ name }: HTTP ${ response.status } on ${ dep.url }` );
		}

		const buffer = Buffer.from( await response.arrayBuffer() );
		const actual = createHash( 'sha256' ).update( buffer ).digest( 'hex' );

		if ( ! dep.sha256 ) {
			throw new Error( `${ name }: no checksum in ${ MANIFEST_FILE }. Check the archive, then add: "sha256": "${ actual }"` );
		}

		if ( actual !== dep.sha256 ) {
			throw new Error( `${ name }: invalid checksum\n  expected: ${ dep.sha256 }\n  current: ${ actual }` );
		}

		if ( name === 'phpcs' ) {
			writeFileSync( target, buffer );
		} else {
			const archive = path.join( dir, `${ name }.tar.gz` );

			rmSync( target, { recursive: true, force: true } );
			mkdirSync( target, { recursive: true } );
			writeFileSync( archive, buffer );
			execFileSync( 'tar', [ '-xzf', archive, '-C', target, '--strip-components=1' ] );
			rmSync( archive );
		}

		stamp[ name ] = dep.version;
	}

	writeFileSync( stampFile, JSON.stringify( stamp, null, 2 ) );

	return Object.keys( deps ).filter( ( name ) => name !== 'phpcs' );
}

/**
 * Run PHPCS in PHP Wasm.
 *
 * @since 1.1.0
 *
 * @param options - The options for running PHPCS.
 * @returns The exit code of PHPCS (0: no violation, 1: violations, 2: violations fixable by PHPCBF, 3: processing error).
 */
export async function runPhpcs( options: PhpcsOptions ): Promise<number> {
	const projectPath = path.resolve( options.path || process.cwd() );
	const userArgs = options.args ?? [];
	const localRetraceurCS = process.env.RETRACEUR_CS_PATH
		? path.resolve( process.env.RETRACEUR_CS_PATH )
		: undefined;

	const standards = await installPhpcsDependencies( projectPath, localRetraceurCS );

	// The cache directory used by the ruleset must exist: PHPCS does not create it.
	mkdirSync( path.join( projectPath, '.cache' ), { recursive: true } );

	const installedPaths = standards
		.map( ( name ) =>
			name === 'RetraceurCS' && localRetraceurCS
				? VFS_RETRACEUR_CS
				: `${ VFS_PROJECT }/${ DEPS_DIR }/${ name }`
		)
		.join( ',' );

	// Host paths given as arguments (files or directories) are converted to VFS paths.
	const phpcsArgs = userArgs.map( ( arg ) => {
		if ( arg.startsWith( '-' ) ) {
			return arg;
		}

		const relative = path.relative( projectPath, path.resolve( projectPath, arg ) );

		return relative.startsWith( '..' )
			? arg
			: path.posix.join( VFS_PROJECT, ...relative.split( path.sep ) );
	} );

	const hasOption = ( name: string ): boolean =>
		userArgs.some( ( arg ) => arg === name || arg.startsWith( `${ name }=` ) );

	// Defaults, unless the user already set them.
	if ( ! hasOption( '--standard' ) ) {
		const ruleset = RULESET_FILES.find( ( file ) => existsSync( path.join( projectPath, file ) ) );

		if ( ruleset ) {
			phpcsArgs.push( `--standard=${ VFS_PROJECT }/${ ruleset }` );
		}
	}

	if ( ! hasOption( '--basepath' ) ) {
		phpcsArgs.push( `--basepath=${ VFS_PROJECT }` );
	}

	// `pcntl_fork` is not available in PHP Wasm.
	if ( ! hasOption( '--parallel' ) ) {
		phpcsArgs.push( '--parallel=1' );
	}

	if ( process.stdout.isTTY && ! hasOption( '--colors' ) && ! hasOption( '--no-colors' ) ) {
		phpcsArgs.push( '--colors' );
	}

	const mounts = [ { hostPath: projectPath, vfsPath: VFS_PROJECT } ];

	if ( localRetraceurCS ) {
		mounts.push( { hostPath: localRetraceurCS, vfsPath: VFS_RETRACEUR_CS } );
	}

	// `_[0]` is the command name, the following tokens are the arguments of the PHP binary.
	return runCLI( {
		command: 'php',
		_: [
			'php',
			'-d', `error_reporting=${ ERROR_REPORTING }`,
			'-d', 'display_errors=0',
			`${ VFS_PROJECT }/${ DEPS_DIR }/phpcs.phar`,
			'--runtime-set',
			'installed_paths',
			installedPaths,
			...phpcsArgs,
		],
		php: ( options.php || DEFAULT_PHP_VERSION ) as any,
		mount: mounts,
		wordpressInstallMode: 'do-not-attempt-installing',
		skipSqliteSetup: true,
		verbosity: 'quiet',
	} );
}

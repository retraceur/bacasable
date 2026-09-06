/**
 * bacÀsable - Main entry point
 *
 * @module main
 * @since 1.0.0
 */

import { runCLI } from '@wp-playground/cli';
import { Command } from 'commander';
import path from 'path';
import { isGitHubCodespace, getCodeSpaceURL } from './github-codespaces.js';
import { downloadRetraceur } from './download.js';
import { isRetraceurDirectory } from './utils/is-retraceur-directory.js';
import { isPluginDirectory } from './utils/is-plugin-directory.js';
import { isThemeDirectory } from './utils/is-theme-directory.js';
import { isWpContentDirectory } from './utils/is-wp-content-directory.js';
import { output } from './output.js';
import { portFinder } from './port-finder.js';
import { DEFAULT_PHP_VERSION, DEFAULT_RETRACEUR_VERSION } from './constants.js';

export type Mode =
	| 'plugin'
	| 'theme'
	| 'wp-content'
	| 'retraceur'
	| 'index';

export interface BacAsableOptions {
	path: string;
	php?: string;
	port?: number;
	retraceur?: string;
	mode?: Mode;
}

export interface BacAsableServer {
	url: string;
	port: number;
}

/**
 * Detect the mode based on the project path and options.
 *
 * @since 1.0.0
 *
 * @param projectPath - The path to the project.
 * @param options - The options provided by the user.
 * @returns The detected mode.
 */
function inferMode( projectPath: string, options: BacAsableOptions ): Mode {
	// Forced mode via CLI option.
	if ( options.mode ) {
		return options.mode;
	}

	if ( isRetraceurDirectory( projectPath ) ) {
		return 'retraceur';
	}

	if ( isPluginDirectory( projectPath ) ) {
		return 'plugin';
	}

	if ( isThemeDirectory( projectPath ) ) {
		return 'theme';
	}

	if ( isWpContentDirectory( projectPath ) ) {
		return 'wp-content';
	}

	return 'index';
}

/**
 * Build the mounts for the Docker container based on the mode and paths.
 *
 * @since 1.0.0
 *
 * @param mode - The detected mode.
 * @param projectPath - The path to the project.
 * @param retraceurPath - The path to the Retraceur installation.
 * @returns An array of mount objects with hostPath and vfsPath.
 */
function buildMounts(
	mode: Mode,
	projectPath: string,
	retraceurPath: string
): Array<{ hostPath: string; vfsPath: string }> {
	const mounts = [
		// Retraceur is always mounted at the root.
		{
			hostPath: retraceurPath,
			vfsPath: '/wordpress',
		},
	];

	switch ( mode ) {
		case 'plugin':
			mounts.push( {
				hostPath: projectPath,
				vfsPath: `/wordpress/wp-content/plugins/${ path.basename( projectPath ) }`,
			} );
			break;

		case 'theme':
			mounts.push( {
				hostPath: projectPath,
				vfsPath: `/wordpress/wp-content/themes/${ path.basename( projectPath ) }`,
			} );
			break;

		case 'wp-content':
			mounts.push( {
				hostPath: projectPath,
				vfsPath: '/wordpress/wp-content',
			} );
			break;

		case 'retraceur':
		case 'index':
			// Déjà monté via retraceurPath
			break;
	}

	return mounts;
}

/**
 * Start bacÀsable
 *
 * @since 1.0.0
 *
 * @param options - The options for starting bacÀsable.
 * @returns The server information including URL and port.
 */
export async function startBacasable( options: BacAsableOptions ): Promise<BacAsableServer> {
	const projectPath = path.resolve( options.path || process.cwd() );
	const mode = inferMode( projectPath, options );
	const port = options.port || await portFinder.getOpenPort();

	output?.log( `Starting bacÀsable...` );
	output?.log( `directory: ${ projectPath }` );
	output?.log( `mode: ${ mode }` );
	output?.log( `php: ${ options.php || DEFAULT_PHP_VERSION }` );
	output?.log( `retraceur: ${ options.retraceur || DEFAULT_RETRACEUR_VERSION }` );

	// Used to determine Retraceur path (local or downloaded).
	let retraceurPath: string;

	if ( mode === 'retraceur' ) {
		// Local Retraceur installation is used directly.
		output?.log( '✅ Using local Retraceur installation' );
		retraceurPath = projectPath;
	} else {
		// Download Retraceur if not already downloaded.
		retraceurPath = await downloadRetraceur( options.retraceur || DEFAULT_RETRACEUR_VERSION );
	}

	// Build the mounts.
	const mounts = buildMounts( mode, projectPath, retraceurPath );

	// Intercept `stdout` to replace WP trademark with "Retraceur" in the output.
	const originalWrite = process.stdout.write.bind( process.stdout );
	( process.stdout.write as any ) = ( chunk: any, ...args: any[] ) => {
		// Regex pour matcher un code ANSI optionnel
		const ANSI = '(?:\\u001b\\[[0-9;]*m)*';

		if ( typeof chunk === 'string' ) {
			chunk = chunk
				.replace( /Running Blueprint \u001b\[2m100%\u001b\[0m/g, '' )
				.replace( /WordPress Playground CLI/g, 'bacÀsable CLI' )
				.replace( /WordPress is running/g, 'Retraceur is running' )
				.replace( /Ready! WordPress/g, 'Ready! Retraceur' )
				// Remplacer WP entouré de codes ANSI
				.replace( new RegExp( `${ ANSI }WordPress${ ANSI }`, 'g' ), 'Retraceur' )
				// Remplacer /wordpress dans les mounts
				.replace( /→\u001b\[0m \/wordpress\n/g, '→\u001b[0m /retraceur\n' )
				.replace( /→\u001b\[0m \/wordpress\//g, '→\u001b[0m /retraceur/' );
		}
		return originalWrite( chunk, ...args );
	};

	const retraceurConstants = {
		WP_DEBUG: true,
		WP_SCRIPT_DEBUG: true,
		WP_DEBUG_LOG: false,
		WP_DEBUG_DISPLAY: true,
	};

	if ( mode === 'retraceur' || mode === 'wp-content') {
		retraceurConstants.WP_DEBUG_LOG = true;
		retraceurConstants.WP_DEBUG_DISPLAY = false;
	}

	// Launch the CLI with the specified options.
	const server = await runCLI( {
		command: 'server',
		php: ( options.php || DEFAULT_PHP_VERSION ) as any,
		wordpressInstallMode: 'do-not-attempt-installing',
		'mount-before-install': mounts,
		port,
		blueprint: {
			constants: retraceurConstants,
			steps: [
				{
					step: 'writeFile',
					path: '/wordpress/wp-content/mu-plugins/bacasable-mail-interceptor.php',
					data: `<?php
					/**
					 * bacÀsable Mail Interceptor
					 * Intercepts all emails and writes them to wp-content/bacasable-emails.json.
					 */
					add_filter( 'wp_mail', function( array $args ): array {
						$log_file = WP_CONTENT_DIR . '/bacasable-emails.json';
						$emails   = file_exists( $log_file )
							? json_decode( file_get_contents( $log_file ), true ) ?? []
							: [];

						$emails[] = [
							'date'    => date( 'c' ),
							'to'      => $args['to'],
							'subject' => $args['subject'],
							'message' => $args['message'],
							'headers' => $args['headers'],
						];

						file_put_contents( $log_file, json_encode( $emails, JSON_PRETTY_PRINT ) );

						// Make sure the email is not sent to the actual recipient.
						return array_merge( $args, [ 'to' => '' ] );
					} );`,
				},
			],
		},
	} );

	// Restore the original `stdout.write` function to avoid affecting other parts of the application.
	process.stdout.write = originalWrite;

	// Determine the URL (Codespaces or local).
	const url = isGitHubCodespace
		? getCodeSpaceURL( port )
		: server.serverUrl;

	return { url, port };
}

/**
 * CLI
 */
const program = new Command();

program
	.name( 'bacasable' )
	.description( 'Instantly start a Retraceur development environment' )
	.version( '1.0.0-beta1' );

program
	.command( 'start' )
	.description( 'Start a Retraceur development environment' )
	.option( '--path <path>', 'Path to the project', process.cwd() )
	.option( '--php <version>', 'PHP version (8.0, 8.1, 8.2, 8.3)', '8.3' )
	.option( '--port <port>', 'Port number', '8881' )
	.option( '--retraceur <version>', 'Retraceur version', 'latest' )
	.option(
		'--mode <mode>',
		'Mode (plugin|theme|wp-content|retraceur|index)'
	)
	.action( async ( options ) => {
		await startBacasable( {
			...options,
			port: parseInt( options.port ),
		} );
	} );

program.parse();

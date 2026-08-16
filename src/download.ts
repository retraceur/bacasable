/**
 * Download and extract Retraceur for bacÀsable.
 *
 * @module download
 * @since 1.0.0
 */

import followRedirects from 'follow-redirects';
import fs from 'fs-extra';
import { IncomingMessage } from 'http';
import os from 'os';
import path from 'path';
import unzipper from 'unzipper';
import getRetraceurVersionsPath from './get-retraceur-versions-path.js';
import { getRetraceurDownloadUrl, resolveRetraceurVersion } from './retraceur-versions.js';
import { output } from './output.js';

const { https } = followRedirects;

function httpsGet( url: string, callback: ( response: IncomingMessage ) => void ) {
	const proxy =
		process.env.https_proxy ||
		process.env.HTTPS_PROXY ||
		process.env.http_proxy ||
		process.env.HTTP_PROXY;

	const options: any = {};

	if ( proxy ) {
		// Basic proxy support via the native Node.js agent (v2: hpagent).
		options.headers = { 'User-Agent': 'bacasable/1.0.0' };
	}

	https.get( url, options, callback );
}

interface DownloadFileAndUnzipResult {
	downloaded: boolean;
	statusCode: number;
}

async function downloadFileAndUnzip( {
	url,
	destinationFolder,
	checkFinalPath,
	itemName,
}: {
	url: string;
	destinationFolder: string;
	checkFinalPath: string;
	itemName: string;
} ): Promise<DownloadFileAndUnzipResult> {
	// Check whether the final folder already exists and is not empty. If so, skip the download.
	if (
		fs.existsSync( checkFinalPath ) &&
		fs.readdirSync( checkFinalPath ).length > 0
	) {
		output?.log( `${ itemName } folder already exists. Skipping download.` );
		return { downloaded: false, statusCode: 0 };
	}

	let statusCode = 0;

	try {
		fs.ensureDirSync( path.dirname( destinationFolder ) );

		output?.log( `Downloading ${ itemName }...` );

		const response = await new Promise<IncomingMessage>( ( resolve ) =>
			httpsGet( url, ( response ) => resolve( response ) )
		);

		statusCode = response.statusCode ?? 0;

		if ( response.statusCode !== 200 ) {
			throw new Error(
				`Failed to download file (Status code ${ response.statusCode }).`
			);
		}

		const entryPromises: Promise<unknown>[] = [];

		await response
			.pipe( unzipper.Parse() )
			.on( 'entry', ( entry ) => {
				const filePath = path.join( destinationFolder, entry.path );
				fs.ensureDirSync( path.dirname( filePath ) );

				if ( entry.type === 'File' ) {
					const promise = new Promise( ( resolve, reject ) => {
						entry
							.pipe( fs.createWriteStream( filePath ) )
							.on( 'close', resolve )
							.on( 'error', reject );
					} );
					entryPromises.push( promise );
				} else {
					entryPromises.push( entry.autodrain().promise() );
				}
			} )
			.promise();

		await Promise.all( entryPromises );

		return { downloaded: true, statusCode };
	} catch ( err ) {
		output?.error( `Error downloading or unzipping ${ itemName }:`, err );
	}

	return { downloaded: false, statusCode };
}

/**
 * Download and extract Retraceur for bacÀsable.
 *
 * @since 1.0.0
 *
 * @param version - The version tag to download (e.g., '1.2.3', 'trunk').
 * @returns The path to the installed Retraceur.
 */
export async function downloadRetraceur( version: string = 'latest' ): Promise<string> {
	const resolvedTag = await resolveRetraceurVersion( version );

	// Use real tag instead of alias (ex: "latest")
    const finalFolder = path.join( getRetraceurVersionsPath(), resolvedTag );
	const tempFolder = os.tmpdir();

	const { downloaded, statusCode } = await downloadFileAndUnzip( {
		url: getRetraceurDownloadUrl( resolvedTag ),
		destinationFolder: tempFolder,
		checkFinalPath: finalFolder,
		itemName: `Retraceur ${ resolvedTag }`,
	} );

	if ( downloaded ) {
		const extractedFolderName = `coeur-${ resolvedTag }`;
		const extractedPath = path.join( tempFolder, extractedFolderName );

		if ( ! fs.existsSync( extractedPath ) ) {
			output?.log( `Extracted folder not found: ${ extractedPath }` );
			output?.log( 'Contents of temp folder:', fs.readdirSync( tempFolder ) );
			process.exit( 1 );
		}

		// Create the parent folder if necessary.
		fs.ensureDirSync( path.dirname( finalFolder ) );

		// Move the extracted folder to the final destination, overwriting if it already exists.
		fs.moveSync( extractedPath, finalFolder, {
			overwrite: true,
		} );

		output?.log( `Retraceur ${ resolvedTag } downloaded to ${ finalFolder }` );
	} else if ( 404 === statusCode ) {
		output?.log(
			`Retraceur ${ resolvedTag } not found. Check https://github.com/retraceur/coeur/releases for available versions.`
		);
		process.exit( 1 );
	}

	// Return the final folder path (whether downloaded or already existing).
	return finalFolder;
}

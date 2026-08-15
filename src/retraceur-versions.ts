/**
 * Retraceur versions information and utilities.
 *
 * Versions are resolved dynamically from the GitHub releases Atom feed.
 *
 * @module retraceur-versions
 * @since 1.0.0
 */

const RETRACEUR_RELEASES_ATOM_URL = 'https://github.com/retraceur/coeur/releases.atom';
const RETRACEUR_TRUNK_URL = 'https://github.com/retraceur/coeur/archive/refs/heads/trunk.zip';
const RETRACEUR_TAG_URL = ( tag: string ) =>
	`https://github.com/retraceur/coeur/archive/refs/tags/${ tag }.zip`;

/**
 * Fetch available versions from the GitHub releases Atom feed.
 * Returns an ordered list of tags (most recent first).
 *
 * @since 1.0.0
 *
 * @returns An array of version tags (e.g., ['1.2.3', '1.2.2', '1.2.1']).
 * @throws If there is an error fetching or parsing the feed.
 */
export async function fetchAvailableVersions(): Promise<string[]> {
	try {
		const response = await fetch( RETRACEUR_RELEASES_ATOM_URL );

		if ( ! response.ok ) {
			throw new Error( `Failed to fetch releases feed: ${ response.status }` );
		}

		const xml = await response.text();

		// Extraire les tags depuis les balises <id>
		// Format : tag:github.com,2008:Repository/882273877/4.2.0
		const matches = xml.matchAll(
			/<id>tag:github\.com,2008:Repository\/\d+\/([^<]+)<\/id>/g
		);

		return Array.from( matches, ( m ) => m[ 1 ] );
	} catch ( error ) {
		throw new Error( `Could not fetch Retraceur versions: ${ error }` );
	}
}

/**
 * Resolve 'latest' to the most recent stable version from the feed.
 * Skips pre-releases (beta, RC, alpha) unless no stable version is found.
 *
 * @since 1.0.0
 *
 * @returns The resolved latest version tag.
 * @throws If no versions are found in the feed.
 */
export async function resolveLatestVersion(): Promise<string> {
	const versions = await fetchAvailableVersions();

	// Chercher la première version stable (sans suffixe beta/RC/alpha)
	const stable = versions.find(
		( v ) => ! /-(beta|rc|alpha)/i.test( v )
	);

	if ( stable ) {
		return stable;
	}

	// Si aucune version stable, prendre la première disponible
	if ( versions.length > 0 ) {
		return versions[ 0 ];
	}

	throw new Error( 'No Retraceur versions found in the releases feed.' );
}

/**
 * Validate that a given version tag exists in the GitHub releases feed.
 *
 * @since 1.0.0
 *
 * @param version - The version tag to validate (e.g., '1.2.3', 'trunk').
 * @returns True if the version exists, false otherwise.
 * @throws If there is an error fetching the versions feed.
 */
export async function validateVersion( version: string ): Promise<boolean> {
	const versions = await fetchAvailableVersions();
	return versions.includes( version );
}

/**
 * Resolve a version string to a concrete tag.
 * - 'latest' → most recent stable release (from feed).
 * - 'trunk'  → development branch.
 * - anything else → validated against the feed.
 *
 * @since 1.0.0
 * @param version - The version string to resolve ('latest', 'trunk', or a specific tag).
 * @returns The resolved version tag.
 * @throws If the specified version does not exist.
 */
export async function resolveRetraceurVersion( version: string = 'latest' ): Promise<string> {
	if ( version === 'trunk' ) {
		return 'trunk';
	}

	if ( version === 'latest' ) {
		return await resolveLatestVersion();
	}

	// Valider que la version demandée existe
	const isValid = await validateVersion( version );

	if ( ! isValid ) {
		const available = await fetchAvailableVersions();
		throw new Error(
			`Retraceur version "${ version }" not found.\n` +
			`Available versions: ${ [ 'trunk', 'latest', ...available ].join( ', ' ) }`
		);
	}

	return version;
}

/**
 * Get the download URL for a resolved version tag.
 *
 * @since 1.0.0
 *
 * @param tag - The resolved version tag (e.g., '1.2.3', 'trunk').
 * @returns The download URL for the specified version.
 */
export function getRetraceurDownloadUrl( tag: string ): string {
	if ( tag === 'trunk' ) {
		return RETRACEUR_TRUNK_URL;
	}

	return RETRACEUR_TAG_URL( tag );
}

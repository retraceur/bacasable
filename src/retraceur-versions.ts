/**
 * Retraceur versions information and utilities.
 *
 * This module defines the available versions of Retraceur, their corresponding PHP versions, and release dates.
 * It also provides utility functions to retrieve version information and construct download URLs for specific versions.
 *
 * @module retraceur-versions
 * @since 0.9.0
 */

export interface RetraceurVersion {
	tag: string;
	phpVersion: string;
	releaseDate: string;
}

export const RETRACEUR_VERSIONS: Record<string, RetraceurVersion> = {
	'trunk': {
		tag: 'trunk',
		phpVersion: '8.3',
		releaseDate: 'rolling'
	},
	'latest': {
		tag: '3.1.0',
		phpVersion: '8.3',
		releaseDate: 'rolling'
	},
	'3.1.0': {
		tag: '3.1.0',
		phpVersion: '8.2',
		releaseDate: '2026-03-14'
	},
	'3.0.0': {
		tag: '3.0.0',
		phpVersion: '8.2',
		releaseDate: 'rolling'
	},
	'2.0.1': {
		tag: '2.0.1',
		phpVersion: '8.2',
		releaseDate: '2025-10-01'
	},
	'2.0.0': {
		tag: '2.0.0',
		phpVersion: '8.2',
		releaseDate: '2025-08-15'
	}
};

export function getRetraceurVersion( requested: string ): RetraceurVersion {
	return RETRACEUR_VERSIONS[ requested ] || RETRACEUR_VERSIONS[ 'latest' ];
}

export async function resolveRetraceurVersion( retraceurVersion: string ) {
	const versionInfo = getRetraceurVersion( retraceurVersion );

	if ( 'trunk' === versionInfo.tag ) {
		return {
			resolvedRetraceurVersion: versionInfo.tag,
			isDeveloperBuild: true,
		};
	}

	return {
		resolvedRetraceurVersion: retraceurVersion,
		isDeveloperBuild: false,
	};
}

export function getRetraceurDownloadUrl( version: string ): string {
	const versionInfo = getRetraceurVersion( version );
	const tag = versionInfo.tag;

	if ( 'trunk' === tag ) {
		return 'https://github.com/retraceur/coeur/archive/refs/heads/trunk.zip';
	}

	return `https://github.com/retraceur/coeur/archive/refs/tags/${tag}.zip`;
}

export function listAvailableVersions(): string[] {
	return Object.keys( RETRACEUR_VERSIONS );
}

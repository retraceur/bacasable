/**
 * Configure the bacÀsable environment.
 *
 * @module config
 * @since 0.9.0
 */

import {
	SupportedPHPVersion,
	SupportedPHPVersionsList,
} from '@php-wasm/universal';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { Blueprint } from '@wp-playground/blueprints';
import { getCodeSpaceURL, isGitHubCodespace } from './github-codespaces';
import { inferMode } from './bacasable';
import { portFinder } from './port-finder';
import getBacAsablePath from './get-bacasable-path';
import { DEFAULT_PHP_VERSION, DEFAULT_RETRACEUR_VERSION } from './constants';
import { isWebContainer, HostURL } from '@webcontainer/env';

export interface CliOptions {
	php?: string;
	path?: string;
	retraceur?: string;
	port?: number;
	blueprint?: string;
	reset?: boolean;
}

export const enum BacAsableMode {
	PLUGIN = 'plugin',
	THEME = 'theme',
	RETRACEUR = 'retraceur',
	INDEX = 'index',
	WP_CONTENT = 'wp-content',
	PLAYGROUND = 'playground',
	AUTO = 'auto',
}

export interface BacAsableOptions {
	phpVersion?: SupportedPHPVersion;
	documentRoot?: string;
	absoluteUrl?: string;
	mode?: BacAsableMode;
	port?: number;
	projectPath?: string;
	wpContentPath?: string;
	retraceurVersion?: string;
	numberOfPhpInstances?: number;
	blueprintObject?: Blueprint;
	reset?: boolean;
	landingPage?: string;
}

export const DEFAULT_OPTIONS: BacAsableOptions = {
	phpVersion: DEFAULT_PHP_VERSION,
	retraceurVersion: DEFAULT_RETRACEUR_VERSION,
	documentRoot: '/var/www/html',
	projectPath: process.cwd(),
	mode: BacAsableMode.AUTO,
	numberOfPhpInstances: 1,
	reset: false,
	landingPage: '',
};

export interface WPEnvOptions {
	core: string | null;
	phpVersion: SupportedPHPVersion | null;
	plugins: string[];
	themes: string[];
	port: number;
	testsPort: number;
	config: Object;
	mappings: Object;
}

let absoluteUrlFromBlueprint = '';

async function getAbsoluteURL() {
	const port = await portFinder.getOpenPort();
	if (isGitHubCodespace) {
		return getCodeSpaceURL(port);
	}
	if (isWebContainer()) {
		return HostURL.parse('http://localhost:' + port).toString();
	}

	if (absoluteUrlFromBlueprint) {
		return absoluteUrlFromBlueprint;
	}

	const url = 'http://localhost';
	if (port === 80) {
		return url;
	}
	return `${url}:${port}`;
}

function getWpContentHomePath(projectPath: string, mode: string) {
	const basename = path.basename(projectPath);
	const directoryHash = crypto
		.createHash('sha1')
		.update(projectPath)
		.digest('hex');
	const projectDirectory =
		mode === BacAsableMode.PLAYGROUND
			? 'playground'
			: `${basename}-${directoryHash}`;
	return path.join(getBacAsablePath(), 'wp-content', projectDirectory);
}

export default async function getBacAsableConfig(
	args: CliOptions
): Promise<BacAsableOptions> {
	if (args.port) {
		portFinder.setPort(args.port);
	}
	const port = await portFinder.getOpenPort();
	const optionsFromCli: BacAsableOptions = {
		phpVersion: args.php as SupportedPHPVersion,
		projectPath: args.path as string,
		retraceurVersion: args.retraceur as string,
		port,
		reset: args.reset as boolean,
	};

	const options: BacAsableOptions = {} as BacAsableOptions;

	[optionsFromCli, DEFAULT_OPTIONS].forEach((config) => {
		for (const key in config) {
			if (!options[key]) {
				options[key] = config[key];
			}
		}
	});

	if (!options.mode || options.mode === 'auto') {
		options.mode = inferMode(options.projectPath);
	}
	if (!options.wpContentPath) {
		options.wpContentPath = getWpContentHomePath(
			options.projectPath,
			options.mode
		);
	}
	if (!options.absoluteUrl) {
		options.absoluteUrl = await getAbsoluteURL();
	}
	if (
		options.phpVersion &&
		!SupportedPHPVersionsList.includes(options.phpVersion)
	) {
		throw new Error(
			`Unsupported PHP version: ${
				options.phpVersion
			}. Supported versions: ${SupportedPHPVersionsList.join(', ')}`
		);
	}
	if (args.blueprint) {
		const blueprintPath = path.resolve(args.blueprint);
		if (!fs.existsSync(blueprintPath)) {
			throw new Error(`Blueprint file not found: ${blueprintPath}`);
		}
		const blueprintObject = JSON.parse(
			fs.readFileSync(blueprintPath, 'utf8')
		);

		options.blueprintObject = blueprintObject;
		const siteUrl = extractSiteUrlFromBlueprint(blueprintObject);
		if (siteUrl) {
			options.absoluteUrl = siteUrl;
			absoluteUrlFromBlueprint = siteUrl;
		}
		if (blueprintObject.landingPage) {
			options.landingPage =
				(await getAbsoluteURL()) + blueprintObject.landingPage;
		}
	}
	return options;
}

function extractSiteUrlFromBlueprint(
	blueprintObject: Blueprint
): string | false {
	for (const step of blueprintObject.steps) {
		if (typeof step !== 'object') {
			return false;
		}

		if (step.step === 'defineSiteUrl') {
			return `${step.siteUrl}`;
		} else if (
			step.step === 'defineWpConfigConsts' &&
			step.consts.WP_SITEURL
		) {
			return `${step.consts.WP_SITEURL}`;
		}
	}
	return false;
}

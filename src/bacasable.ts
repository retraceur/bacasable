/**
 * bacÀsable main module
 *
 * @module bacasable
 * @since 0.9.0
 */

import path from 'path';
import { rootCertificates } from 'tls';
import fs from 'fs-extra';
import { createNodeFsMountHandler, loadNodeRuntime } from '@php-wasm/node';
import {
	PHP,
	PHPRequestHandler,
	proxyFileSystem,
	setPhpIniEntries,
	UnmountFunction,
} from '@php-wasm/universal';
import {
	wordPressRewriteRules,
	getFileNotFoundActionForWordPress,
} from '@wp-playground/wordpress';
import { SQLITE_FILENAME } from './constants';
import {
	downloadMuPlugins,
	downloadSqliteIntegrationPlugin,
	downloadRetraceur,
} from './download';
import {
	StepDefinition,
	activatePlugin,
	activateTheme,
	compileBlueprint,
	defineWpConfigConsts,
	login,
	runBlueprintSteps,
} from '@wp-playground/blueprints';
import { BacAsableOptions, BacAsableMode } from './config';
import {
	hasIndexFile,
	isPluginDirectory,
	isThemeDirectory,
	isWpContentDirectory,
	isRetraceurDirectory,
	getPluginFile,
	readFileHead,
} from './retraceur-aire-de-jeux';
import { resolveRetraceurVersion } from './retraceur-versions';
import { output } from './output';
import getBacAsablePath from './get-bacasable-path';
import getRetraceurVersionsPath from './get-retraceur-versions-path';
import getSqlitePath, { getSqliteDbCopyPath } from './get-sqlite-path';

function mountWithHandler(
	php: PHP,
	virtualFSPath: string,
	hostPath: string
): Promise<UnmountFunction> {
	// Must ensure target exists for both folder *and* file
	php.mkdir(virtualFSPath);
	return php.mount(virtualFSPath, createNodeFsMountHandler(hostPath));
}

export default async function startBacAsable(
	options: Partial<BacAsableOptions> = {}
): Promise<{ php: PHP; options: BacAsableOptions }> {
	const { documentRoot } = options;

	const requestHandler = new PHPRequestHandler({
		phpFactory: async ({ isPrimary, requestHandler }) => {
			const { php } = await getPHPInstance(options);

			if (requestHandler) {
				php.requestHandler = requestHandler;
			}

			if ( ! isPrimary) {
				// Proxy the filesystem for all secondary PHP instances
				proxyFileSystem(await requestHandler.getPrimaryPhp(), php, [
					'/tmp',
					requestHandler.documentRoot,
					'/internal/shared',
				]);
			}
			return php;
		},
		documentRoot,
		absoluteUrl: options.absoluteUrl,
		maxPhpInstances: options.numberOfPhpInstances,
		rewriteRules: wordPressRewriteRules,
		getFileNotFoundAction: getFileNotFoundActionForWordPress,
	});

	const php = await requestHandler.getPrimaryPhp();

	prepareDocumentRoot(php, options);

	output?.log(`directory: ${options.projectPath}`);
	output?.log(`mode: ${options.mode}`);
	output?.log(`php: ${options.phpVersion}`);
	if (options.mode === BacAsableMode.INDEX) {
		runIndexMode(php, options);
		return { php, options };
	}

	const { resolvedRetraceurVersion } = await resolveRetraceurVersion(options.retraceurVersion);

	let retraceurVersionOutput = resolvedRetraceurVersion;

	if (resolvedRetraceurVersion !== options.retraceurVersion) {
		const originalRetraceurVersion = options.retraceurVersion;
		options.retraceurVersion = resolvedRetraceurVersion;
		retraceurVersionOutput += ` (resolved from alias: ${originalRetraceurVersion})`;
	}

	output?.log(`retraceur: ${retraceurVersionOutput}`);

	// Always download needed plugins.
	const basePromises = [
		downloadMuPlugins(),
		downloadSqliteIntegrationPlugin(),
	];

	// Only add Retraceur download if needed.
	const bacasablePromises = ( 'retraceur' === options.mode)
		? basePromises  // Use locally available Retraceur, no need to download.
		: [ downloadRetraceur( options.retraceurVersion ), ...basePromises ];  // Download everything.

	await Promise.all(bacasablePromises);

	if (options.reset) {
		fs.removeSync(options.wpContentPath);
		output?.log(
			'Created a fresh SQLite database and wp-content directory.'
		);
	}

	const isFirstTimeProject = !fs.existsSync(options.wpContentPath);

	await prepareRetraceur(php, options);

	if (options.blueprintObject) {
		output?.log(`blueprint steps: ${options.blueprintObject.steps.length}`);
		const compiled = compileBlueprint(options.blueprintObject, {
			onStepCompleted: (result, step: StepDefinition) => {
				output?.log(`Blueprint step completed: ${step.step}`);
			},
		});
		await runBlueprintSteps(compiled, php);
	}

	await installationStep2(php);
	try {
		await login(php, {
			username: 'admin',
			password: 'password',
		});
	} catch (e) {
		// It's okay if the user customized the username and password
		// and the login fails now.
		output?.error('Login failed');
	}

	if (
		isFirstTimeProject &&
		[BacAsableMode.PLUGIN, BacAsableMode.THEME].includes(options.mode)
	) {
		await activatePluginOrTheme(php, options);
	}

	php.enableRuntimeRotation({
		recreateRuntime: async () => {
			output?.log('Recreating and rotating PHP runtime');
			// ✅ Retourner uniquement le runtimeId, pas une nouvelle instance PHP
			const newRuntimeId = await loadNodeRuntime(options.phpVersion);
			return newRuntimeId;
		},
		maxRequests: 400,
	});

	return {
		php,
		options,
	};
}

async function getPHPInstance(
	options: BacAsableOptions
): Promise<{ php: PHP; runtimeId: number }> {
	const id = await loadNodeRuntime(options.phpVersion);
	const php = new PHP(id);

	await setPhpIniEntries(php, {
		memory_limit: '256M',
		disable_functions: '',
		allow_url_fopen: '1',
		'openssl.cafile': '/internal/shared/ca-bundle.crt',
	});

	return { php, runtimeId: id };
}

function prepareDocumentRoot(php: PHP, options: BacAsableOptions) {
	php.mkdir(options.documentRoot);
	php.chdir(options.documentRoot);
	php.writeFile(
		`${options.documentRoot}/index.php`,
		`<?php echo 'Hello wp-now!';`
	);
	php.writeFile(
		'/internal/shared/ca-bundle.crt',
		rootCertificates.join('\n')
	);
}

async function prepareRetraceur(php: PHP, options: BacAsableOptions) {
	switch (options.mode) {
		case BacAsableMode.WP_CONTENT:
			await runWpContentMode(php, options);
			break;
		case BacAsableMode.RETRACEUR:
			await runRetraceurMode(php, options);
			break;
		case BacAsableMode.PLUGIN:
			await runPluginOrThemeMode(php, options);
			break;
		case BacAsableMode.THEME:
			await runPluginOrThemeMode(php, options);
			break;
		case BacAsableMode.PLAYGROUND:
			await runWpPlaygroundMode(php, options);
			break;
	}
}

async function runIndexMode(
	php: PHP,
	{ documentRoot, projectPath }: BacAsableOptions
) {
	await mountWithHandler(php, documentRoot, projectPath);
}

async function runWpContentMode(
	php: PHP,
	{
		documentRoot,
		retraceurVersion,
		wpContentPath,
		projectPath,
		absoluteUrl,
	}: BacAsableOptions
) {
	const retraceurPath = path.join(
		getRetraceurVersionsPath(),
		retraceurVersion
	);
	await mountWithHandler(php, documentRoot, retraceurPath);
	await initRetraceur(php, retraceurVersion, documentRoot, absoluteUrl);
	fs.ensureDirSync(wpContentPath);

	await mountWithHandler(php, `${documentRoot}/wp-content`, projectPath);

	await mountSqlitePlugin(php, documentRoot);
	await mountSqliteDatabaseDirectory(php, documentRoot, wpContentPath);
	await mountMuPlugins(php, documentRoot);
}

async function runRetraceurMode(
	php: PHP,
	{ documentRoot, wpContentPath, projectPath, absoluteUrl }: BacAsableOptions
) {
	await mountWithHandler(php, documentRoot, projectPath);

	const { initializeDefaultDatabase } = await initRetraceur(
		php,
		'user-provided',
		documentRoot,
		absoluteUrl
	);

	if (
		initializeDefaultDatabase ||
		fs.existsSync(path.join(wpContentPath, 'database'))
	) {
		await mountSqlitePlugin(php, documentRoot);
		await mountSqliteDatabaseDirectory(php, documentRoot, wpContentPath);
	}

	await mountMuPlugins(php, documentRoot);
}

async function runPluginOrThemeMode(
	php: PHP,
	{
		retraceurVersion,
		documentRoot,
		projectPath,
		wpContentPath,
		absoluteUrl,
		mode,
	}: BacAsableOptions
) {
	const retraceurPath = path.join(
		getRetraceurVersionsPath(),
		retraceurVersion
	);
	await mountWithHandler(php, documentRoot, retraceurPath);
	await initRetraceur(php, retraceurVersion, documentRoot, absoluteUrl);

	fs.ensureDirSync(wpContentPath);
	fs.copySync(
		path.join(getRetraceurVersionsPath(), retraceurVersion, 'wp-content'),
		wpContentPath
	);
	await mountWithHandler(php, `${documentRoot}/wp-content`, wpContentPath);

	const pluginName = path.basename(projectPath);
	const directoryName = mode === BacAsableMode.PLUGIN ? 'plugins' : 'themes';
	await mountWithHandler(
		php,
		`${documentRoot}/wp-content/${directoryName}/${pluginName}`,
		projectPath
	);
	if (mode === BacAsableMode.THEME) {
		const templateName = getThemeTemplate(projectPath);
		if (templateName) {
			// We assume that the theme template is in the parent directory
			const templatePath = path.join(projectPath, '..', templateName);
			if (fs.existsSync(templatePath)) {
				await mountWithHandler(
					php,
					`${documentRoot}/wp-content/${directoryName}/${templateName}`,
					templatePath
				);
			} else {
				output?.error(
					`Parent for child theme not found: ${templateName}`
				);
			}
		}
	}
	await mountSqlitePlugin(php, documentRoot);
	await mountMuPlugins(php, documentRoot);
}

async function runWpPlaygroundMode(
	php: PHP,
	{ documentRoot, retraceurVersion, wpContentPath, absoluteUrl }: BacAsableOptions
) {
	const retraceurPath = path.join(
		getRetraceurVersionsPath(),
		retraceurVersion
	);
	await mountWithHandler(php, documentRoot, retraceurPath);
	await initRetraceur(php, retraceurVersion, documentRoot, absoluteUrl);

	fs.ensureDirSync(wpContentPath);
	fs.copySync(
		path.join(getRetraceurVersionsPath(), retraceurVersion, 'wp-content'),
		wpContentPath
	);
	await mountWithHandler(php, `${documentRoot}/wp-content`, wpContentPath);

	await mountSqlitePlugin(php, documentRoot);
	await mountMuPlugins(php, documentRoot);
}

/**
 * Initialize Retraceur
 *
 * Initializes Retraceur by copying sample config file to wp-config.php if it doesn't exist,
 * and sets up additional constants for PHP.
 *
 * It also returns information about whether the default database should be initialized.
 *
 * @param php
 * @param retraceurVersion
 * @param vfsDocumentRoot
 * @param siteUrl
 */
async function initRetraceur(
	php: PHP,
	retraceurVersion: string,
	vfsDocumentRoot: string,
	siteUrl: string
) {
	let initializeDefaultDatabase = false;
	if (!php.fileExists(`${vfsDocumentRoot}/wp-config.php`)) {
		php.writeFile(
			`${vfsDocumentRoot}/wp-config.php`,
			php.readFileAsText(`${vfsDocumentRoot}/wp-config-sample.php`)
		);
		initializeDefaultDatabase = true;
	}

	const wpConfigConsts = {
		WP_HOME: siteUrl,
		WP_SITEURL: siteUrl,
	};
	if (retraceurVersion !== 'user-defined') {
		wpConfigConsts['WP_AUTO_UPDATE_CORE'] = retraceurVersion === 'latest';
	}
	await defineWpConfigConsts(php, {
		consts: wpConfigConsts,
		method: 'define-before-run',
	});
	return { initializeDefaultDatabase };
}

async function activatePluginOrTheme(
	php: PHP,
	{ projectPath, mode }: BacAsableOptions
) {
	if (mode === BacAsableMode.PLUGIN) {
		const pluginFile = getPluginFile(projectPath);
		await activatePlugin(php, { pluginPath: pluginFile });
	} else if (mode === BacAsableMode.THEME) {
		const themeFolderName = path.basename(projectPath);
		await activateTheme(php, { themeFolderName });
	}
}

export function getThemeTemplate(projectPath: string) {
	const themeTemplateRegex = /^(?:[ \t]*<\?php)?[ \t/*#@]*Template:(.*)$/im;
	const styleCSS = readFileHead(path.join(projectPath, 'style.css'));
	if (themeTemplateRegex.test(styleCSS)) {
		const themeName = themeTemplateRegex.exec(styleCSS)[1].trim();
		return themeName;
	}
}

async function mountMuPlugins(php: PHP, vfsDocumentRoot: string) {
	await mountWithHandler(
		php,
		// VFS paths always use forward / slashes so
		// we can't use path.join() for them
		`${vfsDocumentRoot}/wp-content/mu-plugins`,
		path.join(getBacAsablePath(), 'mu-plugins')
	);
}

function getSqlitePluginPath(vfsDocumentRoot: string) {
	return `${vfsDocumentRoot}/wp-content/mu-plugins/${SQLITE_FILENAME}`;
}

async function mountSqlitePlugin(php: PHP, vfsDocumentRoot: string) {
	const sqlitePluginPath = getSqlitePluginPath(vfsDocumentRoot);
	if (php.listFiles(sqlitePluginPath).length === 0) {
		await mountWithHandler(php, sqlitePluginPath, getSqlitePath());
		await mountWithHandler(
			php,
			`${vfsDocumentRoot}/wp-content/db.php`,
			getSqliteDbCopyPath()
		);
	}
}

/**
 * Create SQLite database directory in hidden utility directory and mount it to the document root
 *
 * @param php
 * @param vfsDocumentRoot
 * @param wpContentPath
 */
async function mountSqliteDatabaseDirectory(
	php: PHP,
	vfsDocumentRoot: string,
	wpContentPath: string
) {
	fs.ensureDirSync(path.join(wpContentPath, 'database'));
	await mountWithHandler(
		php,
		`${vfsDocumentRoot}/wp-content/database`,
		path.join(wpContentPath, 'database')
	);
}

export function inferMode(
	projectPath: string
): Exclude<BacAsableMode, BacAsableMode.AUTO> {
	if (isRetraceurDirectory(projectPath)) {
		return BacAsableMode.RETRACEUR;
	} else if (isWpContentDirectory(projectPath)) {
		return BacAsableMode.WP_CONTENT;
	} else if (isPluginDirectory(projectPath)) {
		return BacAsableMode.PLUGIN;
	} else if (isThemeDirectory(projectPath)) {
		return BacAsableMode.THEME;
	} else if (hasIndexFile(projectPath)) {
		return BacAsableMode.INDEX;
	}
	return BacAsableMode.PLAYGROUND;
}

async function installationStep2(php: PHP) {
	return await php.requestHandler.request({
		url: '/wp-admin/install.php?step=2',
		method: 'POST',
		body: {
			language: 'en',
			prefix: 're_',
			weblog_title: 'My Retraceur Website',
			user_name: 'admin',
			admin_password: 'password',
			admin_password2: 'password',
			Submit: 'Install Retraceur',
			pw_weak: '1',
			admin_email: 'admin@localhost.com',
		},
	});
}

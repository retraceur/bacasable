# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-beta.1] - 2026-09-06

### Added

- Migrate from the `wp-now` fork to `@wp-playground/cli` as the core engine, bringing 6 PHP workers, native SQLite management, and better performance.
- Resolve Retraceur versions dynamically from the [GitHub releases Atom feed](https://github.com/retraceur/coeur/releases.atom), removing the static version mapping.
- Validate requested Retraceur versions against the feed before attempting any download, providing a clear error message with available versions on invalid input.
- Support any release tag from the Atom feed out of the box, including pre-releases (`4.0.0-beta1`, `4.0.0-RC1`, etc.).
- Detect `latest` as the most recent stable release, skipping pre-releases automatically.
- Intercept all outgoing emails during development and save them to `wp-content/bacasable-emails.json` via an injected mu-plugin.
- Enable WordPress debug constants by default via `blueprint.constants`:
  - `WP_DEBUG: true` and `WP_SCRIPT_DEBUG: true` for all modes.
  - `WP_DEBUG_LOG: true` and `WP_DEBUG_DISPLAY: false` for `retraceur` and `wp-content` modes (errors written to `wp-content/debug.log`).
  - `WP_DEBUG_DISPLAY: true` for `plugin` and `theme` modes.
- Support GitHub Codespaces via `github-codespaces.ts`.
- Add `β Testing` mode: start from an empty directory to test any Retraceur pre-release without any project context.

### Changed

- Rename `src/retraceur-aire-de-jeux/` to `src/utils/` for clarity.
- Use the resolved version tag (e.g. `4.2.0`) instead of the alias (e.g. `latest`) as the cache directory name, preventing stale cache issues.
- Skip Retraceur download when the detected mode is `retraceur` (local installation), using the local path directly.
- Replace the stdout messages from `@wp-playground/cli` to use Retraceur branding (`bacÀsable CLI`, `Retraceur is running`, `/retraceur` mount paths).
- Update default PHP version from `8.0` to `8.3`.
- Update Node.js requirement from `>= 18.0.0` to `>= 22.0.0`.

### Removed

- Drop all manual PHP-WASM server management code (forked from `wp-now`):
  - `src/bacasable.ts` (manual PHP instance management)
  - `src/start-server.ts` (Express server)
  - `src/execute-php.ts` (PHP execution)
  - `src/execute-wp-cli.ts` (WP-CLI support)
  - `src/config.ts`
  - `src/get-sqlite-path.ts`
  - `src/get-wp-cli-path.ts`
  - `src/get-wp-cli-tmp-path.ts`
  - `src/add-trailing-slash.ts`
  - `src/run-cli.ts`
- Remove `downloadSqliteIntegrationPlugin()` and `downloadMuPlugins()` — both are now managed internally by `@wp-playground/cli`.
- Remove `downloadWPCLI()` — WP-CLI is no longer supported.
- Remove `hpagent` dependency (proxy support deferred to v2.0.0).
- Remove `@php-wasm/node`, `@php-wasm/universal`, `@wp-playground/blueprints`, `@webcontainer/env`, `compression`, `compressible`, `express`, `chokidar` dependencies.
- Remove `src/assets/` directory.

## [0.9.0] - 2026-02-14

### Added

- Initial release of bacÀsable as a fork of [wp-now](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now).
- Download Retraceur from GitHub (`retraceur/coeur`) instead of wordpress.org.
- Static version mapping for Retraceur versions (`2.0.0`, `2.0.1`, `3.x`, etc.).
- Automatic mode detection: `plugin`, `theme`, `wp-content`, `retraceur`.
- Skip Retraceur download when running from a local Retraceur installation.
- SQLite integration via the `sqlite-database-integration` plugin.
- PHP WebAssembly via `@php-wasm/node` and `@php-wasm/universal`.
- Support for PHP 8.0, 8.1, 8.2, 8.3.
- GitHub Codespaces support.
- Port finder to avoid conflicts with other local servers.
- Retraceur branding (renamed CLI, renamed functions, renamed directories).

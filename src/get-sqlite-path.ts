/**
 * Returns the full path to the SQLite database integration folder.
 *
 * @module get-sqlite-path
 * @since 0.9.0
 */

import path from 'path';
import getBacAsablePath from './get-bacasable-path';
import { SQLITE_FILENAME } from './constants';

/**
 * The full path to the "SQLite database integration" folder.
 */
export default function getSqlitePath() {
	return path.join(getBacAsablePath(), 'mu-plugins', `${SQLITE_FILENAME}`);
}

/**
 * The full path to the "SQLite database integration" db.copy file.
 */
export function getSqliteDbCopyPath() {
	return path.join(getSqlitePath(), 'db.copy');
}

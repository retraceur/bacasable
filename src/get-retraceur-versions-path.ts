/**
 * Retraceur versions path information.
 *
 * @module get-retraceur-versions-path
 * @since 0.9.0
 */

import path from 'path';
import getWpNowPath from './get-wp-now-path';

/**
 * The path where Retraceur zip files will be unzipped and stored within the bacÀsable folder.
 *
 * @since 0.9.0
 * @returns {string} The path to the Retraceur versions directory.
 */
export default function getRetraceurVersionsPath() {
	return path.join( getWpNowPath(), 'retraceur-versions' );
}

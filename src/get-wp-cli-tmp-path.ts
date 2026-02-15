/**
 * Returns the full path to the hidden WP-CLI folder in the user's tmp directory.
 *
 * @module get-wp-cli-tmp-path
 * @since 0.9.0
 */

import path from 'path';
import os from 'os';

/**
 * The full path to the hidden WP-CLI folder in the user's tmp directory.
 */
export default function getWpCliTmpPath() {
	const tmpDirectory = os.tmpdir();

	return path.join(tmpDirectory, `wp-now-tests-wp-cli-hidden-folder`);
}

/**
 * Returns the full path to the hidden bacÀsable folder in the user's tmp directory.
 *
 * @module get-bacasable-tmp-path
 * @since 0.9.0
 */

import path from 'path';
import os from 'os';

/**
 * The full path to the hidden bacÀsable folder in the user's tmp directory.
 *
 * @since 0.9.0
 *
 * @returns The full path to the hidden bacÀsable folder in the tmp directory.
 */
export default function getBacAsableTmpPath() {
	const tmpDirectory = os.tmpdir();

	return path.join(tmpDirectory, `wp-now-tests-hidden-folder`);
}

/**
 * Returns the full path to the hidden bacÀsable folder in the user's home directory.
 *
 * @module get-bacasable-path
 * @since 0.9.0
 */

import path from 'path';
import os from 'os';
import { BAC_A_SABLE_HIDDEN_FOLDER } from './constants';
import getBacAsableTmpPath from './get-bacasable-tmp-path';

/**
 * The full path to the hidden WP Now folder in the user's home directory.
 */
export default function getBacAsablePath() {
	if (process.env.NODE_ENV !== 'test') {
		return path.join(os.homedir(), BAC_A_SABLE_HIDDEN_FOLDER);
	}

	return getBacAsableTmpPath();
}

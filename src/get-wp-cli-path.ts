/**
 * Returns the path to the wp-cli.phar file within the bacÀsable folder.
 *
 * @module get-wp-cli-path
 * @since 0.9.0
 */

import path from 'path';
import getBacAsablePath from './get-bacasable-path';
import getWpCliTmpPath from './get-wp-cli-tmp-path';

/**
 * The path for wp-cli phar file within the WP Now folder.
 */
export default function getWpCliPath() {
	if (process.env.NODE_ENV !== 'test') {
		return path.join(getBacAsablePath(), 'wp-cli.phar');
	}
	return path.join(getWpCliTmpPath(), 'wp-cli.phar');
}

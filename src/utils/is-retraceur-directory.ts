import fs from 'fs-extra';
import path from 'path';

/**
 * Checks if the given path is a Retraceur directory.
 *
 * @param projectPath The path to the project to check.
 * @returns Is it a Retraceur directory?
 */
export function isRetraceurDirectory(projectPath: string): Boolean {
	return (
		fs.existsSync(path.join(projectPath, 'wp-content')) &&
		fs.existsSync(path.join(projectPath, 'wp-includes')) &&
		fs.existsSync(path.join(projectPath, 'wp-load.php'))
	);
}

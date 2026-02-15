/**
 * Main entry point for bacÀsable.
 *
 * @module index
 * @since 0.9.0
 */

import getBacAsableConfig from './config';
export { getBacAsableConfig };

export { default as getBacAsablePath } from './get-bacasable-path';
export { startServer } from './start-server';
export type { BacAsableServer } from './start-server';

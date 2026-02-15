/**
 * PortFinder is a singleton class that finds and caches an open port for the bacÀsable server to use.
 *
 * It starts searching from a default port and increments until it finds a free one. Once an open port is
 * found, it caches it for future use, ensuring that subsequent calls to getOpenPort() return the same port
 * without needing to search again.
 *
 * @module port-finder
 * @since 0.9.0
 */

import http from 'http';
import { DEFAULT_PORT } from './constants';

class PortFinder {
	static #instance: PortFinder;
	#searchPort = DEFAULT_PORT;
	#openPort: number | null = null;

	private constructor() {}

	public static getInstance(): PortFinder {
		if (!PortFinder.#instance) {
			PortFinder.#instance = new PortFinder();
		}
		return PortFinder.#instance;
	}

	#incrementPort(): number {
		return this.#searchPort++;
	}

	#isPortFree(): Promise<boolean> {
		return new Promise((resolve) => {
			const server = http.createServer();

			server
				.listen(this.#searchPort, () => {
					server.close();
					resolve(true);
				})
				.on('error', () => {
					resolve(false);
				});
		});
	}

	/**
	 * Returns the first available open port, caching and reusing it for subsequent calls.
	 *
	 * @returns {Promise<number>} A promise that resolves to the open port number.
	 */
	public async getOpenPort(): Promise<number> {
		if (this.#openPort) {
			return this.#openPort;
		}
		while (!(await this.#isPortFree())) {
			this.#incrementPort();
		}

		this.#openPort = this.#searchPort;
		return this.#openPort;
	}

	public setPort(port: number): void {
		this.#openPort = port;
	}
}

export const portFinder = PortFinder.getInstance();

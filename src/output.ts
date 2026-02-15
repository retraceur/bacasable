/**
 * Output module.
 *
 * @module output
 * @since 0.9.0
 */

function shouldOutput() {
	return process.env.NODE_ENV !== 'test';
}

export let output = shouldOutput() ? console : null;

export function enableOutput() {
	output = console;
}

export function disableOutput() {
	output = null;
}

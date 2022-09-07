import process from 'node:process';
import type {WriteStream} from 'node:tty';
import {createSupportsColor} from 'supports-color';
import hasFlag from 'has-flag';

function parseVersion(versionString: string) {
	if (/^\d{3,4}$/.test(versionString)) {
	// Env var doesn't always use dots. example: 4601 => 46.1.0
		const m = /(\d{1,2})(\d{2})/.exec(versionString);
		return {
			major: 0,
			minor: Number(m?.[1]),
			patch: Number(m?.[2]),
		};
	}

	const versions = versionString.split('.').map(n => Number.parseInt(n, 10));
	return {
		major: Number(versions[0]),
		minor: Number(versions[1]),
		patch: Number(versions[2]),
	};
}

// eslint-disable-next-line complexity
export default function supportsHyperlinks(stream?: WriteStream) {
	const {env} = process;

	if (env['FORCE_HYPERLINK']) {
		return !(env['FORCE_HYPERLINK'].length > 0 && Number.parseInt(env['FORCE_HYPERLINK'], 10) === 0);
	}

	if (hasFlag('no-hyperlink') || hasFlag('no-hyperlinks') || hasFlag('hyperlink=false') || hasFlag('hyperlink=never')) {
		return false;
	}

	if (hasFlag('hyperlink=true') || hasFlag('hyperlink=always')) {
		return true;
	}

	// Netlify does not run a TTY, it does not need `supportsColor` check
	if (env['NETLIFY']) {
		return true;
	}

	// If they specify no colors, they probably don't want hyperlinks.
	// @ts-expect-error: `stream` should be optional https://github.com/chalk/supports-color/pull/138
	if (!createSupportsColor(stream)) {
		return false;
	}

	if (stream && !stream.isTTY) {
		return false;
	}

	if (process.platform === 'win32') {
		return false;
	}

	if (env['CI']) {
		return false;
	}

	if (env['TEAMCITY_VERSION']) {
		return false;
	}

	if (env['TERM_PROGRAM'] && env['TERM_PROGRAM_VERSION']) {
		const version = parseVersion(env['TERM_PROGRAM_VERSION']);

		switch (env['TERM_PROGRAM']) {
			case 'iTerm.app':
				if (version.major === 3) {
					return version.minor >= 1;
				}

				return version.major > 3;
			case 'WezTerm':
				return version.major >= 20_200_620;
			case 'vscode':
				return version.major > 1 || (version.major === 1 && version.minor >= 72);
			default:
				break;
		}
	}

	if (env['VTE_VERSION']) {
		// 0.50.0 was supposed to support hyperlinks, but throws a segfault
		if (env['VTE_VERSION'] === '0.50.0') {
			return false;
		}

		const version = parseVersion(env['VTE_VERSION']);
		return version.major > 0 || version.minor >= 50;
	}

	return false;
}

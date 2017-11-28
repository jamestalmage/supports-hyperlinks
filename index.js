'use strict';
const supportsColor = require('supports-color');
const hasFlag = require('has-flag');

function supportsHyperlink(stream) {
	const env = process.env;

	if ('FORCE_HYPERLINK' in env) {
		return !(env.FORCE_HYPERLINK.length > 0 && parseInt(env.FORCE_HYPERLINK, 10) === 0);
	}

	if (hasFlag('no-hyperlink') || hasFlag('no-hyperlinks') || hasFlag('hyperlink=false') || hasFlag('hyperlink=never')) {
		return false;
	}

	if (hasFlag('hyperlink=true') || hasFlag('hyperlink=always')) {
		return true;
	}

	// If they specify no colors, they probably don't want hyperlinks.
	if (!supportsColor.supportsColor(stream)) {
		return false;
	}

	if (stream && !stream.isTTY) {
		return false;
	}

	if (process.platform === 'win32') {
		return false;
	}

	if ('CI' in env) {
		return false;
	}

	if ('TEAMCITY_VERSION' in env) {
		return false;
	}

	if ('TERM_PROGRAM' in env) {
		const [majorVersion, minorVersion] = (env.TERM_PROGRAM_VERSION || '').split('.').map(n => parseInt(n, 10));

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				if (majorVersion === 3) {
					return minorVersion >= 1;
				}
				return majorVersion > 3;
			// No default
		}
	}

	if ('VTE_VERSION' in env) {
		// 0.50.0 was supposed to support hyperlinks, but throws a segfault
		if (env.VTE_VERSION === '0.50.0') {
			return false;
		}
		const [majorVersion, minorVersion] = env.VTE_VERSION.split('.').map(n => parseInt(n, 10));
		return majorVersion > 0 || minorVersion >= 50;
	}

	return false;
}

module.exports = {
	supportsHyperlink,
	stdout: supportsHyperlink(process.stdout),
	stderr: supportsHyperlink(process.stderr)
};

/* global extend */
/* exported KeyFunctionPair, prepareConfig, getCSS */

/**
 *
 * @param {string} key
 * @param {Function} method
 * @constructor
 */
function KeyFunctionPair(key, method) {
	/**
	 *
	 * @returns {string}
	 */
	this.getKey = function () {
		return key;
	};

	/**
	 *
	 * @returns {Function}
	 */
	this.getMethod = function () {
		return method;
	};

	/**
	 *
	 * @param {KeyFunctionPair} other
	 * @returns {boolean}
	 */
	this.equals = function (other) {
		if (!other) {
			return false;
		}
		return key === other.getKey() && method === other.getMethod();
	};
}

function getCSS(config) {
	if (!config['feature.active']) {
		return '';
	}
	const sfx01 = ['div#boxBG #box {',
		'\tmargin: 0 10px;',
		'}\n\n'].join('\n');
	const sfx02 = [
		'div#box div#rechts div#myWorlds {\n',
		'\twidth: 147px;\n',
		'}\n',

		'div#box div#rechts div#planetList a.constructionIcon {',
		'\tleft: 0;',
		'\tright: auto;',
		'\ttop: 38px;',
		'\twhite-space: nowrap;',
		'\twidth: auto;',
		'}\n',

		'div#box div#rechts div#planetList a.constructionIcon span.icon_wrench {',
		'\tpadding-left: 15px;',
		'\tfont-size: 11px;',
		'}\n',

		'div#box div#rechts div#planetList .smallplanet a.moonlink {',
		'\tleft: auto;',
		'\tpadding: 5px;',
		'\tright: 0;',
		'\ttop: 0;',
		'}\n',

		'div#box div#rechts div#planetList .smallplanet {\n',
		'\theight: 52px;\n',
		'\tmargin: 0 0 1px;\n',
		'\twidth: auto;\n',
		'}\n',

		'div#box div#rechts a.planetlink  .planetPic {',
		'\tposition: absolute;',
		'\tleft: 7px;',
		'\ttop: 6px;',
		'}\n',

		'div#box div#rechts div#planetList .planet-name, div#rechts div#planetList .planet-koords {',
		'\twhite-space: nowrap;',
		'\tposition: absolute;',
		'\ttop: 7px;',
		'\tleft: 43px;',
		'}\n',

		'div#box div#rechts div#planetList .planet-koords {',
		'\ttop: 22px;',
		'}\n',

		'div#box div#rechts div#planetList a.planetlink {',
		'\theight: 52px;',
		'}\n',

		'div#box div#rechts .smallplanet a.alert {',
		'\ttop: 0;',
		'\tleft: 0;',
		'}\n',

		'div#box div#rechts a.planetlink .planetPic {',
		'\twidth: 30px;',
		'\theight: 30px;',
		'}\n\n'
	].join('\n');
	const sfx03 = [
		'#galaxy #galaxytable tbody tr.row td {',
		'\theight: ' + (config['galaxy.row.height'] || '28') + 'px;',
		'}\n',

		'#galaxy #galaxytable tbody tr.row td.planetname1 > span, #galaxy #galaxytable tbody tr.row td.planetname1 > a {',
		'\tmargin-top: 5px;',
		'}\n',

		'#galaxy #galaxytable tbody tr.row td.action > span {',
		'\tmargin-top: 3px;',
		'}\n\n'
	].join('\n');
	var result = [
		'.skynet .c_timer, .skynet_c_timer {',
		'\tcolor: ' + (config['color.timer'] || '#00bb00') + ' !important;',
		'}\n',
		'.skynet .c_hint, .skynet_c_hint {',
		'\tcolor: ' + (config['color.hint'] || '#a0a0ff') + ' !important;',
		'}\n',
		'.skynet .c_problem, .skynet_c_problem {',
		'\tcolor: ' + (config['color.problem'] || '#ff0000') + ' !important;',
		'}\n'
	].join('\n');
	if (config['change.layout']) {
		result += sfx01;
	}
	if (config['change.layout.planetlist']) {
		result += sfx02;
	}
	if (config['change.layout.galaxy.rows']) {
		result += sfx03;
	}
	return result;
}


/**
 *
 * @param {{}} config
 * @param {string} host
 * @returns {{}}
 */
function prepareConfig(config, host) {
	const _c = {};
	Object.keys(config).forEach(function (key) {
		if (key === host) {
			const elem = config[key];
			Object.keys(elem).forEach(function (key) {
				_c[key] = extend(_c[key], elem[key]);
			});
			return;
		}
		if (key.match(/ogame\.gameforge\.com$/)) {
			return;
		}
		_c[key] = extend(_c[key], config[key]);
	});
	return _c;
}

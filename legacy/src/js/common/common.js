/* exported _i, extend, Q, genUUID, hexToRgb */

function _i(txt) {
	return parseInt(txt, 10);
}

/**
 *
 * @param {*} target
 * @param {...*} source
 * @returns {*|{}}
 */
function extend(target, source) {
	target = target || {};
	if (source !== undefined && source !== null) {
		if ((typeof source).match(/^(?:string|number|boolean)$/)) {
			target = source;
		} else if (Array.isArray(source)) {
			target = [];
			source.forEach(function (elem) {
				target.push(extend('', elem));
			});
		} else if (typeof source !== 'function' && typeof source === 'object') {
			Object.keys(source).forEach(function (key) {
				target[key] = extend(target[key], source[key]);
			});
		}
	}
	for (var i = 2; i < arguments.length; i++) {
		target = extend(target, arguments[i]);
	}
	return target;
}

function genUUID() {
	return b2() + b2() + "-" + b2() + "-" + b2() + "-" + b2() + "-" + b2() + b2() + b2();

	function b2() {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	}
}

function hexToRgb(hex) {
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		return r + r + g + g + b + b;
	});

	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

/**
 *
 * @param {*} [object]
 * @param {string} selector
 * @returns {*}
 * @constructor
 */
const Q = function (object, selector) {
	if (typeof object === 'string') {
		//noinspection JSValidateTypes
		selector = object;
		//noinspection JSValidateTypes
		object = document;
	}
	var result = object.querySelectorAll(selector);
	return !result.length ? null : result.length === 1 ? result[0] : result;
};

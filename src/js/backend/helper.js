/* global extend */
/* exported KeyFunctionPair, prepareConfig */

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

/**
 *
 * @param {{}} config
 * @param {string} host
 * @returns {{}}
 */
function prepareConfig(config, host) {
	var _c = {};
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

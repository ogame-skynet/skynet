/* exported Version */

/**
 * Created by Martin Burchard on 17.04.2013.
 */

/**
 *
 * @param {String} v
 * @constructor
 */
function Version(v) {
	var _v = v || '0';
	var version = '';
	var stage = '';
	try {
		var vl = _v.toLowerCase();
		if (vl.match(/^(.+?)-(.+?)$/)) {
			version = RegExp.$1;
			stage = RegExp.$2;
		} else if (vl.match(/^((?:\d|\.)+?)([a-z].*?)$/)) {
			version = RegExp.$1;
			stage = RegExp.$2;
		} else if (vl.match(/^((?:\d|\.)+?)$/)) {
			version = RegExp.$1;
		}
		version = version.split('.', 4);
		for (var i = 0; i < version.length; i++) {
			version[i] = parseInt(version[i], 10);
		}
	} catch (e) {
		console.error('Version', e);
	}

	this.getStage = function () {
		return stage;
	};

	this.getVersion = function () {
		return version;
	};

	/**
	 * Returns less then 0 if this version is less then other version, 0 if they are equal and more
	 * then 0 otherwise
	 *
	 * @param {Version} other
	 * @return Number
	 */
	this.compareTo = function (other) {
		for (var i = 0; i < version.length && i < other.getVersion().length; i++) {
			if (version[i] !== other.getVersion()[i]) {
				return version[i] - other.getVersion()[i];
			}
		}
		if (version.length !== other.getVersion().length) {
			return version.length - other.getVersion().length;
		}
		if (stage !== other.getStage()) {
			if (!stage) {
				return 1;
			}
			if (!other.getStage()) {
				return -1;
			}
			if (stage < other.getStage()) {
				return -1;
			}
			return 1;
		}
		return 0;
	};

	this.toString = function () {
		return version.join('.') + (stage ? '-' + stage : '');
	};
}

/**
 * Returns true if v1 is greater then v2
 *
 * @param {String} v1
 * @param {String} v2
 * @return {Boolean}
 */
Version.isGreater = function (v1, v2) {
	var vV1 = new Version(v1);
	var vV2 = new Version(v2);
	return vV1.compareTo(vV2) > 0;
};
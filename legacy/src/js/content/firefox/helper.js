/* global self, Promise, MESSAGES, genUUID */
/* exported getI18n, getResource, MessageBus */

function MessageBus() {
	/**
	 *
	 * @param {string} key
	 * @param {*} msg
	 * @returns {Promise}
	 */
	this.get = function (key, msg) {
		return new Promise(function (resolve) {
			const msgID = genUUID();
			const func = function (msg) {
				if (msg.msgID && msg.msgID === msgID) {
					self.port.removeListener(key, func);
					resolve(msg.data);
				}
			};
			self.port.on(key, func);
			self.port.emit(key, {msgID : msgID, data : msg});
		});
	};

	/**
	 *
	 * @param {string} key
	 * @param {Function} method
	 */
	this.on = function (key, method) {
		self.port.on(key, method);
	};

	/**
	 *
	 * @param {string} key
	 * @param {Function} [method]
	 * @returns {Promise}
	 */
	this.once = function (key, method) {
		if (method) {
			self.port.once(key, method);
			return null;
		}
		return new Promise(function (resolve) {
			self.port.once(key, function (msg) {
				resolve(msg);
			});
		});
	};

	/**
	 *
	 * @param {string} key
	 * @param {*} msg
	 * @returns {Promise}
	 */
	this.post = function (key, msg) {
		return new Promise(function (resolve) {
			const msgID = genUUID();
			const func = function (msg) {
				if (msg.msgID && msg.msgID === msgID) {
					self.port.removeListener(key, func);
					resolve(msg.data);
				}
			};
			self.port.on(key, func);
			self.port.emit(key, {msgID : msgID, data : msg});
		});
	};

	/**
	 *
	 * @param {string} key
	 * @param {Function} method
	 */
	this.remove = function (key, method) {
		self.port.removeListener(key, method);
	};

	/**
	 *
	 * @param {string} key
	 * @param {*} msg
	 */
	this.send = function (key, msg) {
		self.port.emit(key, msg);
	};
}

function getI18n() {
	return {
		getMessage : function (key, args) {
			const i18n = self.options.i18n;
			var v;
			var i;
			if (!key) {
				return '';
			}
			if (i18n[key]) {
				v = i18n[key];
				if (!args) {
					return v;
				}
				if (Array.isArray(args)) {
					for (i = 0; i < args.length; i++) {
						v = v.replace(new RegExp('\\$' + (i + 1), 'g'), args[i]);
					}
					return v;
				}
				if (typeof args === 'object') {
					Object.keys(args).forEach(function (elem) {
						v = v.replace(new RegExp('\\[%' + elem + '%\\]', 'g'), args[elem]);
					});
					return v;
				}
				for (i = 1; i < arguments.length; i++) {
					v = v.replace(new RegExp('\\$' + i, 'g'), arguments[i]);
				}
				return v;
			}
			return '';
		}
	};
}

/**
 *
 * @param {string} key
 * @param {string} type
 * @param {boolean} [localize]
 * @returns {*}
 */
function getResource(key, type, localize) {
	return new Promise(function (resolve) {
		self.port.once(MESSAGES.getResource, function (msg) {
			resolve(msg);
		});
		self.port.emit(MESSAGES.getResource, {key : key, type : type, localize : localize});
	});
}
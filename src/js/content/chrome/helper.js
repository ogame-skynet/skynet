/* global chrome, $, Promise, EventHandler, genUUID */
/* exported getI18n, getResource, MessageBus */

function MessageBus() {
	const eh = new EventHandler();
	const port = chrome.runtime.connect({name : chrome.runtime.id});
	port.onMessage.addListener(function (msg) {
		eh.emit(msg.key, msg.msg);
	});

	/**
	 *
	 * @param {string} key
	 * @param {*} msg
	 * @returns {Promise}
	 */
	this.get = function (key, msg) {
		return new Promise(function (resolve) {
			const msgID = genUUID();
			const wrapper = function (msg) {
				if (msg.msgID && msg.msgID === msgID) {
					eh.removeListener(key, wrapper);
					resolve(msg.data);
				}
			};
			eh.on(key, wrapper);
			port.postMessage({key : key, msg : {msgID : msgID, data : msg}});
		});
	};

	/**
	 *
	 * @param {string} key
	 * @param {Function} method
	 */
	this.on = function (key, method) {
		eh.on(key, method);
	};

	/**
	 *
	 * @param {string} key
	 * @param {Function} [method]
	 * @returns {Promise}
	 */
	this.once = function (key, method) {
		return new Promise(function (resolve) {
			eh.once(key, method).then(function (msg) {
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
			const wrapper = function (msg) {
				if (msg.msgID && msg.msgID === msgID) {
					eh.removeListener(key, wrapper);
					resolve(msg.data);
				}
			};
			eh.on(key, wrapper);
			port.postMessage({key : key, msg : {msgID : msgID, data : msg}});
		});
	};

	/**
	 *
	 * @param {string} key
	 * @param {Function} method
	 */
	this.remove = function (key, method) {
		eh.removeListener(key, method);
	};

	/**
	 *
	 * @param {string} key
	 * @param {*} msg
	 */
	this.send = function (key, msg) {
		port.postMessage({key : key, msg : msg});
	};
}

function getI18n() {
	return chrome.i18n;
}

/**
 *
 * @param {string} key
 * @param {string} type
 * @param {boolean} [localize]
 * @returns {*}
 */
function getResource(key, type, localize) {
	return new Promise(function (resolve, reject) {
		const extPath = chrome.runtime.getURL('');
		var url = extPath + key + '.' + type;
		if (localize) {
			url = extPath + key + '_' + chrome.i18n.getUILanguage() + '.' + type;
		}
		$.ajax({url : url}).then(function (data) {
			resolve(data);
		}, function () {
			if (!localize) {
				reject();
				return;
			}
			//noinspection JSUnresolvedVariable
			url = extPath + key + '_en' + '.' + type;
			$.ajax({url : url}).then(function (data) {
				resolve(data);
			}, function () {
				reject();
			});
		});
	});
}
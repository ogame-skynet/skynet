/* global Promise, require, extend */
/* exported Config, Port, getIndexedDBSupport, getAsync */

const chrome = require('chrome');
const indexedDBSupport = require('sdk/indexed-db');
const Request = require('sdk/request').Request;

function getAsync(url) {
	return new Promise(function (resolve, reject) {
		Request({
			url : url,
			'onComplete' : function (resp) {
				try {
					if (resp.status === 200) {
						const parser = chrome.Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(chrome.Ci.nsIDOMParser);
						const dom = parser.parseFromString(resp.text, "text/xml");
						resolve(dom);
					} else {
						console.error('Can\'t get', url, 'Status:', resp.status);
						reject();
					}
				} catch (e) {
					console.error(e);
				}
			}
		}).get();
	});
}

/**
 *
 * @returns {{}}
 */
function getIndexedDBSupport() {
	return indexedDBSupport;
}

const Config = (function () {
	var ss = require('sdk/simple-storage');
	var cache;

	return {
		get : function () {
			return new Promise(function (resolve) {
				if (cache) {
					resolve(cache);
					return;
				}
				cache = extend(cache, ss.storage);
				resolve(cache);
			});
		},

		/**
		 *
		 * @param {string|{}} data
		 */
		set : function (data) {
			return new Promise(function (resolve) {
				if (data === 'reset') {
					Object.keys(cache).forEach(function (key) {
						delete ss.storage[key];
					});
					cache = null;
				} else {
					cache = extend(cache, data);
					extend(ss.storage, cache);
				}
				resolve();
			});
		}
	};
})();

function Port(port, workerTab) {
	const me = this;
	Object.defineProperty(this, 'tab', {
		value : new Tab(workerTab),
		enumerable : true
	});
	Object.defineProperty(this, 'uni', {
		value : me.tab.url.match(/^https?:\/\/(.+?ogame\.gameforge\.com)\/game\/index\.php/) ?
			RegExp.$1 :
			'',
		enumerable : true
	});

	/**
	 *
	 * @param {string} key
	 * @param {Function} method
	 */
	this.on = function (key, method) {
		if (port) {
			port.on(key, function (msg) {
				method.call(me, msg);
			});
		}
	};

	/**
	 *
	 * @param {string} key
	 * @param {*} msg
	 * @returns {Promise}
	 */
	this.post = function (key, msg) {
		return new Promise(function (resolve) {
			if (port) {
				port.once(key, function (msg) {
					resolve.call(me, msg);
				});
				port.emit(key, msg);
			}
		});
	};

	/**
	 *
	 * @param {string} key
	 * @param {Function} method
	 */
	this.remove = function (key, method) {
		if (port) {
			port.removeListener(key, method);
		}
	};

	/**
	 *
	 * @param {string} key
	 * @param {*} msg
	 */
	this.send = function (key, msg) {
		if (port) {
			port.emit(key, msg);
		}
	};

	this.toJSON = function () {
		return {tab : this.tab.toJSON()};
	};

	this.toString = function () {
		return JSON.stringify(this.toJSON);
	};
}

function Tab(tab) {
	Object.defineProperty(this, 'id', {
		value : tab.id,
		enumerable : true
	});
	Object.defineProperty(this, 'url', {
		value : tab.url,
		enumerable : true
	});

	this.toJSON = function () {
		return {id : this.id, url : this.url};
	};

	this.toString = function () {
		return JSON.stringify(this.toJSON);
	};
}
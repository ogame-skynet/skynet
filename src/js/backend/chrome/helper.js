/* global chrome, Promise, extend, KeyFunctionPair, indexedDB, IDBKeyRange */
/* exported Config, Port, getIndexedDBSupport, getAsync */

function getAsync(url) {
	return new Promise(function (resolve, reject) {
		const req = new XMLHttpRequest();
		req.addEventListener('error', function () {
			console.error('Can\'t get', url, 'Status:', req.status);
			reject();
		});
		req.addEventListener('load', function () {
			resolve(req.responseXML);
		});
		req.open('get', url);
		req.send();
	});
}

/**
 *
 * @returns {{}}
 */
function getIndexedDBSupport() {
	return {
		indexedDB : indexedDB,
		IDBKeyRange : IDBKeyRange
	};
}

const Config = (function () {
	var cache;

	return {
		get : function () {
			return new Promise(function (resolve) {
				if (cache) {
					resolve(cache);
					return;
				}
				chrome.storage.sync.get(null, function (items) {
					cache = extend(cache, items);
					resolve(cache);
				});
			});
		},

		/**
		 *
		 * @param {string|{}} data
		 */
		set : function (data) {
			return new Promise(function (resolve) {
				if (data === 'reset') {
					chrome.storage.sync.remove(Object.keys(cache), function () {
						cache = null;
						resolve();
					});
				} else {
					cache = extend(cache, data);
					chrome.storage.sync.set(cache, function () {
						resolve();
					});
				}
			});
		}
	};
})();

function Port(port, portTab) {
	const me = this;
	const listeners = {};
	Object.defineProperty(this, 'tab', {
		value : new Tab(portTab),
		enumerable : true
	});
	Object.defineProperty(this, 'uni', {
		value : me.tab.url.match(/^https?:\/\/(.+?ogame\.gameforge\.com)\/game\/index\.php/) ?
			RegExp.$1 :
			'',
		enumerable : true
	});
	port.onMessage.addListener(function (msg) {
		const l = listeners[msg.key];
		if (l) {
			l.forEach(function (kfp) {
				kfp.getMethod().call(me, msg.msg);
			});
		}
	});

	/**
	 *
	 * @param {string} key
	 * @param {Function} method
	 */
	this.on = function (key, method) {
		listeners[key] = listeners[key] || [];
		listeners[key].push(new KeyFunctionPair(key, method));
	};

	/**
	 *
	 * @param {string} key
	 * @param {*} msg
	 * @returns {Promise}
	 */
	this.post = function (key, msg) {
		return new Promise(function (resolve) {
			const cb = function (msg) {
				me.remove(key, cb);
				resolve.call(me, msg);
			};
			me.on(key, cb);
			port.postMessage({key : key, msg : msg});
		});
	};

	/**
	 *
	 * @param {string} key
	 * @param {Function} method
	 */
	this.remove = function (key, method) {
		const l = listeners[key];
		const pair = new KeyFunctionPair(key, method);
		if (l) {
			l.forEach(function (kfp, i, /*[]*/ arr) {
				if (pair.equals(kfp)) {
					arr.splice(i, 1);
				}
			});
		}
	};

	/**
	 *
	 * @param {string} key
	 * @param {*} msg
	 */
	this.send = function (key, msg) {
		port.postMessage({key : key, msg : msg});
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
/* global Promise, getIndexedDBSupport */
/* exported Storage, DBCache */

//noinspection JSUnusedGlobalSymbols
var Storage = (function () {
	const IDB = getIndexedDBSupport();
	const DBVERSION = 3;
	const STORES = {
		planets : 'planets',
		players : 'players'
	};
	const DATABASES = {};

	/**
	 *
	 * @param {String} uni
	 * @returns {Promise}
	 */
	function getDB(uni) {
		return new Promise(function (resolve, reject) {
			if (!uni) {
				console.error('Can\'t access database with empty uni!');
				reject();
				return;
			}
			var db = DATABASES[uni];
			if (db) {
				resolve(db);
				return;
			}
			//noinspection JSUnresolvedFunction
			var request = IDB.indexedDB.open(uni, DBVERSION);
			request.onerror = function (e) {
				console.error('DB open failed:', e.value);
				reject();
			};
			request.onupgradeneeded = function () {
				const db = this.result;
				const trans = this.transaction;
				var store;
				if (!db.objectStoreNames.contains(STORES.planets)) {
					store = db.createObjectStore(STORES.planets, {
						keyPath : 'id'
					});
					store.createIndex('owner', 'owner', {unique : false});
					store.createIndex('position', 'position', {unique : false});
				} else {
					store = trans.objectStore(STORES.planets);
					store.deleteIndex('position');
					store.createIndex('position', 'position', {unique : false});
				}
				if (!db.objectStoreNames.contains(STORES.players)) {
					store = db.createObjectStore(STORES.players, {
						keyPath : 'id'
					});
					store.createIndex('name', 'name', {unique : true});
				} else {
					store = trans.objectStore(STORES.players);
					store.createIndex('name', 'name', {unique : true});
				}
			};
			request.onsuccess = function () {
				var db = this.result;
				DATABASES[uni] = db;
				resolve(db);
			};
		});
	}

	/**
	 *
	 * @param {{}} query
	 * @returns {string}
	 */
	function getIndexName(query) {
		var iName = '';
		Object.keys(query).every(function (key) {
			if (key === 'uni') {
				return true;
			}
			iName = key;
			return false;
		});
		return iName;
	}

	/**
	 *
	 * @param {string|number|[]|{lower:[],upper:[]}} keys
	 * @returns {IDBKeyRange}
	 */
	function getKeyRange(keys) {
		if (keys.lower && keys.upper) {
			return IDB.IDBKeyRange.bound(keys.lower, keys.upper);
		}
		return IDB.IDBKeyRange.only(keys);
	}

	/**
	 *
	 * @param {string} stString
	 * @param {string} uni
	 * @param {*} obj
	 */
	function delObject(stString, uni, obj) {
		getDB(uni).then(function (db) {
			db.transaction([stString], 'readwrite').objectStore(stString).delete(typeof obj === 'string' ?
				obj : obj.id).onsuccess = function () {
			};
		});
	}

	/**
	 *
	 * @param {string} stString
	 * @param {*} query
	 * @returns {Promise}
	 */
	function getObjects(stString, query) {
		return new Promise(function (resolve, reject) {
			getDB(query.uni).then(function (db) {
				const trans = db.transaction([stString]);
				const store = trans.objectStore(stString);
				var request;
				if (query.id) {
					request = store.get(query.id);
					request.onerror = function (e) {
						globalError({method : 'getObjects', args : [stString, query]}, e);
						reject(this);
					};
					request.onsuccess = function () {
						var obj = this.result;
						if (obj) {
							resolve(obj);
						} else {
							resolve();
						}
					};
				} else {
					const iName = getIndexName(query);
					if (store.indexNames.contains(iName)) {
						const result = [];
						const index = store.index(iName);
						request = index.openCursor(getKeyRange(query[iName]));
						request.onerror = function (e) {
							globalError({method : 'getObjects', args : [stString, query]}, e);
							reject(this);
						};
						request.onsuccess = function () {
							var cursor = this.result;
							if (cursor) {
								result.push(cursor.value);
								cursor.continue();
							} else {
								resolve(result);
							}
						};
					} else {
						console.error('Index of name "' + iName + '" doesn\'t exist.');
						resolve([]);
					}
				}
			});
		});
	}

	function globalError(msg, e) {
		console.error('error during database operation');
		console.error(msg, e);
	}

	/**
	 *
	 * @param {string} stString
	 * @param {string} uni
	 * @param {*} obj
	 * @returns {Promise}
	 */
	function updateObj(stString, uni, obj) {
		return new Promise(function (resolve) {
			getDB(uni).then(function (db) {
				const trans = db.transaction([stString], 'readwrite');
				const store = trans.objectStore(stString);
				const request = store.put(obj);
				request.onsuccess = function () {
					resolve();
				};
				request.onerror = function (e) {
					if (this.error.name === 'ConstraintError') {
						if (stString === STORES.players) {
							getObjects(stString, {uni : uni, name : obj.name}).then(function (existing) {
								if (existing.length) {
									var player = existing[0];
									player.name = player.name + '_' + Math.round(Math.random() * 100000);
									updateObj(stString, uni, player).then(function () {
										updateObj(stString, uni, obj);
									});
								} else {
									globalError({method : 'updateObj', args : [stString, uni, obj]}, e);
								}
							});
						}
					} else {
						globalError({method : 'updateObj', args : [stString, uni, obj]}, e);
					}
				};
			});
		});
	}

	const Planets = (function () {

		/**
		 *
		 * @param {string} uni
		 * @param {{}|[]} planet
		 */
		function del(uni, planet) {
			if (Array.isArray(planet)) {
				planet.forEach(function (p) {
					delObject(STORES.planets, uni, p);
				});
			} else {
				delObject(STORES.planets, uni, planet);
			}
		}

		/**
		 *
		 * @param {{}} query
		 * @returns {Promise}
		 */
		function get(query) {
			return getObjects(STORES.planets, query);
		}

		/**
		 *
		 * @param {string} uni
		 * @param {{}|[]} planet
		 */
		function update(uni, planet) {
			if (Array.isArray(planet)) {
				planet.forEach(function (p) {
					updateObj(STORES.planets, uni, p);
				});
			} else {
				updateObj(STORES.planets, uni, planet);
			}
		}

		return {
			del : del,
			get : get,
			update : update
		};
	})();

	const Players = (function () {

		/**
		 *
		 * @param {{}} query
		 * @returns {Promise}
		 */
		function get(query) {
			return getObjects(STORES.players, query);
		}

		/**
		 *
		 * @param {string} uni
		 * @param {{}} player
		 */
		function update(uni, player) {
			updateObj(STORES.players, uni, player);
		}

		return {
			get : get,
			update : update
		};
	})();

	return {
		Planets : Planets,
		Players : Players
	};

})();
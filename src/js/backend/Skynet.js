/* global Config, MESSAGES, KeyFunctionPair, prepareConfig, Storage, getAsync, Q, extend, Promise,
 _i */
/* exported Skynet */

const cData = {};

const Skynet = (function () {
	const listeners = [];
	const STATS = {};
	const I18N = {};
	const UNI = {};

	return {
		attach: attach,
		getI18n: getI18n,
		getStats: getStats,
		getUniData: getUniData,
		on: on
	};

	function attach(port) {
		listeners.forEach(function (kfp) {
			if (kfp.getKey() === 'attach') {
				kfp.getMethod().call(port);
			} else {
				port.on(kfp.getKey(), kfp.getMethod());
			}
		});
	}

	function getI18n(uni) {
		return new Promise(function (resolve) {
			if (!uni) {
				resolve({});
				return;
			}
			if (I18N[uni]) {
				resolve(I18N[uni]);
				return;
			}
			//noinspection JSUnresolvedFunction
			getAsync('http://' + uni + '/api/localization.xml').then(function (xml) {
				const i18n = {
					t: {},
					tbn: {},
					m: {}
				};
				const names = Q(xml, 'techs name');
				var i, id, text;
				for (i = 0; i < names.length; i++) {
					id = names[i].getAttribute('id');
					text = names[i].textContent;
					i18n.t[id] = text;
					i18n.tbn[text] = id;
				}
				const missions = Q(xml, 'missions name');
				for (i = 0; i < missions.length; i++) {
					id = missions[i].getAttribute('id');
					text = missions[i].textContent;
					i18n.m[id] = text;
				}
				I18N[uni] = extend(I18N[uni], i18n);
				resolve(i18n);
			}).catch(function () {
				resolve({});
			});
		});
	}

	function getStats(uni) {
		return new Promise(function (resolve) {
			if (!uni) {
				resolve({});
				return;
			}
			const stats = STATS[uni] || {};
			const now = (new Date()).getTime() - 1000 * 60 * 60;
			if (!stats.ts || stats.ts < now) {
				//noinspection JSUnresolvedFunction
				getAsync('http://' + uni + '/api/highscore.xml?category=1&type=0').then(function (xml) {
					try {
						const root = Q(xml, 'highscore');
						stats.ts = _i(root.getAttribute('timestamp')) * 1000;
						stats.maxScore = _i(Q(root, 'player[position="1"]').getAttribute('score'));
						STATS[uni] = extend(STATS[uni], stats);
						resolve(stats);
					} catch (e) {
						console.error(e);
					}
				}).catch(function () {
					resolve({ts: (new Date()).getTime(), maxScore: 0});
				});
				return;
			}
			resolve(stats);
		});
	}

	function getUniData(uni) {
		return new Promise(function (resolve) {
			if (!uni) {
				resolve({});
				return;
			}
			if (UNI[uni]) {
				resolve(UNI[uni]);
				return;
			}
			//noinspection JSUnresolvedFunction
			getAsync('http://' + uni + '/api/serverData.xml').then(function (xml) {
				const uni = {};
				try {
					uni.donutGalaxy = _i(Q(xml, 'donutGalaxy').textContent);
					uni.donutSystem = _i(Q(xml, 'donutSystem').textContent);
					uni.galaxies = _i(Q(xml, 'galaxies').textContent);
					uni.speed = _i(Q(xml, 'speed').textContent);
					uni.speedFleet = _i(Q(xml, 'speedFleet').textContent);
					uni.systems = _i(Q(xml, 'systems').textContent);
					uni.rapidFire = _i(Q(xml, 'rapidFire').textContent);
					uni.defToTF = _i(Q(xml, 'defToTF').textContent);
					uni.debrisFactor = parseFloat(Q(xml, 'debrisFactor').textContent);
				} catch (e) {
				}
				UNI[uni] = extend(UNI[uni], uni);
				resolve(UNI[uni]);
			});
		});
	}

	/**
	 *
	 * @param {string} key
	 * @param {Function} method
	 */
	function on(key, method) {
		listeners.push(new KeyFunctionPair(key, method));
	}
})();

Skynet.on(MESSAGES.pageLoaded, function (msg) {
	cData[this.tab.id] = msg;
});

Skynet.on('attach', function () {
	const port = this;
	Config.get().then(function (config) {
		port.send(MESSAGES.getConfig, prepareConfig(config, port.uni));
	});
	const _d = cData[port.tab.id];
	if (!_d || !_d.currentPlayer) {
		port.send(MESSAGES.getPlayer);
		port.send(MESSAGES.getPlanets);
		return;
	}
	if (port.uni) {
		Storage.Players.get({uni: port.uni, id: _d.currentPlayer.id}).then(function (player) {
			port.send(MESSAGES.getPlayer, player);
		});
		Storage.Planets.get({uni: port.uni, owner: _d.currentPlayer.id}).then(function (planets) {
			port.send(MESSAGES.getPlanets, planets);
		});
	}
});

Skynet.on(MESSAGES.setConfig, function (msg) {
	const port = this;
	const config = msg.msgID ? msg.data : msg;
	Config.set(config).then(function () {
		port.send(MESSAGES.setConfig, {msgID: msg.msgID || ''});
	});
});

Skynet.on(MESSAGES.getPlayer, function (msg) {
	const port = this;
	const query = msg.data;
	query.uni = port.uni;
	Storage.Players.get(query).then(function (player) {
		port.send(MESSAGES.getPlayer, {msgID: msg.msgID, data: player});
	});
});

Skynet.on(MESSAGES.updatePlayer, function (player) {
	Storage.Players.update(this.uni, player);
});

Skynet.on(MESSAGES.getPlanets, function (msg) {
	const port = this;
	const query = msg.data;
	query.uni = port.uni;
	Storage.Planets.get(query).then(function (planets) {
		port.send(MESSAGES.getPlanets, {msgID: msg.msgID, data: planets});
	});
});

Skynet.on(MESSAGES.updatePlanets, function (planets) {
	Storage.Planets.update(this.uni, planets);
});

Skynet.on(MESSAGES.deletePlanets, function (planets) {
	Storage.Planets.del(this.uni, planets);
});

Skynet.on(MESSAGES.expoPoints, function (msg) {
	const port = this;
	Skynet.getStats(port.uni).then(function (stats) {
		var points = 25000;
		if (stats.maxScore < 100000) {
			points = 2500;
		} else if (stats.maxScore < 1000000) {
			points = 6000;
		} else if (stats.maxScore < 5000000) {
			points = 9000;
		} else if (stats.maxScore < 25000000) {
			points = 12000;
		} else if (stats.maxScore < 50000000) {
			points = 15000;
		} else if (stats.maxScore < 75000000) {
			points = 18000;
		} else if (stats.maxScore < 100000000) {
			points = 21000;
		}
		port.send(MESSAGES.expoPoints, {msgID: msg.msgID, data: points});
	});
});

Skynet.on(MESSAGES.oGameI18N, function (msg) {
	const port = this;
	Skynet.getI18n(port.uni).then(function (i18n) {
		port.send(MESSAGES.oGameI18N, {msgID: msg.msgID, data: i18n});
	});
});

Skynet.on(MESSAGES.uniData, function (msg) {
	const port = this;
	Skynet.getUniData(port.uni).then(function (uniData) {
		port.send(MESSAGES.uniData, {msgID: msg.msgID, data: uniData});
	});
});
/* global extend, _i */
/* exported OFFICERS, RESOURCES, SHIPS_BY_ID, TECHS, TECHS_BY_ID, ocalc, parseCoords, parseDT,
 parseNumber */

const OFFICERS = ['commander', 'admiral', 'engineer', 'geologist', 'technocrat'];

const RESOURCES = ['metal', 'crystal', 'deuterium', 'energy'];

const TECHS = [
	{id : 1, c : {metal : 40, crystal : 10}, p : {metal : 30, energy : -10}, f : 1.5},
	{id : 2, c : {metal : 30, crystal : 15}, p : {crystal : 20, energy : -10}, f : 1.6},
	{id : 3, c : {metal : 150, crystal : 50}, p : {deuterium : 'formula', energy : -20}, f : 1.5},
	{id : 4, c : {metal : 50, crystal : 20}, p : {energy : 20}, f : 1.5},
	{
		id : 12, c : {metal : 500, crystal : 200, deuterium : 100},
		p : {deuterium : -10, energy : 'formula'}, f : 1.8
	},
	{id : 14, c : {metal : 200, crystal : 60, deuterium : 100}, f : 2},
	{id : 15, c : {metal : 500000, crystal : 250000, deuterium : 50000}, f : 2},
	{id : 21, c : {metal : 200, crystal : 100, deuterium : 50}, f : 2},
	{id : 22, c : {metal : 500}, f : 2},
	{id : 23, c : {metal : 500, crystal : 250}, f : 2},
	{id : 24, c : {metal : 500, crystal : 500}, f : 2},
	{id : 31, c : {metal : 100, crystal : 200, deuterium : 100}, f : 2},
	{id : 33, c : {crystal : 25000, deuterium : 50000}, f : 2},
	{id : 34, c : {metal : 10000, crystal : 20000}, f : 2},
	{id : 44, c : {metal : 10000, crystal : 20000, deuterium : 500}, f : 2},
	{id : 212, c : {crystal : 2000, deuterium : 500}, p : {energy : 'formula'}},
	{id : 106, c : {metal : 100, crystal : 500, deuterium : 100}, f : 2},
	{id : 108, c : {crystal : 200, deuterium : 300}, f : 2},
	{id : 109, c : {metal : 400, crystal : 100}, f : 2},
	{id : 110, c : {metal : 100, crystal : 300}, f : 2},
	{id : 111, c : {metal : 500}, f : 2},
	{id : 113, c : {crystal : 400, deuterium : 200}, f : 2},
	{id : 114, c : {crystal : 2000, deuterium : 1000}, f : 2},
	{id : 115, c : {metal : 200, deuterium : 300}, f : 2},
	{id : 117, c : {metal : 1000, crystal : 2000, deuterium : 300}, f : 2},
	{id : 118, c : {metal : 5000, crystal : 10000, deuterium : 3000}, f : 2},
	{id : 120, c : {metal : 100, crystal : 50}, f : 2},
	{id : 121, c : {metal : 500, crystal : 150, deuterium : 50}, f : 2},
	{id : 122, c : {metal : 1000, crystal : 2000, deuterium : 500}, f : 2},
	{id : 123, c : {metal : 120000, crystal : 200000, deuterium : 80000}, f : 2},
	{id : 124, c : {metal : 4000, crystal : 8000, deuterium : 4000}, f : 1.75},
	{id : 199, c : {energy : 300000}, f : 3},
	{
		id : 202, c : {metal : 2000, crystal : 2000}, cap : 5000, expo : 20, eng : [{s : 5000, u : 10},
		{s : 10000, u : 20, l : 5}]
	},
	{id : 203, c : {metal : 6000, crystal : 6000}, cap : 25000, expo : 60, eng : [{s : 7500, u : 50}]},
	{id : 204, c : {metal : 3000, crystal : 1000}, cap : 50, expo : 20},
	{id : 205, c : {metal : 6000, crystal : 4000}, cap : 100, expo : 50},
	{
		id : 206, c : {metal : 20000, crystal : 7000, deuterium : 2000}, cap : 800, expo : 135, eng : [0,
		{s : 15000, u : 300}]
	},
	{
		id : 207, c : {metal : 45000, crystal : 15000}, cap : 1500, expo : 300, eng : [0, 0,
		{s : 10000, u : 500}]
	},
	{id : 208, c : {metal : 10000, crystal : 20000, deuterium : 10000}, cap : 7500, expo : 150},
	{id : 209, c : {metal : 10000, crystal : 6000, deuterium : 2000}, cap : 20000, expo : 80},
	{id : 210, c : {crystal : 1000}, cap : 0, expo : 5},
	{id : 211, c : {metal : 50000, crystal : 25000, deuterium : 15000}, cap : 500, expo : 375},
	{id : 213, c : {metal : 60000, crystal : 50000, deuterium : 15000}, cap : 2000, expo : 550},
	{
		id : 214, c : {metal : 5000000, crystal : 4000000, deuterium : 1000000}, cap : 1000000,
		expo : 45000
	},
	{id : 215, c : {metal : 30000, crystal : 40000, deuterium : 15000}, cap : 750, expo : 350},
	{id : 401, c : {metal : 2000}},
	{id : 402, c : {metal : 1500, crystal : 500}},
	{id : 403, c : {metal : 6000, crystal : 2000}},
	{id : 404, c : {metal : 20000, crystal : 15000, deuterium : 2000}},
	{id : 405, c : {metal : 2000, crystal : 6000}},
	{id : 406, c : {metal : 50000, crystal : 50000, deuterium : 30000}},
	{id : 407, c : {metal : 10000, crystal : 10000}},
	{id : 408, c : {metal : 50000, crystal : 50000}},
	{id : 502, c : {metal : 8000, deuterium : 2000}},
	{id : 503, c : {metal : 12500, crystal : 2500, deuterium : 10000}}
];

const TECHS_BY_ID = {};
const SHIPS_BY_ID = {};

TECHS.forEach(function (tech) {
	TECHS_BY_ID[tech.id] = tech;
	if (tech.id >= 200 && tech.id <= 300) {
		SHIPS_BY_ID[tech.id] = tech;
	}
});

/**
 *
 * @param txt
 */
function parseCoords(txt) {
	var arr = txt.replace(/\[|]/gi, '').split(':');
	var result = [];
	arr.forEach(function (val, index) {
		result[index] = _i(val);
	});
	return result;
}

/**
 *
 * @param {String} dt
 * @return {Date}
 */
function parseDT(dt) {
	if (dt && dt.match(/.*?(\d+)\.(\d+)\.(\d+).*?(\d+):(\d+):(\d+)/)) {
		//noinspection JSUnresolvedVariable
		return new Date(_i(RegExp.$3, 10), _i(RegExp.$2, 10) - 1, _i(RegExp.$1, 10), _i(RegExp.$4, 10),
			_i(RegExp.$5, 10), _i(RegExp.$6, 10));
	}
	return null;
}

function parseNumber(txt) {
	if (txt.match(/([\d,\.]+) ?(\S*)$/)) {
		var num = RegExp.$1;
		var mod = RegExp.$2;
		if (mod) {
			return parseFloat(num.replace(/,/, '.')) *
				(mod === 'M' || mod === 'Mio' ? 1000000 :
					(mod === 'Mrd' || mod === 'Bn' || mod === 'B' ? 1000000000 : 1));
		}
		return _i(num.replace(/[^\d-]/g, ''));
	}
	return 0;
}

const ocalc = (function () {

	function calcAverageTemp(position) {
		const average = [240, 190, 140, 90, 80, 70, 60, 50, 40, 30, 20, 10, -30, -70, -110];
		return average[position[2] - 1];
	}

	function calcCosts(itemID, level) {
		const ret = toRes(0);
		const item = TECHS_BY_ID[itemID];
		Object.keys(item.c).forEach(function (elem) {
			const c = item.c;
			if (item.id === 124) {
				ret[elem] =
					100 * Math.floor(0.5 + (c[elem] / 100) * Math.pow((item.f || 1), level - 1));
			} else if (item.id >= 200) {
				ret[elem] = level * c[elem];
			} else {
				ret[elem] = Math.floor(Math.pow((item.f || 1), level) * c[elem]);
			}
		});
		return ret;
	}

	function calcDistance(pos1, pos2, uni) {
		if (pos1[0] !== pos2[0]) {
			return dist(pos1[0], pos2[0], uni.donutGalaxy, uni.galaxies) * 20000;
		}
		if (pos1[1] !== pos2[1]) {
			return dist(pos1[1], pos2[1], uni.donutSystem, uni.systems) * 95 + 2700;
		}
		if (pos1[2] !== pos2[2]) {
			return Math.abs(pos1[2] - pos2[2]) * 5 + 1000;
		}
		return 5;

		function dist(a, b, donut, max) {
			const d = Math.abs(a - b);
			if (!donut) {
				return d;
			}
			const m = Math.floor((max - 1) / 2);
			if (d < m) {
				return d;
			}
			return max - d;
		}
	}

	function calcFlightTime(distance, ships, player, uni, factor) {
		const f = factor || 1;
		var speed = Number.MAX_VALUE;
		ships.forEach(function (ship) {
			if (!ship.cSpeed) {
				calcSpeed(ship, player);
			}
			speed = Math.min(speed, ship.cSpeed);
		});
		return Math.round(((3500 / f) * Math.pow(distance * 10 / speed, 0.5) + 10) / uni.speedFleet);
	}

	function calcPlanetProduction(planet, player, uni, underFactor) {
		const buildings = planet.buildings || {};
		var prod = toRes(0);
		var use = toRes(0);
		if (planet.type !== 'm') {
			prod = product({metal : 30, crystal : 15, deuterium : 0, energy : 0}, uni.speed);
		}
		const uf = underFactor || toRes(1);
		Object.keys(buildings).forEach(function (elem) {
			var item = TECHS_BY_ID[elem];
			if (!item) {
				return;
			}
			const p = calcProduction(item, buildings[elem], player, planet, uni.speed, uf);
			Object.keys(p).forEach(function (m) {
				if (p[m] > 0) {
					prod[m] += p[m];
				} else {
					use[m] += p[m];
				}
			});
		});
		const result = sum(prod, use);
		var rerun = false;
		Object.keys(result).forEach(function (m) {
			if (result[m] < 0) {
				var p = prod[m] / -use[m];
				if (p < 0.99) {
					uf[m] = uf[m] * p;
					rerun = true;
				}
			}
		});
		if (rerun) {
			return calcPlanetProduction(planet, player, uni, uf);
		}
		return result;
	}

	function calcProduction(item, level, player, planet, speed, underFactor) {
		if (!item || !level || !item.p) {
			return toRes(0);
		}
		underFactor = underFactor || toRes(1);
		const s = speed || 1;
		const maxTemp = planet.maxTemp || calcAverageTemp(planet.position);
		var eTec = 3;
		var pTec = 0;
		if (player.techs) {
			eTec = player.techs[113] || 3;
			pTec = player.techs[122] || 0;
		}
		const officers = player.officers || 0;
		var ef = 0;
		var gf = 0;
		if ((officers & 4) === 4) {
			ef += 0.1;
		}
		if ((officers & 8) === 8) {
			gf += 0.1;
		}
		if (officers === 31) {
			ef += 0.02;
			gf += 0.02;
		}
		var uf = 1;
		Object.keys(item.p).forEach(function (m) {
			if (item.p[m] < 0) {
				uf = Math.min(uf, underFactor[m]);
			}
		});
		const prod = toRes(0);
		Object.keys(item.p).forEach(function (elem) {
			const base = item.p[elem];
			const ps = elem === 'energy' ? 1 : s;
			var baseProd = 0;
			if (base === 'formula') {
				switch (item.id) {
					case 3:
						baseProd =
							Math.round(10 * level * Math.pow(1.1, level) * (1.44 - 0.004 * maxTemp) * uf * ps);
						break;
					case 12:
						baseProd = Math.round(30 * level * Math.pow(1.05 + eTec * 0.01, level) * uf);
						break;
					case 212:
						baseProd = Math.round(Math.floor((maxTemp + 140) / 6) * level * uf);
						break;
					default:
						console.log('calcProduction: formula for', item.id, 'not implemented');
						break;
				}
			} else if (base > 0) {
				if (elem === 'energy') {
					baseProd = Math.floor(base * level * Math.pow(1.1, level) * uf * ps);
				} else {
					baseProd = Math.round(base * level * Math.pow(1.1, level) * uf * ps);
				}
			} else {
				baseProd = Math.floor(base * level * Math.pow(1.1, level) * uf);
			}
			if (baseProd > 0) {
				const officersProd = Math.round(baseProd *
					(elem === 'metal' || elem === 'crystal' || elem === 'deuterium' ? gf : ef));
				const plasmaProd = Math.round(baseProd *
					(elem === 'metal' ? 0.01 : elem === 'crystal' ? 0.0066 : 0) * pTec);
				prod[elem] = baseProd + officersProd + plasmaProd;
			} else {
				prod[elem] = baseProd;
			}
		});
		return prod;
	}

	/**
	 *
	 * @param {{production:{},resources:{},storage:{}}} planet
	 * @param {number} seconds
	 * @returns {{}}
	 */
	function calcResources(planet, seconds) {
		const gain = product(planet.production, seconds);
		const resources = sum(planet.resources, gain);
		Object.keys(resources).forEach(function (key) {
			if (planet.storage && planet.storage[key]) {
				resources[key] = Math.max(planet.resources[key],
					Math.min(resources[key], planet.storage[key]));
			}
		});
		return resources;
	}

	function calcSpeed(ship, player) {
		ship.cSpeed = 0;
		const techs = player.techs || {'115' : 0, '117' : 0, '118' : 0};
		const ids = ['115', '117', '118'];
		const factors = [0.1, 0.2, 0.3];
		if (ship.eng) {
			ship.eng.forEach(function (sp, i) {
				if (sp) {
					const l = techs[ids[i]];
					const v = factors[i];
					if (!sp.l || sp.l <= l) {
						ship.cSpeed = Math.floor(sp.s + (sp.s * v * l));
						ship.usage = sp.u;
					}
				}
			});
		}
	}

	/**
	 *
	 * @param {Object} planet
	 * @returns {Object}
	 */
	function calcStorageCapacity(planet) {
		const buildings = planet.buildings || {};
		const stoCap = planet.storage || {
				metal : 10000,
				crystal : 10000,
				deuterium : 10000
			};
		var update = false;
		Object.keys(buildings).forEach(function (elem) {
			switch (elem) {
				case '22':
					stoCap.metal = sto(buildings[elem]);
					update = true;
					break;
				case '23':
					stoCap.crystal = sto(buildings[elem]);
					update = true;
					break;
				case '24':
					stoCap.deuterium = sto(buildings[elem]);
					update = true;
					break;
				default:
					break;
			}
		});
		if (update || !planet.storage) {
			planet.storage = stoCap;
		}
		return stoCap;

		function sto(level) {
			return Math.floor(2.5 * Math.pow(Math.E, 20 * level / 33)) * 5000;
		}
	}

	function calcUsage(amount, speed, usage, flighttime, distance, uni) {
		return Math.round(amount * usage * distance / 35000 *
			Math.pow(35000 / (flighttime * uni.speedFleet - 10) * Math.sqrt(distance * 10 / speed) / 10 +
				1, 2));
	}

	function format(res, f) {
		const txt = {};
		Object.keys(res).forEach(function (key) {
			txt[key] = f.format(res[key]);
		});
		return txt;
	}

	/**
	 *
	 * @param {...{}|number} operator
	 * @returns {{}}
	 */
	function product(operator) {
		const prod = extend({}, operator || toRes(0));
		var i, op;
		for (i = 1; i < arguments.length; i++) {
			op = arguments[i];
			if (!op && op !== 0) {
				continue;
			}
			if (typeof op === 'number') {
				op = toRes(op);
			}
			Object.keys(prod).forEach(function (key) {
				prod[key] = prod[key] * (op[key] ? op[key] : 0);
			});
		}
		return prod;
	}

	function quotient() {
		const ratio = extend({}, arguments[0] || toRes(0));
		var i, op;
		for (i = 1; i < arguments.length; i++) {
			op = arguments[i];
			if (!op && op !== 0) {
				continue;
			}
			if (typeof op === 'number') {
				op = toRes(op);
			}
			Object.keys(ratio).forEach(function (key) {
				ratio[key] = ratio[key] / (op[key] ? op[key] : 1);
			});
		}
		return ratio;
	}

	function sum() {
		const _sum = extend({}, arguments[0] || toRes(0));
		var i, op;
		for (i = 1; i < arguments.length; i++) {
			op = arguments[i];
			if (!op && op !== 0) {
				continue;
			}
			if (typeof op === 'number') {
				op = toRes(op);
			}
			Object.keys(_sum).forEach(function (key) {
				_sum[key] += op[key] ? op[key] : 0;
			});
		}
		return _sum;
	}

	function toRes(arg) {
		const result = {};
		RESOURCES.forEach(function (key) {
			result[key] = arg;
		});
		return result;
	}

	return {
		costs : calcCosts,
		distance : calcDistance,
		flightTime : calcFlightTime,
		format : format,
		product : product,
		production : calcProduction,
		planetProduction : calcPlanetProduction,
		quotient : quotient,
		resources : calcResources,
		speed : calcSpeed,
		storageCapacity : calcStorageCapacity,
		sum : sum,
		toRes : toRes,
		usage : calcUsage
	};
})();
/* global Skynet, $, Promise, _, _h, extend, MESSAGES, SHIPS_BY_ID, NF, Q, _i, Timer, DF */

(function (_s) {
	const cfg = {
		show_transport_btn : 'show.transport.btn',
		prefer_fast_transport : 'prefer.fast.transport',
		show_expo_btn : 'show.expo.btn',
		expo_transport_only : 'expo.transport.only',
		expo_espionage : 'expo.espionage',
		expo_strong_ship : 'expo.strong.ship',
		expo_max_points : 'expo.max.points',
		show_return_countdown : 'show.return.countdown',
		mission_recycle : 'mission.recycle',
		mission_colonize : 'mission.colonize',
		mission_espionage : 'mission.espionage'
	};
	const cfg_def = [
		{key : cfg.show_transport_btn, label : 'show transport button', type : 'boolean', def : true, cat : 'fleet'},
		{key : cfg.prefer_fast_transport, label : 'prefer fast transport', type : 'boolean', def : false, cat : 'fleet'},
		{key : cfg.show_expo_btn, label : 'show expedition button', type : 'boolean', def : true, cat : 'fleet'},
		{key : cfg.expo_transport_only, label : 'send transporters only on expedition', type : 'boolean', def : false, cat : 'fleet'},
		{key : cfg.expo_espionage, label : 'send espionage on expedition', type : "boolean", def : true, cat : 'fleet'},
		{key : cfg.expo_strong_ship, label : 'strongest ship for expedition', type : 'select', def : '213', cat : 'fleet', scope : 'uni', dataSrc : getShipsForConfig},
		{key : cfg.expo_max_points, label : 'personal max expo points', type : "number", def : 25000, cat : 'fleet', scope : 'uni'},
		{key : cfg.show_return_countdown, label : 'show return countdown', type : 'boolean', def : true, cat : 'fleet'},
		{key : cfg.mission_recycle, label : 'set mission recycle', type : 'boolean', def : true, cat : 'fleet'},
		{key : cfg.mission_colonize, label : 'set mission colonize', type : 'boolean', def : true, cat : 'fleet'},
		{key : cfg.mission_espionage, label : 'set mission espionage', type : 'boolean', def : true, cat : 'fleet'}
	];
	_s.addSettings(cfg_def);

	//noinspection JSUnusedGlobalSymbols
	const handler = {
		fleet1 : fleet1,
		fleet2 : fleet2,
		movement : movement
	};

	Promise.all([_s.page, _s.config, _s.player, _s.planet]).then(function (args) {
		const page = args[0];
		const config = args[1];
		const player = args[2];
		const planet = args[3];
		if (page.match(/^(?:fleet1|fleet2|movement)$/)) {
			handler[page].call(null, config, player, planet);
		}
	});

	function checkEspionage(config) {
		if (!config[cfg.mission_espionage]) {
			return;
		}
		const parent = $('#shipsChosen');
		const mission = parent.find('input[name=mission]');
		const defMission = mission.val();
		parent.bind('click keyup', function () {
			const fleet = [];
			parent.find('input[id^=ship_]:enabled').each(function () {
				const me = $(this);
				const val = me.val();
				if (val !== '' && val !== '0') {
					fleet.push(me.prop('name'));
				}
			});
			if (fleet.length === 1 && fleet.indexOf('am210') > -1) {
				mission.val(6);
			} else {
				mission.val(defMission);
			}
		});
	}

	function fleet1(config, player, planet) {
		const basic = {
			background : 'url("http://gf1.geo.gfsrv.net/cdndf/0210bdaf0d408992ab38c453c5ba7d.jpg") no-repeat scroll 0 0 transparent',
			'background-size' : 'auto 92px',
			border : '1px solid black',
			cursor : 'hand',
			display : 'block',
			float : 'left',
			height : '30px',
			overflow : 'hidden',
			width : '30px',
			'margin-right' : '5px'
		};
		var tBtn, eBtn;
		if (config[cfg.show_transport_btn]) {
			tBtn = $(_h('span', {
				style : extend({}, basic, {'background-position' : '-154px 0'}),
				'class' : 'tooltipHTML'
			}));
		}
		if (config[cfg.show_expo_btn]) {
			eBtn = $(_h('span', {
				style : extend({}, basic, {'background-position' : '0 -61px'})
			}));
		}
		checkEspionage(config);
		if (!tBtn && !eBtn) {
			return;
		}
		const result = getTransportFleet(planet);
		$('#warning').each(function () {
			const me = $(this);
			me.append($(_h('div', {style : {margin : '0 auto', width : '230px'}}, ['span',
					{
						text : _("overall resources") + ':', style : {display : 'inline-block', width : '130px'}
					}],
				['span',
					{text : NF.D0.format(result.sumRes), style : {display : 'inline-block', width : '100px', 'text-align' : 'right'}}])));
			result.fleet.forEach(function (elem) {
				me.append($(_h('div', {style : {margin : '0 auto', width : '230px'}}, ['span',
						{text : elem.name + ':', style : {display : 'inline-block', width : '130px'}}],
					['span',
						{text : NF.D0.format(elem.amount), style : {display : 'inline-block', width : '100px', 'text-align' : 'right'}}])));
			});
		});
		$("#buttonz").find("span.send_all").each(function () {
			const me = $(this);
			var width = 69;
			if (tBtn) {
				me.before(tBtn);
				width += 37;
				const c1 = result.sumRes > result.cap ? 'overmark' : 'undermark';
				const html = [
					{"h" : _("overall resources") + ":", "v" : NF.D0.format(result.sumRes), "c" : c1},
					{"h" : _("transport capacity") + ":", "v" : NF.D0.format(result.cap), "c" : c1}
				];
				result.fleet.forEach(function (elem) {
					html.push({
						h : elem.name + ':', v : NF.D0.format(elem.amount), c : elem.amount >
						elem.available ? 'overmark' : ''
					});
				});
				_s.renderHTMLTooltip('transport', html, tBtn);
				const ships = planet.ships || {};
				tBtn.click(function () {
					const fleet = [];
					const ship = SHIPS_BY_ID[202];
					const available = ships[ship.id] || 0;
					const amount = Math.ceil(result.sumRes / ship.cap);
					if (config[cfg.prefer_fast_transport] && amount < available) {
						fleet.push({ref : ship.id, amount : amount});
					} else {
						var rest = result.sumRes;
						[203, 202, 209, 214].every(function (id) {
							const ship = SHIPS_BY_ID[id];
							const available = ships[ship.id] || 0;
							if (available) {
								const amount = Math.ceil(rest / ship.cap);
								const val = amount > available ? available : amount;
								fleet.push({ref : ship.id, amount : val});
								rest -= val * ship.cap;
								if (rest <= 0) {
									return false;
								}
							}
							return true;
						});
					}
					_s.actions.sendFleet(fleet, [], 3, true);
				});
			}
			if (eBtn) {
				me.before(eBtn);
				width += 37;
				_s.port.get(MESSAGES.expoPoints).then(function (uniMaxPoints) {
					var points = Math.min(uniMaxPoints, config[cfg.expo_max_points] || 25000);
					const maxPoints = points;
					const ships = planet.ships || {};
					const fleet = [];
					if (config[cfg.expo_espionage] && ships[210]) {
						fleet.push({ref : 210, amount : 1, name : SHIPS_BY_ID[210].name});
						points -= SHIPS_BY_ID[210].expo;
					}
					if (!config[cfg.expo_transport_only]) {
						const strongest = _i(config[cfg.expo_strong_ship] || '213');
						const test = [213, 211, 215, 207, 206, 205, 204];
						test.every(function (/*number*/ ref) {
							if (strongest === 215 && (ref === 213 || ref === 211)) {
								return true;
							}
							if (ref !== 215 && strongest < ref) {
								return true;
							}
							if (ref === 215 && strongest < 211) {
								return true;
							}
							if (ref === 204 && ships[203]) {
								return true;
							}
							const available = ships[ref] || 0;
							if (available > 0) {
								fleet.push({ref : ref, amount : 1, name : SHIPS_BY_ID[ref].name});
								points -= SHIPS_BY_ID[ref].expo;
								return false;
							}
							return true;
						});
					}
					['203', '202'].forEach(function (ref) {
						const available = ships[ref] || 0;
						if (points > 0 && available > 0) {
							const needed = Math.ceil(points / SHIPS_BY_ID[ref].expo);
							const o = {
								ref : ref, amount : needed > available ? available :
									needed, name : SHIPS_BY_ID[ref].name
							};
							fleet.push(o);
							points -= SHIPS_BY_ID[ref].expo * o.amount;
						}
					});
					const p = maxPoints - points;
					const html = [
						{
							h : _('expo points') + ':', v : NF.D0.format(p) +
						(uniMaxPoints - points > 0 ? ' (' + NF.D0.format(p - uniMaxPoints) + ')' : ''),
							c : points > 0 ? 'overmark' : ''
						}
					];
					fleet.forEach(function (elem) {
						html.push({h : elem.name + ':', v : NF.D0.format(elem.amount)});
					});
					_s.renderHTMLTooltip('expedition', html, eBtn);
					eBtn.click(function () {
						_s.actions.sendFleet(fleet, [0, 0, 16], 15, points <= 0);
					});
					eBtn.addClass('tooltipHTML').css('background-position', '0 0');
				});
			}
			me.parent().css('width', width);
		});
	}

	function fleet2(config, player, planet, i18n) {
		if ($("body#fleet1").length === 1) {
			fleet1(config, player, planet, i18n);
			return;
		}
		$('form[name="details"]').each(function () {
			var form = $(this);
			var mission = form.find('input[name="mission"]');
			if (config[cfg.mission_colonize]) {
				form.find('input[name="am208"]').each(function () {
					if ($(this).val() > '0') {
						_s.trigger(Q('#pbutton'), 'click');
						mission.val(7);
					}
				});
			}
			if (mission.val() === '0' && config[cfg.mission_recycle]) {
				form.find('input[name="am209"]').each(function () {
					if ($(this).val() > '0') {
						_s.trigger(Q('#dbutton'), 'click');
					}
				});
			}
		});
	}

	function getShipsForConfig() {
		const result = [];
		Object.keys(SHIPS_BY_ID).forEach(function (key) {
			if (key === '202' || key === '204' || key === '208' || key === '209' || key === '210' ||
				key === '212' || key === '214') {
				return;
			}
			result.push({value : key, text : SHIPS_BY_ID[key].name});
		});
		result.sort(function (a, b) {
				if (a.value === '215' && (b.value === '211' || b.value === '213')) {
					return -1;
				}
				if (b.value === '215' && (a.value === '211' || a.value === '213')) {
					return 1;
				}
				if (a.value < b.value) {
					return -1;
				}
				return 1;
			}
		);
		return result;
	}

	function getTransportFleet(planet) {
		const result = {};
		const ships = planet.ships || {};
		result.cap = 0;
		Object.keys(ships).forEach(function (id) {
			const amount = ships[id];
			const ship = SHIPS_BY_ID[id];
			if (amount && ship.cap) {
				result.cap += amount * ship.cap;
			}
		});
		const resources = planet.resources;
		result.sumRes = resources.metal + resources.crystal + resources.deuterium;
		result.fleet = [];
		[202, 203].forEach(function (id) {
			const ship = SHIPS_BY_ID[id];
			const amount = Math.ceil(result.sumRes / ship.cap);
			const available = ships[id] || 0;
			result.fleet.push({id : id, amount : amount, available : available, name : ship.name});
		});
		return result;
	}

	function movement(config) {
		if (!config[cfg.show_return_countdown]) {
			return;
		}
		const fleetEvents = {};
		$('#inhalt').find('span.reversal.reversal_time').each(function () {
			const me = $(this);
			var title = me.find('a').prop('title');
			if (title) {
				title = title.replace(/<.+?>/g, ' ');
				if (title.match(/(\d.*)\.(\d.*)\.(\d.*)\s(\d.*):(\d.*):(\d.*)/)) {
					//noinspection JSUnresolvedVariable
					const date = new Date(_i(RegExp.$3), _i(RegExp.$2) - 1, _i(RegExp.$1), _i(RegExp.$4),
						_i(RegExp.$5), _i(RegExp.$6));
					const ref = me.attr('ref');
					fleetEvents[ref] = date.getTime();
					me.parent().find('span.starStreak').append($(_h('div', {
						id : "skynet_return_" + ref,
						'class' : 'skynet_c_timer',
						style : {
							width : '140px',
							'text-align' : 'center',
							'margin' : '0 auto',
							position : 'relative',
							top : '-5px'
						}
					})));
				}
			}
		});
		Timer.add(function () {
			const now = new Date();
			const delta = (now.getTime() - _s.deltaT - _s.ogameTS.getTime()) * 2;
			Object.keys(fleetEvents).forEach(function (key) {
				$('div#skynet_return_' + key).text(DF.FULL.format(new Date(fleetEvents[key] + delta)));
			});
			return true;
		}, true);
	}

})(Skynet);
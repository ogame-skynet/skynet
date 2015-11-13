/* global Skynet, Q, $, parseCoords, parseDT, getTextNodesText, MESSAGES, extend, ocalc, RESOURCES,
 _i, _, _h, SHIPS_BY_ID, nf, RESOURCES, PAGES, getResource, ko, Timer, parseNumber */

(function (_s) {
	const cfg = {
		enhance_spy : 'spyreport.enhance',
		show_speedsim : 'spyreport.show.speedsim',
		show_osimulate : 'spyreport.show.osimulate',
		show_production : 'spyreport.show.production',
		raidar_ratio : 'spyreport.raidar.ratio',
		raidar_visible : 'spyreport.raidar.visible',
		raidar_animation : 'spyreport.raidar.animation',
		raidar_attack_ship : 'spyreport.raidar.attackShip'
	};
	const cfg_def = [
		{key : cfg.enhance_spy, label : 'enhance spy', type : 'boolean', def : true, cat : 'spyreport'},
		{key : cfg.show_speedsim, label : 'show speedsim', type : 'boolean', def : true, cat : 'spyreport'},
		{key : cfg.show_osimulate, label : 'show osimulate', type : 'boolean', def : true, cat : 'spyreport'},
		{key : cfg.show_production, label : 'show production', type : 'boolean', def : true, cat : 'spyreport'},
		{key : cfg.raidar_visible, cat : 'hidden', scope : 'uni'},
		{key : cfg.raidar_ratio, label : 'resource ratio', type : 'text', def : '3:2:1', cat : 'Raidar', scope : 'uni'},
		{key : cfg.raidar_animation, label : 'animation', type : 'boolean', def : true, cat : 'Raidar'},
		{
			key : cfg.raidar_attack_ship, label : 'ship for instant attack', type : 'select', def : '202',
			cat : 'Raidar', scope : 'uni', dataSrc : function () {
			return [{value : '', text : _('no ship')}, {value : '202', text : SHIPS_BY_ID['202'].name},
				{value : '203', text : SHIPS_BY_ID['203'].name}];
		}
		}
	];
	_s.addSettings(cfg_def);
	var raidarVM = null;

	Promise.all([_s.page, _s.config]).then(function (args) {
		try {
			const page = args[0];
			const config = args[1];
			var version = 5;
			if (_s.ogameVersion.match(/^6/)) {
				version = 6;
			}
			if (page === PAGES.messages && config[cfg.enhance_spy]) {
				if (version === 6) {
					addObserverV6();
					prepareRaidar(config);
				} else {
					addObserverV5();
				}
			}
			if (page === PAGES.messages || page === PAGES.galaxy && config[cfg.enhance_spy]) {
				const dlgObserver = new MutationObserver(function (mutations) {
					mutations.forEach(function (mutation) {
						for (var i = 0; i < mutation.addedNodes.length; i++) {
							if (mutation.addedNodes[i].nodeName.toLowerCase() === 'div') {
								var dlg = $(mutation.addedNodes[i]);
								if (dlg.attr('data-page') === 'showmessage' ||
									dlg.attr('data-page') === 'messages') {
									var dialogObserver = new MutationObserver(function (mutations) {
										mutations.forEach(function (mutation) {
											for (var i = 0; i < mutation.addedNodes.length; i++) {
												if (mutation.addedNodes[i].nodeName.toLowerCase() === 'div') {
													var msg = $(mutation.addedNodes[i]);
													if (msg.hasClass('detail_msg')) {
														handleMessageV6(msg);
													} else if (msg.hasClass('showmessage')) {
														handleMessage(msg);
													}
												}
											}
										});
									});
									dialogObserver.observe(mutation.addedNodes[i], {
										childList : true
									});
								}
							}
						}
					});
				});
				dlgObserver.observe(document.body, {
					childList : true
				});
			}
		} catch (e) {
			console.error(e.message);
		}
	});

	function addObserverV5() {
		const mcObserver = new MutationObserver(function (mutations) {
			try {
				mutations.forEach(function (mutation) {
					for (var i = 0; i < mutation.addedNodes.length; i++) {
						if (mutation.addedNodes[i].nodeName.toLowerCase() === 'form') {
							handleMessages(mutation.addedNodes[i]);
						}
					}
				});
			} catch (e) {
				console.error(e);
			}
		});
		var target = Q('#vier div.mailWrapper');
		if (target) {
			mcObserver.observe(target, {
				childList : true,
				subtree : true
			});
			$(target).find('form[name="delMsg"]').each(function () {
				handleMessages(this);
			});
		}
	}

	function addObserverV6() {
		var target = Q('div.content > div.js_tabs');
		if (target) {
			const observer = new MutationObserver(function (mutations) {
				try {
					mutations.forEach(function (mutation) {
						for (var i = 0; i < mutation.addedNodes.length; i++) {
							if (mutation.addedNodes[i].nodeName.toLowerCase() === 'ul') {
								handleMessagesV6(mutation.addedNodes[i]);
							}
						}
					});
				} catch (e) {
					console.error(e);
				}
			});
			observer.observe(target, {
				childList : true,
				subtree : true
			});
		}
	}

	function calcLoot(root) {
		if (root.find('span[class*="bandit"]').length) {
			return 1;
		}
		if (root.find('span.status_abbr_honorableTarget').length) {
			return 0.75;
		}
		return 0.5;
	}

	function detectPlanet(root) {
		const planet = {};
		const title = root.find('span.msg_title a.txt_link');
		if (title.text().match(/\s?(.+?)\s\[(.+?)]/)) {
			planet.name = RegExp.$1;
			planet.position = parseCoords(RegExp.$2);
			planet.type = title.find('figure.moon').length ? 'm' : 'p';
			planet.resourcesTimeStamp = parseDT(root.find('span.msg_date').text()).getTime();
		}
		return planet;
	}

	function dspButtons(parent, planet, owner) {
		Promise.all([_s.config, _s.player, _s.planet]).then(function (args) {
			const config = args[0];
			const player = args[1];
			const currentPlanet = args[2];
			const btnAttack = _s.ogameVersion.match(/^6/) ? parent.find('a span.icon_attack').parent() :
				parent.find('table.defenseattack.spy td.attack a');
			var txt = _('ignore');
			if (planet.status && ((planet.status & 1) === 1)) {
				txt = _('revoke_ignore');
			}
			if (planet.id && planet.owner && planet.type === 'p') {
				const btnIgnore = $(_h('a', {
						'class' : 'btn_blue tooltip', style : {'margin-left' : '10px'},
						text : txt, title : _('hint_ignore')
					}
				)).insertAfter(btnAttack);
				if (_s.ogameVersion.match(/^6/)) {
					btnIgnore.css({'float' : 'left', 'margin-right' : 10, 'margin-left' : 0});
				}
				btnIgnore.click(function () {
					planet.status = (planet.status ? planet.status ^ 1 : 1);
					_s.port.send(MESSAGES.updatePlanets, planet);
					var txt = _('ignore');
					if (planet.status && ((planet.status & 1) === 1)) {
						txt = _('revoke_ignore');
					}
					$(this).text(txt);
				});
			}
			if (!config[cfg.show_speedsim] && !config[cfg.show_osimulate]) {
				return;
			}
			const params = [];
			params.push('enemy_pos=' +
				encodeURIComponent(planet.position[0] + ':' + planet.position[1] + ':' +
					planet.position[2]));
			if (player.techs) {
				params.push('tech_a0_0=' + (player.techs['109'] || 0));
				params.push('tech_a0_1=' + (player.techs['110'] || 0));
				params.push('tech_a0_2=' + (player.techs['111'] || 0));
				params.push('engine0_0=' + (player.techs['115'] || 0));
				params.push('engine0_1=' + (player.techs['117'] || 0));
				params.push('engine0_2=' + (player.techs['118'] || 0));
			}
			if (owner.techs) {
				params.push('tech_d0_0=' + (owner.techs['109'] || 0));
				params.push('tech_d0_1=' + (owner.techs['110'] || 0));
				params.push('tech_d0_2=' + (owner.techs['111'] || 0));
			}
			var i, amount;
			if (planet.ships) {
				for (i = 202; i < 216; i++) {
					amount = planet.ships['' + i];
					if (amount) {
						params.push('ship_d0_' + (i - 202) + '_b=' + amount);
					}
				}
			}
			if (planet.defense) {
				for (i = 401; i < 409; i++) {
					amount = planet.defense['' + i];
					if (amount) {
						params.push('ship_d0_' + (14 + i - 401) + '_b=' + amount);
					}
				}
			}
			params.push('rf=' + (_s.uni.rapidFire ? '1' : '0'));
			params.push('def_to_df=' + (_s.uni.defToTF ? '1' : '0'));
			params.push('perc-df=' + (_s.uni.debrisFactor * 100));
			params.push('start_pos=' + currentPlanet.position[0] + ':' + currentPlanet.position[1] + ':' +
				currentPlanet.position[2]);
			params.push('enemy_name=' + planet.name);
			if (config[cfg.show_speedsim]) {
				const res = ocalc.product(planet.resources, planet.lf * 2);
				const arrP = extend([], params);
				arrP.push('enemy_metal=' + res.metal);
				arrP.push('enemy_crystal=' + res.crystal);
				arrP.push('enemy_deut=' + res.deuterium);
				const btnSpeedSim = $(_h('a', {
					'class' : 'btn_blue', style : {'margin-right' : '10px'},
					href : 'http://websim.speedsim.net/index.php?&referrer=skynet&' + arrP.join('&'),
					target : '_blank', text : 'SpeedSim'
				})).insertBefore(btnAttack);
				if (_s.ogameVersion.match(/^6/)) {
					btnSpeedSim.css({'float' : 'left'});
				}
			}
			if (config[cfg.show_osimulate]) {
				params.push('plunder_perc=' + (planet.lf * 100));
				params.push('enemy_metal=' + planet.resources.metal);
				params.push('enemy_crystal=' + planet.resources.crystal);
				params.push('enemy_deut=' + planet.resources.deuterium);
				const btnOSimulate = $(_h('a', {
					'class' : 'btn_blue', style : {'margin-right' : '10px'},
					href : 'http://www.osimulate.com?&ref=skynet&' + params.join('&'),
					target : '_blank', text : 'OSimulate'
				})).insertBefore(btnAttack);
				if (_s.ogameVersion.match(/^6/)) {
					btnOSimulate.css({'float' : 'left'});
				}
			}
		});
	}

	/**
	 *
	 * @param {*} parent
	 * @param {*} planet
	 * @param {*} player
	 */
	function dspPlunder(parent, planet, player) {
		const f = nf(0, 0, 0, true);
		Promise.all([_s.player, _s.planet, _s.config]).then(function (args) {
			const currentPlayer = args[0];
			const ownPlanet = args[1];
			const config = args[2];
			var cClass = '';
			if (!planet.ships || !planet.defense || JSON.stringify(planet.ships) !== "{}" ||
				JSON.stringify(planet.defense).match(/"40/)) {
				cClass = 'skynet_c_problem';
			}
			const table = createTable(parent, cClass, planet);
			const btnAttack = _s.ogameVersion.match(/^6/) ? parent.find('a span.icon_attack').parent() :
				parent.find('table.defenseattack.spy td.attack a');
			const now = new Date();
			const delta = (now.getTime() - planet.resourcesTimeStamp - _s.deltaT) / 1000;
			const distance = ocalc.distance(ownPlanet.position, planet.position, _s.uni);
			const production = ocalc.planetProduction(planet, player, _s.uni);
			if (config[cfg.show_production]) {
				dspProduction(parent, production);
			}
			planet.production = ocalc.quotient(production, 3600);
			ocalc.storageCapacity(planet);
			prepareShips(currentPlayer).forEach(function (ship) {
				const fTime = ocalc.flightTime(distance, [ship], currentPlayer,
					_s.uni);
				const dt = delta + fTime;
				const resources = ocalc.resources(planet, dt);
				const m = Math.floor(resources.metal * planet.lf);
				const c = Math.floor(resources.crystal * planet.lf);
				const d = Math.floor(resources.deuterium * planet.lf);
				const s = m + c + d;
				//const cap = Math.floor(Math.max(m + c + d, Math.min(0.75 * (2 * m + c + d), 2 * m + d)));
				const amount = Math.ceil(s / ship.cap);
				const usage = ocalc.usage(amount, ship.cSpeed, ship.usage, fTime, distance, _s.uni) + 1;

				table.append($(_h('tr', '',
					['td', {text : ship.name}],
					['td', {text : formatSeconds(fTime)}],
					['td', '', ['a', {
						text : f.format(amount), href : btnAttack.attr('href') + '&am' + ship.id +
						'=' +
						amount
					}]],
					['td', {colspan : 2}, [
						'span', {
							text : f.format(m) + ' ' + _('metal') + ', ' + f.format(c) +
							' ' +
							_('crystal') + ', '
						}
					], [
						'span', {
							text : f.format(d - usage),
							'class' : d - usage < 0 ? 'overmark' : ''
						}
					], [
						'span', {
							text : ' ' + _('deuterium')
						}
					]]
				)));
			});
		});

		function createTable(parent, cClass, planet) {
			if (_s.ogameVersion.match(/^6/)) {
				var hdl = $(_h('div', {'class' : 'section_title'},
					['div', {'class' : 'c-left'}],
					['div', {'class' : 'c-right'}],
					['div', {
						'class' : 'title_txt' + (cClass ? ' ' + cClass : ''), text : _('loot',
							[planet.lf * 100])
					}])).insertBefore(parent.find('div.section_title').first());
				return $(_h('table', {style : {width : '100%', 'margin-left' : '6px'}},
					['tr', '',
						['th', {text : _('ship'), style : {'text-align' : 'left', 'color' : '#fff'}}],
						['th', {text : _('flight time'), style : {'text-align' : 'left', 'color' : '#fff'}}],
						['th', {text : _('amount'), style : {'text-align' : 'left', 'color' : '#fff'}}],
						['th',
							{text : _('gain'), colspan : 2, style : {'text-align' : 'left', 'color' : '#fff'}}]]
				)).insertAfter(hdl);
			}
			return $(_h('table', {},
				['tr', '',
					['th',
						{
							'class' : 'area' +
							(cClass ? ' ' + cClass : ''), colspan : 6, text : _('loot', [planet.lf * 100])
						}]],
				['tr', '',
					['th', {text : _('ship'), style : {'text-align' : 'left'}}],
					['th', {text : _('flight time'), style : {'text-align' : 'left'}}],
					['th', {text : _('amount'), style : {'text-align' : 'left'}}],
					//['th', {text : _('required capacity'), style : {'text-align' : 'left'}}],
					['th', {text : _('resources'), colspan : 2, style : {'text-align' : 'left'}}]]
			)).insertBefore(parent.find('table.aktiv.spy'));
		}

		function prepareShips(player) {
			const ships = [SHIPS_BY_ID[202], SHIPS_BY_ID[203], SHIPS_BY_ID[206], SHIPS_BY_ID[207]];
			ships.forEach(function (ship) {
				if (!ship.cSpeed) {
					ocalc.speed(ship, player);
				}
			});
			ships.sort(function (a, b) {
				return b.cSpeed - a.cSpeed;
			});
			return ships;
		}
	}

	function dspProduction(parent, production) {
		if (_s.ogameVersion.match(/^6/)) {
			parent.find('li.resource_list_el').each(function (index) {
				const me = $(this);
				const val = production[RESOURCES[index]];
				me.css('line-height', 'normal');
				me.find('span').css('line-height', 'normal');
				me.append($(_h('br', '')));
				me.append($(_h('span', {
					text : nf(0, 0, 0, true).format(val), 'class' : 'res_value ' +
					(val > -1 ? 'undermark' : 'overmark'),
					style : {'line-height' : 'normal'}
				})));
			});
			return;
		}
		parent.find('table.material.spy tr.areadetail table td.item').each(function (index) {
			const me = $(this);
			me.css({width : 120});
			me.next().css({'text-align' : 'right'});
			const val = production[RESOURCES[index]];
			me.next().append($(_h('span', {
				text : nf().format(val), 'class' : (val > -1 ? 'undermark' : 'overmark'),
				style : {'float' : 'right', 'padding-right' : '20px', display : 'inline-block', width : '50px'}
			})));
		});
	}

	function formatSeconds(num) {
		var r = num;
		var s = r % 60;
		r = Math.floor(r / 60);
		var m = r % 60;
		r = Math.floor(r / 60);
		return r + ':' + nf(0, 2).format(m) + ":" + nf(0, 2).format(s);
	}

	function getPlanetByType(arr, planet) {
		var knownPlanet = {};
		arr.forEach(function (elem) {
			if (elem.type === planet.type) {
				knownPlanet = elem;
			}
		});
		return knownPlanet;
	}

	function handleMessage(root) {
		root.find('table.material.spy th.area').each(function () {
			var head = $(this);
			var planet = {};
			planet.position = parseCoords(head.find('a').text());
			planet.type = head.find('figure.moon').length ? 'm' : 'p';
			planet.name = getTextNodesText(head[0])[1].replace(/^\s+|\s+$/g, '');
			planet.resourcesTimeStamp = getRTS();
			Promise.all([
				_s.port.get(MESSAGES.getPlayer, {name : head.find('span:last-child').text()}),
				_s.port.get(MESSAGES.getPlanets, {position : planet.position}),
				_s.oGameI18N]).then(function (args) {
				const knownPlayer = args[0][0] || {};
				const knownPlanet = args[1][0] || {};
				const oI18n = args[2];
				const playerData = extend('', knownPlayer);
				const planetData = extend('', knownPlanet, planet);
				root.find('table.defenseattack.spy').insertAfter(root.find('table.aktiv.spy'));
				planetData.resources = parseResources();
				parseItems(playerData, planetData, oI18n);
				planetData.lf = calcLootOld();
				dspPlunder(root, planetData, playerData);
				dspButtons(root, planetData, playerData);
				if (!planetData.owner || planetData.owner !== playerData.id ||
					planetData.resourcesTimeStamp <= knownPlanet.resourcesTimeStamp) {
					return;
				}
				_s.port.send(MESSAGES.updatePlanets, planetData);
				if (JSON.stringify(knownPlayer.techs || {}) === JSON.stringify(playerData.techs || {})) {
					return;
				}
				_s.port.send(MESSAGES.updatePlayer, playerData);
			});
		});

		function calcLootOld() {
			if (root.find('table.material.spy span[class*="bandit"]').length) {
				return 1;
			}
			if (root.find('table.material.spy span.status_abbr_honorableTarget').length) {
				return 0.75;
			}
			return 0.5;
		}

		/**
		 *
		 * @returns {number}
		 */
		function getRTS() {
			var result = parseDT(root.find('div.infohead td:last-child').text());
			if (result) {
				return result.getTime();
			}
			result = parseDT(root.prev().find('td.date').text());
			if (result) {
				return result.getTime();
			}
			return null;
		}

		/**
		 *
		 * @param {*} player
		 * @param {*} planet
		 * @param {*} oI18n
		 */
		function parseItems(player, planet, oI18n) {
			const types = ['ships', 'defense', 'buildings', 'techs'];
			root.find('table.fleetdefbuildings.spy').each(function (index) {
				const table = $(this);
				var current;
				if (index < 3) {
					planet[types[index]] = {};
					current = planet[types[index]];
				} else {
					player[types[index]] = {};
					current = player[types[index]];
				}
				table.find('td.key').each(function () {
					const td = $(this);
					const id = oI18n.tbn[td.text().trim()];
					if (id) {
						current[id] = _i(td.next().text().trim().replace(/\./g, ''));
					}
				});
			});
		}

		/**
		 *
		 * @returns {*}
		 */
		function parseResources() {
			const res = ocalc.toRes(0);
			root.find('table.fragment.spy2 td:not(.item)').each(function (index) {
				res[RESOURCES[index]] = _i($(this).text().trim().replace(/\./g, ''));
			});
			return res;
		}
	}

	function handleMessages(root) {
		const me = $(root);
		me.find('tr[id^="spioDetails"]').hide().each(function () {
			handleMessage($(this));
		});
	}

	function handleMessagesV6(root) {
		const me = $(root);
		if (me.closest('div.tab_ctn').find('li#subtabs-nfFleet20.ui-state-active').length) {
			me.find('li.msg').each(function () {
				const me = $(this);
				const playerName = me.find('span.msg_content span.ctn4:first').next().text().trim();
				if (!playerName) {
					return;
				}
				const planet = {};
				const link = me.find('div.msg_head span.msg_title a.txt_link');
				if (link.text().trim().match(/(.+) \[(\d+):(\d+):(\d+)]/)) {
					planet.position = [_i(RegExp.$2), _i(RegExp.$3), _i(RegExp.$4)];
					planet.name = RegExp.$1;
					planet.type = link.find('figure.moon').length ? 'm' : 'p';
					planet.resourcesTimeStamp = parseDT(me.find('span.msg_date').text()).getTime();
					planet.detailLink = me.find('div.msg_actions a:last').prop('href');
					planet.lf = calcLoot(me);
					planet.fleetUnits = -1;
					planet.defenseUnits = -1;
					me.find('span.msg_content div.compacting:last span').each(function (index) {
						if (index === 0) {
							planet.fleetUnits = parseNumber($(this).text().trim().replace(/^.+ /, ''));
						} else if (index === 1) {
							planet.defenseUnits = parseNumber($(this).text().trim().replace(/^.+ /, ''));
						}
					});
					planet.underAttack = me.find('a span.icon_attack img').length > 0;
					Promise.all([
						_s.port.get(MESSAGES.getPlayer, {name : playerName}),
						_s.port.get(MESSAGES.getPlanets, {position : planet.position}),
						_s.planet, _s.player]).then(function (args) {
						const ownPlanet = args[2];
						const player = args[3];
						const knownPlayer = args[0][0] || {};
						const knownPlanet = getPlanetByType(args[1], planet);
						const playerData = extend('', knownPlayer);
						const planetData = extend('', knownPlanet, planet);
						if (!knownPlanet.resourcesTimeStamp ||
							planetData.resourcesTimeStamp > knownPlanet.resourcesTimeStamp) {
							planetData.newReport = true;
							planetData.resources = planetData.resources || {};
							me.find('span.resspan').each(function (index) {
								planetData.resources[RESOURCES[index]] =
									parseNumber($(this).text().trim().replace(/^.+ /, ''));
							});
						}
						planetData.deleteLink = me.find('div.msg_head a:last span');
						if (!planetData.id) {
							planetData.id = '[' + planetData.position.join(':') + ']' + planetData.type;
						}
						raidarVM.addReport(planetData, playerData, ownPlanet, player);
						if (raidarVM.visible()) {
							var h = me.find('div.msg_head');
							var c = me.find('span.msg_content');
							var a = me.find('div.msg_actions');
							var hidden = false;
							h.click(function () {
								if (hidden) {
									c.show();
									a.show();
									hidden = false;
								} else {
									c.hide();
									a.hide();
									hidden = true;
								}
							});
							h.click();
						}
					});
				}
			});
		}
	}

	function handleMessageV6(root) {
		const planet = detectPlanet(root);
		const playerName = root.find('div.detail_txt > span > span:first-child').text().trim();
		if (playerName) {
			Promise.all([
				_s.port.get(MESSAGES.getPlayer, {name : playerName}),
				_s.port.get(MESSAGES.getPlanets, {position : planet.position}),
				_s.oGameI18N]).then(function (args) {
				const knownPlayer = args[0][0] || {};
				const knownPlanet = getPlanetByType(args[1], planet);
				const oI18n = args[2];
				const playerData = extend('', knownPlayer);
				const planetData = extend('', knownPlanet, planet);
				planetData.resources = parseResources(root);
				parseItems(root, playerData, planetData, oI18n);
				if (planetData.ships[212]) {
					planetData.buildings = planetData.buildings || {};
					planetData.buildings[212] = planetData.ships[212];
				}
				planetData.lf = calcLoot(root);
				dspPlunder(root, planetData, playerData);
				dspButtons(root, planetData, playerData);
				if (!planetData.owner || planetData.owner !== playerData.id ||
					planetData.resourcesTimeStamp <= knownPlanet.resourcesTimeStamp) {
					return;
				}
				_s.port.send(MESSAGES.updatePlanets, planetData);
				if (JSON.stringify(knownPlayer.techs || {}) === JSON.stringify(playerData.techs || {})) {
					return;
				}
				_s.port.send(MESSAGES.updatePlayer, playerData);
			});
		}
	}

	function parseItems(root, player, planet, oI18n) {
		const types = ['ships', 'defense', 'buildings', 'techs'];
		root.find('div.section_title').each(function (index) {
			const me = $(this);
			if (index > 0) {
				const type = types[index - 1];
				var current;
				if (index < 4) {
					planet[type] = {};
					current = planet[type];
				} else {
					player[type] = {};
					current = player[type];
				}
				me.next().find('span.detail_list_txt').each(function () {
					const me = $(this);
					const id = oI18n.tbn[me.text().trim()];
					if (id) {
						current[id] = parseNumber(me.next().text().trim());
					}
				});
			}
		});
	}

	function parseResources(root) {
		const res = ocalc.toRes(0);
		root.find('li.resource_list_el').each(function (index) {
			const me = $(this);
			var txt = $(this).prop('title').trim();
			if (!txt) {
				txt = me.find('span.res_value').text().trim();
			}
			res[RESOURCES[index]] = parseNumber(txt);
		});
		return res;
	}

	function prepareRaidar(config) {
		raidarVM = new RaidarVM(config);
		$('div#buttonz > div.content:first').each(function () {
			var me = $(this);
			getResource('templates/raidar', 'html', false).then(function (res) {
				const html = $(res).prependTo(me);
				ko.applyBindings(raidarVM, html.get(0));
			});
		});
	}

	function RaidarVM(config) {
		const self = this;
		const ratio = calcRatio(config);
		self._ = _;
		this.visible = ko.observable(config[cfg.raidar_visible] || false);
		this.show = function () {
			toggleVisibility(true);
		};
		this.hide = function () {
			toggleVisibility(false);
		};
		this.reports = ko.observableArray().extend({rateLimit : 250});
		this.time = ko.observable(Date.now());
		const ship = config[cfg.raidar_attack_ship] ? SHIPS_BY_ID[config[cfg.raidar_attack_ship]] :
			null;

		this.addReport = function (otherPlanet, otherPlayer, planet, player) {
			if (ship && !ship.cSpeed) {
				ocalc.speed(ship, player);
			}
			var exist = false;
			this.reports().every(function (report) {
				if (otherPlanet.id && report.planet.id === otherPlanet.id) {
					if (otherPlanet.resourcesTimeStamp > report.planet.resourcesTimeStamp) {
						self.reports.remove(report);
						return false;
					}
					exist = true;
					return false;
				}
				return true;
			});
			if (!exist) {
				this.reports.push(new Report(otherPlanet, otherPlayer, planet, player, this));
				sortReports();
			}
		};
		if (config[cfg.raidar_animation]) {
			Timer.add(function () {
				if (self.visible()) {
					self.time(Date.now());
				}
				return true;
			});
		}

		function calcRatio(config) {
			const txt = config[cfg.raidar_ratio];
			const defArr = [3, 2, 1];
			var arr;
			if (txt) {
				arr = txt.replace(/,/g, '.').split(':');
				if (arr.length === 3) {
					arr.forEach(function (i) {
						arr[i] = parseFloat(arr[i]);
						if (isNaN(arr[i])) {
							arr[i] = defArr[i];
						}
					});
					return arr;
				}
			}
			return [3.5, 2, 1];
		}

		function sortReports() {
			self.reports.sort(function (a, b) {
				return b.ratio - a.ratio;
			});
		}

		function toggleVisibility(show) {
			self.visible(show);
			const store = {};
			const uni = location.host;
			store[uni] = {};
			store[uni][cfg.raidar_visible] = show;
			_s.port.send(MESSAGES.setConfig, store);
		}

		function Report(planet, otherPlayer, ownPlanet, player, parent) {
			const f = nf(0, 0, 0, true);
			const self = this;
			const production = ocalc.planetProduction(planet, otherPlayer, _s.uni);
			planet.production = ocalc.quotient(production, 3600);
			ocalc.storageCapacity(planet);
			this.metal = ko.observable();
			//noinspection JSUnusedGlobalSymbols
			this.metalProd = f.format(production.metal);
			this.crystal = ko.observable();
			//noinspection JSUnusedGlobalSymbols
			this.crystalProd = f.format(production.crystal);
			this.deuterium = ko.observable();
			//noinspection JSUnusedGlobalSymbols
			this.deuteriumProd = f.format(production.deuterium);
			this.newReport = planet.newReport;
			this.position = '[' + planet.position.join(':') + ']';
			//noinspection JSUnusedGlobalSymbols
			this.positionLink = location.href.replace(/messages/,
				'galaxy&galaxy=' + planet.position[0] + '&system=' + planet.position[1] + '&position=' +
				planet.position[2]);
			this.detailLink = planet.detailLink;
			//noinspection JSUnusedGlobalSymbols
			this.delReport = function () {
				if (planet.deleteLink.length) {
					_s.trigger(planet.deleteLink[0], 'click');
				}
				parent.reports.remove(self);
			};
			this.fleetUnits = planet.fleetUnits < 0 ? '-' : f.format(planet.fleetUnits);
			this.defenseUnits = planet.defenseUnits < 0 ? '-' : f.format(planet.defenseUnits);
			this.underAttack = planet.underAttack;

			const distance = ocalc.distance(ownPlanet.position, planet.position, _s.uni);
			const fTime = ship ? ocalc.flightTime(distance, [ship], player, _s.uni) : 0;

			this.ships = ko.observable(0);

			//noinspection JSUnusedGlobalSymbols
			this.attackLink = ko.computed(function () {
				var param = '';
				if (this.ships()) {
					param = '&am' + ship.id + '=' + this.ships();
				}
				return location.href.replace(/\?page=.+$/,
					'?page=fleet1&galaxy=' + planet.position[0] + '&system=' + planet.position[1] +
					'&position=' + planet.position[2] + '&type=' + (planet.type === 'm' ? 3 : 1) +
					'&mission=1' + param);
			}, this);

			this.age = ko.computed(function () {
				const dt = (parent.time() - planet.resourcesTimeStamp - _s.deltaT) / 1000;
				const delta = dt + fTime;
				const resources = ocalc.resources(planet, delta);
				const m = Math.floor(resources.metal * planet.lf);
				const c = Math.floor(resources.crystal * planet.lf);
				const d = Math.floor(resources.deuterium * planet.lf);
				const s = m + c + d;
				if (ship) {
					this.ships(Math.ceil(s / ship.cap));
				}
				this.ratio = m / ratio[0] + c / ratio[1] + d / ratio[2];
				this.metal(f.format(m));
				this.crystal(f.format(c));
				this.deuterium(f.format(d));
				sortReports();
				return formatSeconds(dt);
			}, this);
			this.planet = planet;
		}
	}

})(Skynet);

/* global self, chrome, $, ko, _, _h, getResource, Promise, MessageBus, MESSAGES,
 extend, OFFICERS, formatDate, Q, _i, PAGES, ocalc, Timer, NF, formatTime, RESOURCES, parseCoords,
 TECHS_BY_ID */
/* exported Skynet */

const Skynet = (function () {
	var dlg, script;
	//noinspection JSUnresolvedVariable
	const settings = ko.observableArray().extend({rateLimit : 50});
	const _s = {
		VERSION : self.options && self.options.version || chrome.runtime.getManifest().version_name,
		actions : {
			sendFleet : sendFleet
		},
		addSettings : addSettings,
		history : [],
		lang : '',
		load : ko.observable(),
		loadTS : new Date(),
		renderHTMLTooltip : renderHTMLTooltip,
		trigger : trigger,
		uni : {
			donutGalaxy : 0,
			donutSystem : 0,
			galaxies : 9,
			speed : 1,
			speedFleet : 1,
			systems : 499
		},
		utils : {}
	};
	_s.port = new MessageBus();
	_s.port.get(MESSAGES.uniData).then(function (uniData) {
		_s.uni = extend(_s.uni, uniData);
	});
	_s.config = new Promise(function (resolve) {
		_s.port.once(MESSAGES.getConfig).then(function (config) {
			var defaultChanged = false;
			const store = {};
			settings().forEach(function (setting) {
				if (config[setting.key] === undefined && setting.def !== undefined) {
					if (!setting.scope) {
						store[setting.key] = setting.def;
					} else if (setting.scope === 'uni') {
						const uni = location.host;
						store[uni] = config[uni] || {};
						store[uni][setting.key] = setting.def;
					}
					defaultChanged = true;
				}
			});
			if (defaultChanged) {
				_s.page.then(function () {
					_s.port.post(MESSAGES.setConfig, store).then(function () {
						location.reload();
					});
				});
			}
			resolve(config);
		});
	});
	_s.page = new Promise(pageLoaded);
	_s.oGameI18N = new Promise(function (resolve) {
		_s.port.get(MESSAGES.oGameI18N).then(function (oI18n) {
			Object.keys(TECHS_BY_ID).forEach(function (elem) {
				TECHS_BY_ID[elem].name = oI18n.t[elem];
			});
			resolve(oI18n);
		});
	});
	_s.player = new Promise(function (resolve) {
		Promise.all([_s.page, _s.port.once(MESSAGES.getPlayer), _s.config,
			_s.oGameI18N]).then(function (args) {
			const id = $("meta[name='ogame-player-id']").prop('content');
			new Promise(function (resolve) {
				if (args[1] && args[1].id === id) {
					resolve(args[1]);
					return;
				}
				_s.port.get(MESSAGES.getPlayer, {id : id}).then(function (player) {
					resolve(player);
				});
			}).then(function (player) {
					const p = extend(player, detectPlayer());
					if (args[0] === 'research') {
						p.techs = extend(p.techs, detectItems());
					}
					detectEvents(p, args[2], args[3]);
					_s.port.send(MESSAGES.updatePlayer, p);
					resolve(p);
				});
		});
	});
	_s.planets = {};
	_s.planet = new Promise(function (resolve) {
		Promise.all([_s.page, _s.port.once(MESSAGES.getPlanets)]).then(function (args) {
			const page = args[0];
			if (page !== 'empire') {
				const owner = $("meta[name='ogame-player-id']").prop('content');
				new Promise(function (resolve) {
					if (args[1] && Array.isArray(args[1]) && args[1].length > 0 &&
						args[1][0].owner === owner) {
						resolve(args[1]);
						return;
					}
					_s.port.get(MESSAGES.getPlanets, {owner : owner}).then(function (planets) {
						resolve(planets);
					});
				}).then(function (planets) {
						detectPlanets(page, planets, resolve);
					});
			}
		});
	});
	const cvm = new ConfigurationViewModel();
	const cfg = {
		skynet_active : 'feature.active',
		color_hint : 'color.hint',
		color_problem : 'color.problem',
		color_timer : 'color.timer',
		change_layout : 'change.layout',
		change_layout_planetlist : 'change.layout.planetlist',
		show_summary : 'show.summary',
		enhance_eventlist : 'enhance.eventlist',
		collapse_header : 'collapse.header',
		current_summary : 'current.summary'
	};
	const cfg_def = [
		{key : cfg.skynet_active, label : 'activate skynet', type : 'boolean', def : true, cat : 'general', scope : 'uni'},
		{key : cfg.color_hint, label : 'hint', type : 'color', def : '#a0a0ff', cat : 'colors'},
		{key : cfg.color_problem, label : 'problem', type : 'color', def : '#ff0000', cat : 'colors'},
		{key : cfg.color_timer, label : 'timer', type : 'color', def : '#00bb00', cat : 'colors'},
		{key : cfg.change_layout, label : 'change layout', type : 'boolean', def : false, cat : 'layout'},
		{key : cfg.change_layout_planetlist, label : 'change planet list layout', type : 'boolean', def : true, cat : 'layout'},
		{key : cfg.show_summary, label : 'show summary', type : 'boolean', def : true, cat : 'layout'},
		{key : cfg.enhance_eventlist, label : 'enhance event list', type : 'boolean', def : true, cat : 'layout'},
		{key : cfg.collapse_header, label : 'collapse header', type : 'boolean', def : true, cat : 'layout'},
		{key : cfg.current_summary, cat : 'hidden', scope : 'uni'}
	];
	_s.addSettings(cfg_def);

	Promise.all([_s.page, _s.config]).then(function (args) {
		const page = args[0];
		const config = args[1];
		if (config[cfg.change_layout_planetlist]) {
			const x = $('#rechts');
			x.find('div.smallplanet a.constructionIcon').each(function () {
				const me = $(this);
				const allCons = me.parent().find('a.constructionIcon');
				if (allCons.length === 2 && me.prop('class').indexOf('moon') < 0) {
					const w = allCons.eq(0).find('span.icon_wrench');
					me.find('span.icon_wrench').text(me.prop('title') + ', ' + w.text());
					//noinspection JSValidateTypes
					w.text('').parent().css({top : '15px', left : '120px'});
				} else {
					me.find('span.icon_wrench').text(me.prop('title'));
				}
			});
		}
		if (config[cfg.collapse_header] &&
			page.match(/^(?:messages|alliance|fleet1|fleet2|fleet3|movement)$/)) {
			collapseHeader();
		}
	});

	Promise.all([_s.player, _s.planet, _s.page]).then(function (args) {
		_s.port.send(MESSAGES.pageLoaded, {
			currentPlayer : args[0], currentPlanet : args[1], currentPage : args[2]
		});
	});

	Promise.all([_s.page, _s.config, _s.player, _s.planet]).then(function (args) {
		const config = args[1];
		if (args[0] === PAGES.overview && config[cfg.show_summary]) {
			showSummarySmall(config, args[2], args[3]);
		}
	});

	return _s;

	function addSettings(cfg_def) {
		settings().push.apply(settings(), cfg_def);
		settings.valueHasMutated();
	}

	function collapseHeader() {
		$('#planet:not(.shortHeader)').each(function () {
			try {
				_s.trigger(Q(this, 'a.toggleHeader'), 'click');
			} catch (e) {
				console.error(e);
			}
			setTimeout(collapseHeader, 10);
		});
	}

	function detectCurrentTasks(planet) {
		var tasks = {};
		const scr = getScript();
		var countdowns = {
			production : function () {
				if (scr.match(/Countdown\(getElementByIdWithCache.*?"Countdown".*?(\d+)/)) {
					return _s.ogameTS.getTime() + _i(RegExp.$1) * 1000;
				}
				return -1;
			},
			research : function () {
				if (scr.match(/Countdown\(getElementByIdWithCache.*?"researchCountdown".*?(\d+)/)) {
					return _s.ogameTS.getTime() + _i(RegExp.$1) * 1000;
				}
				return -1;
			},
			shipyard : function () {
				if (scr.match(/shipCountdown\((?:.*?\)){3}(?:.*?(\d+)){3}/)) {
					return _s.ogameTS.getTime() + _i(RegExp.$1) * 1000;
				}
				return -1;
			}
		};
		var keys = ['production', 'research', 'shipyard'];
		$('div.content-box-s').each(function (index) {
			var me = $(this);
			var td = me.find('td.first, td.building');
			var key;
			if (td.length === 1) {
				var a = td.find('a:first');
				var code = a.attr('onclick');
				if (code.match(/^cancel(.+)\((\d+),/)) {
					key = RegExp.$1.toLowerCase();
					tasks[key] = {
						id : RegExp.$2,
						end : countdowns[key]()
					};
					if (key === 'research' && code.match(/.+?\[(.+?)]\?/)) {
						if (JSON.stringify(planet.position) !== JSON.stringify(parseCoords(RegExp.$1))) {
							tasks[key] = {
								id : RegExp.$2,
								end : countdowns[key](),
								dns : true
							};
						}
					}
				} else if (a.prop('href').match(/openTech=(\d+)$/)) {
					key = keys[2];
					tasks[key] = {
						id : RegExp.$1,
						end : countdowns[key]()
					};
				}
				me.find('td.timer, td.timeProdAll').append($('<br>')).append($('<span>', {
					text : formatDate(new Date(tasks[key].end)),
					'class' : 'skynet_c_timer'
				}));
			} else {
				delete tasks[keys[index]];
			}
			if (tasks[key] && tasks[key].dns) {
				delete tasks[key];
			}
		});
		return tasks;
	}

	/**
	 *
	 * @param {*} player
	 * @param {{}} config
	 * @param {{tbn:{}}} oI18n
	 */
	function detectEvents(player, config, oI18n) {
		const elw = $('#eventListWrap');
		const events = [];
		elw.find('tr').each(function () {
			const row = $(this);
			const event = {
				mission : row.attr('data-mission-type'),
				arrival : _i(row.attr('data-arrival-time') + '000'),
				rF : row.attr('data-return-flight') === 'true',
				origin : parseCoords(row.find('td.coordsOrigin a').text()),
				dest : parseCoords(row.find('td.destCoords a').text()),
				attitude : row.find('td.neutral').length ? 1 : row.find('td.hostile').length ? 2 : 0,
				fleet : [],
				res : {}
			};
			const html = row.find('td.icon_movement span.tooltip, td.icon_movement_reserve span.tooltip').prop('title');
			const arr = html ? html.match(/<tr>([\S\s]+?)<\/tr>/g) : [];
			var rs = 0;
			arr.forEach(function (tr, i) {
				if (i > 0 && !rs && tr.match(/<td>(.+?):[\S,\s]+?"value">(.+?)</)) {
					const type = RegExp.$1;
					const count = _i(RegExp.$2.replace(/\D/g, ''));
					event.fleet.push({id : oI18n.tbn[type], name : type, count : count});
				} else if (i > 0 && tr.indexOf('th') > -1) {
					rs = i;
				} else if (i > 0 && rs && tr.match(/<td>[\S,\s]+?"value">(.+?)</)) {
					event.res[RESOURCES[i - rs - 1]] = _i(RegExp.$1.replace(/\D/g, ''));
				}
			});
			events.push(event);
			if (config[cfg.enhance_eventlist]) {
				var opacity = '';
				if (event.rF) {
					opacity = 0.5;
					row.css({
						opacity : opacity
					});
				}
				var detailRow = $('<tr>', {'class' : 'skynet'});
				row.after(detailRow);
				if (opacity) {
					row.css('opacity', opacity);
					detailRow.css('opacity', opacity);
				}
				detailRow.append($('<td>',
					{text : row.find('td.missionFleet img').prop('title').replace(/^.+?\|/, '')}));
				detailRow.append($('<td>', {colspan : 10, html : getDetails(event)}));
				Timer.add(function () {
					var now = new Date();
					if (now.getTime() >= event.arrival + 1000) {
						detailRow.hide('slow', function () {
							$(this).remove();
						});
						return false;
					}
					return true;
				});
			}
		});
		player.events = events;

		function getDetails(event) {
			var result = '';
			event.fleet.forEach(function (elem) {
				result += (result ? ', ' : '') + elem.name + ': ' + (isNaN(elem.count) ? '?' : elem.count);
			});
			var res = '';
			var hasRes = false;
			Object.keys(event.res).forEach(function (key) {
				const r = event.res[key];
				if (r > 0) {
					hasRes = true;
				}
				res += (res ? ', ' : '') + _(key) + ': ' + NF.D0.format(r);
			});
			if (hasRes) {
				result += '<br>' + res;
			}
			return result;
		}
	}

	/**
	 *
	 * @returns {{}}
	 */
	function detectItems() {
		const items = {};
		$('#buttonz').find('div.buildingimg').each(function () {
			const me = $(this);
			var id = me.find('a[ref]').attr('ref');
			if (!id) {
				id = me.next().prop('id').replace(/\D/g, '');
			}
			items[id] = _i(me.find('span.level').text().replace(/\D/g, ''));
		});
		return items;
	}

	function detectPlanetDetails(planet, page) {
		detectResources(planet);
		planet.resourcesTimeStamp = _s.ogameTS.getTime();
		if (page.match(/^(?:overview|resources|research|defense|shipyard|station)$/)) {
			planet.currentTasks = detectCurrentTasks(planet);
		}
		if (page === 'defense') {
			planet.defense = extend(planet.defense, detectItems());
		}
		if (page === 'resources') {
			planet.buildings = extend(planet.buildings, detectItems());
		}
		if (page === 'shipyard' || page === 'fleet1') {
			planet.ships = extend(planet.ships, detectItems());
		}
		if (page === 'station') {
			planet.buildings = extend(planet.buildings, detectItems());
		}
		_s.port.send(MESSAGES.updatePlanets, planet);
	}

	/**
	 *
	 * @param {string} page
	 * @param {[]} planets
	 * @param {Function} resolve
	 */
	function detectPlanets(page, planets, resolve) {
		const pCache = {};
		$('#planetList').find('a.planetlink, a.moonlink').each(function () {
			const me = $(this);
			if (me.prop('href').match(/.+cp=(\d+)(?:$|&|#)/)) {
				const id = RegExp.$1;
				pCache[id] = {
					id : id
				};
				if (me.prop('title').match(/<B>(.+?)\s\[(.+?)].+?\((.+?)\/(.+?)\)(?:<BR>(-?\d+).+?(-?\d+))*/)) {
					pCache[id].name = RegExp.$1;
					pCache[id].position = parseCoords(RegExp.$2);
					pCache[id].fields = [_i(RegExp.$4), _i(RegExp.$3)];
					pCache[id].type = me.hasClass('moonlink') ? 'm' : 'p';
					//noinspection JSUnresolvedVariable
					if (RegExp.$5 && RegExp.$6) {
						pCache[id].minTemp = _i(RegExp.$5);
						//noinspection JSUnresolvedVariable
						pCache[id].maxTemp = _i(RegExp.$6);
					}
				}
			}
		});
		_s.player.then(function (player) {
			const id = $("meta[name='ogame-planet-id']").prop('content');
			const planets2Delete = [];
			planets.forEach(function (planet) {
				const p = pCache[planet.id];
				delete pCache[planet.id];
				if (p) {
					const cp = extend(planet, p);
					cp.owner = player.id;
					Skynet.planets[cp.id] = cp;
					if (cp.id === id) {
						detectPlanetDetails(cp, page);
						resolve(cp);
					}
				} else {
					planets2Delete.push(planet.id);
				}
			});
			// new planets, that are not in the DB yet
			Object.keys(pCache).forEach(function (key) {
				const cp = pCache[key];
				cp.owner = player.id;
				Skynet.planets[cp.id] = cp;
				if (cp.id === id) {
					detectPlanetDetails(cp, page);
					resolve(cp);
				}
			});
			if (planets2Delete.length) {
				Skynet.port.send(MESSAGES.deletePlanets, planets2Delete);
			}
		});
	}

	function detectPlayer() {
		var player = {
			id : $("meta[name='ogame-player-id']").prop('content'),
			name : $("meta[name='ogame-player-name']").prop('content'),
			officers : 0
		};
		$('#officers').find('a.on').each(function () {
			var rx = new RegExp("(" + OFFICERS.join('|') + ")");
			if ($(this).prop('class').match(rx)) {
				player.officers = player.officers | Math.pow(2, OFFICERS.indexOf(RegExp.$1));
			}
		});
		return player;
	}

	/**
	 *
	 * @param {*} planet
	 */
	function detectResources(planet) {
		const scr = getScript();
		if (scr.match(/initAjaxResourcebox.+?metal.+?actual":(.+?),.+?crystal.+?actual":(.+?),.+?deuterium.+?actual":(.+?),/)) {
			planet.resources =
			{metal : _i(RegExp.$1), crystal : _i(RegExp.$2), deuterium : _i(RegExp.$3)};
		}
		if (scr.match(/initAjaxResourcebox.+?metal.+?production":(.+?)}.+?crystal.+?production":(.+?)}.+?deuterium.+?production":(.+?)}/)) {
			planet.production =
			{metal : parseFloat(RegExp.$1), crystal : parseFloat(RegExp.$2), deuterium : parseFloat(RegExp.$3)};
		}
		if (scr.match(/initAjaxResourcebox.+?metal.+?max":(.+?),.+?crystal.+?max":(.+?),.+?deuterium.+?max":(.+?),/)) {
			planet.storage = {metal : _i(RegExp.$1), crystal : _i(RegExp.$2), deuterium : _i(RegExp.$3)};
		}
	}

	function getScript() {
		if (script) {
			return script;
		}
		$('script:not([src])').each(function () {
			script += $(this).html();
		});
		return script;
	}

	function openDialog() {
		if (dlg) {
			dlg.dialog('open');
			return;
		}

		getResource('templates/dialog', 'html', false).then(function (res) {
			dlg = $(res).dialog({
				autoOpen : false,
				buttons : [
					{
						text : _('reset_config'),
						click : function () {
							_s.port.post(MESSAGES.setConfig, 'reset').then(function () {
								location.reload();
							});
						}
					},
					{
						'class' : 'btnSave',
						css : {'float' : 'right'},
						'data-bind' : 'css: {\'ui-state-hover\': hasChanged()}',
						text : _('save'),
						click : function () {
							cvm.save();
							dlg.dialog('close');
						}
					},
					{
						css : {'float' : 'right'},
						text : _('cancel'),
						click : function () {
							$(this).dialog('close');
						}
					}
				],
				css_scope : 'skynet',
				create : function () {
					ko.applyBindings(cvm, $('#SkynetDialog').parent()[0]);
				},
				height : 700,
				open : function () {
					const me = $(this);
					me.find('.ui-accordion-content').css({
						height : ''
					});
					me.find('.nano').nanoScroller();
				},
				width : 750,
				title : _('DialogTitle', [_('ExtensionName'), _s.VERSION])
			}).tabs({
				activate : function (event, ui) {
					ui.newPanel.find('.nano').nanoScroller();
				}
			});
			$('#SkynetDialog-1').find('div.nano-content').accordion({
				activate : function (event, ui) {
					ui.newPanel.closest('.nano').nanoScroller();
				}
			});
			dlg.dialog('open');
		});
	}

	function pageLoaded(resolve) {
		if (location.href.match(/.+\/game\/index\.php(?:(?:\?page|.*?&page)=(.+?)(?:#|&|$)|$)/)) {
			const p = (RegExp.$1 || 'overview').toLowerCase();
			_s.config.then(function (_c) {
				$(function () {
					if (_c[cfg.skynet_active]) {
						_s.lang = $('meta[name="ogame-language"]').prop('content');
						_s.ogameVersion = $('meta[name="ogame-version"]').prop('content');
						const script = getScript();
						const m = script.match(/var serverTime=new Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\);/);
						if (m) {
							_s.ogameTS =
								new Date(m[1], m[2], m[3], m[4], m[5], m[6]);
						} else {
							_s.ogameTS =
								new Date(_i($('meta[name="ogame-timestamp"]').prop('content') + '000'));
						}
						_s.deltaT = _s.loadTS.getTime() - _s.ogameTS.getTime();
						_s.uni.donutGalaxy = $('meta[name="ogame-donut-galaxy"]').prop('content') === '1';
						_s.uni.donutSystem = $('meta[name="ogame-donut-system"]').prop('content') === '1';
						_s.uni.speed = _i($('meta[name="ogame-universe-speed"]').prop('content'));
						_s.uni.speedFleet = _i($('meta[name="ogame-universe-speed-fleet"]').prop('content'));
						resolve(p);
					}
					if (p !== 'empire') {
						$('#menuTableTools').append(_h('li', '',
							['span', {
								'class' : 'menu_icon skynet_icon', style : {
									'-webkit-filter' : _c[cfg.skynet_active] ? '' : 'grayscale(75%)',
									filter : _c[cfg.skynet_active] ? '' : 'grayscale(75%)'
								}
							}],
							['a', {id : 'skynet_menu_setup', 'class' : 'menubutton', href : '#'},
								['span', {
									'class' : 'textlabel', text : _('DialogTitle', [_('ExtensionName'), ''])
								}]]));
						$('#skynet_menu_setup').click(openDialog);
					}
				});
			});
		}
	}

	/**
	 *
	 * @param {string} title
	 * @param {[]} lines
	 * @param parent
	 */
	function renderHTMLTooltip(title, lines, parent) {
		const out = [_(title) + ':|<table class="resourceTooltip">'];
		lines.forEach(function (line) {
			out.push(_h('tr', '', ['th', {text : line.h}], ['td', {text : line.v, 'class' : line.c}]));
		});
		out.push('</table>');
		parent.prop('title', out.join('\n'));
	}

	/**
	 *
	 * @param {[]} fleet
	 * @param {[]} position
	 * @param {number} mission
	 * @param {boolean} [send]
	 */
	function sendFleet(fleet, position, mission, send) {
		if (position) {
			if (position[0]) {
				$('[name=galaxy]').val(position[0]);
			}
			if (position[1]) {
				$('[name=system]').val(position[1]);
			}
			if (position[2]) {
				$('[name=position]').val(position[2]);
			}
			if (position[3] === "m") {
				$('[name=type]').val(3);
			} else {
				$('[name=type]').val(1);
			}
		}
		if (mission) {
			$('[name=mission]').val(mission);
		}
		fleet.forEach(function (type) {
			const input = $('#ship_' + type.ref);
			input.val(type.amount);
			trigger(input[0], 'change');
		});
		const cont = $('#continue');
		cont.focus();
		if (send) {
			trigger(cont[0], 'click');
		}
	}

	function showSummarySmall(config, player, planet) {
		$('#planetdata').css({'margin-top' : 145});
		getResource('templates/summary', 'html', false).then(function (res) {
			const html = _(true, res, {
				planet : _('planet'),
				'overall resources' : _('overall resources'),
				'overall production' : _('overall production'),
				metal : _('metal'),
				crystal : _('crystal'),
				deuterium : _('deuterium'),
				production : _('production'),
				available : _('available'),
				storage : _('storage'),
				'storage cap reached' : _('storage cap reached'),
				stationary : _('stationary'),
				transit : _('transit'),
				overall : _('overall'),
				'per hour' : _('per hour'),
				'per day' : _('per day'),
				'per week' : _('per week'),
				'rate' : _('rate')
			});
			$('#planet').append($(html));
			ko.applyBindings(new SummaryViewModel(config, player, planet), Q('#skynet_summary'));
		});
	}

	function trigger(elem, type) {
		var evt = null;
		if (type === 'click') {
			evt = new MouseEvent(type, {bubbles : true, cancelable : true});
		} else if (type === 'change') {
			//noinspection JSClosureCompilerSyntax
			evt = new Event(type, {bubbles : true});
		}
		if (elem && evt) {
			elem.dispatchEvent(evt);
		}
	}

	function ConfigurationViewModel() {
		var self = this;
		this.cSet = {};
		var config;
		_s.config.then(function (cfg) {
			config = cfg;
		});
		this.tester = [
			{name : 'NoMoreAngel', link : 'http://board.origin.ogame.gameforge.com/user/8582-nomoreangel/'},
			{name : 'Vanger'},
			{name : 'w0mBaT'},
			{name : 'BuEnO'}
		];
		this.translator = [
			{
				lang : 'Hungarian', details : '<a href="http://board.origin.ogame.gameforge.com/user/9094-norand/" target="_blank">Norand</a>' +
			' &amp; <a href="http://board.hu.ogame.gameforge.com/user/1495-peti258/" target="_blank">Peti</a>'
			},
			{lang : 'Italian', details : '<a href="http://board.it.ogame.gameforge.com/user/139835-scappe/" target="_blank">Scappe</a>'},
			{lang : 'Polish', details : 'Greg'},
			{lang : 'Portuguese', details : '<a href="http://board.pt.ogame.gameforge.com/user/112319-maxpayne/" target="_blank">MaxPayne</a>'},
			{lang : 'Spanish', details : 'Sora'},
			{lang : 'Swedish', details : '<a href="http://board.origin.ogame.gameforge.com/user/8777-henkeg/" target="_blank">HenkeG</a>'}
		];
		this.history = _s.history;

		function addSetting(cat, setting) {
			var doAdd = true;
			self.cSet[cat] = self.cSet[cat] || [];
			self.cSet[cat].every(function (elem) {
				if (elem.key === setting.key) {
					doAdd = false;
					return false;
				}
				return true;
			});
			if (doAdd) {
				self.cSet[cat].push(new Config(setting, config[setting.key]));
			}
		}

		//noinspection JSUnusedGlobalSymbols
		this.categories = ko.pureComputed(function () {
			var result = ['general', 'layout', 'colors', 'fleet', 'galaxy', 'other'];
			settings().forEach(function (/* object */ setting) {
				var cat = setting.cat;
				if (!cat) {
					cat = 'other';
				} else if (cat === 'hidden') {
					return;
				} else if (result.indexOf(cat) < 0) {
					result.splice(result.length - 2, 0, cat);
				}
				addSetting(cat, setting);
			});
			return result;
		}, this);

		//noinspection JSUnusedGlobalSymbols
		this._ = _;

		//noinspection JSUnusedGlobalSymbols
		this.hasChanged = ko.pureComputed(function () {
			var changed = false;
			Object.keys(this.cSet).every(function (key) {
				var arr = self.cSet[key];
				for (var i = 0; i < arr.length; i++) {
					var elem = arr[i];
					if (elem.isChanged()) {
						changed = true;
						return false;
					}
				}
				return true;
			});
			return changed;
		}, this);

		this.save = function () {
			var doSave, store = {};
			Object.keys(self.cSet).forEach(function (key) {
				var arr = self.cSet[key];
				for (var i = 0; i < arr.length; i++) {
					var elem = arr[i];
					if (elem.isChanged()) {
						doSave = true;
						if (!elem.scope) {
							store[elem.key] = elem.value();
						} else if (elem.scope === 'uni') {
							const uni = location.host;
							store[uni] = store[uni] || {};
							store[uni][elem.key] = elem.value();
						}
					}
				}
			});
			if (doSave) {
				_s.port.post(MESSAGES.setConfig, store).then(function () {
					location.reload();
				});
			}
		};

		function Config(setting, config) {
			this.label = setting.label;
			this.type =
				!setting.type || !setting.type.match(/^(?:boolean|select|number|color)$/) ? 'text' :
					setting.type;
			this.key = setting.key;
			this.value = ko.observable(config === undefined ? setting.def :
				config).extend({trackChanges : {initial : config === undefined}});
			this.scope = setting.scope || '';
			//noinspection JSUnusedGlobalSymbols
			this.getOptions = function () {
				if (setting.dataSrc && typeof setting.dataSrc === 'function') {
					return setting.dataSrc();
				}
				return setting.dataSrc || [];
			};
			this.isChanged = ko.computed(function () {
				return this.value.isChanged();
			}, this);
		}
	}

	function SummaryViewModel(config, player, planet) {
		const SUMMARY_TYPES = ['planet', 'resources', 'production'];
		var self = this;
		var _res = planet.resources;
		var _resTra;
		//noinspection JSUnusedGlobalSymbols
		this.prod = ocalc.format(ocalc.product(planet.production, 3600), NF.D0);
		this.res = {
			metal : ko.observable(),
			crystal : ko.observable(),
			deuterium : ko.observable()
		};
		//noinspection JSUnusedGlobalSymbols
		this.sto = ocalc.format(planet.storage, NF.D0);
		this.stoCap = {
			metal : ko.observable(),
			crystal : ko.observable(),
			deuterium : ko.observable()
		};
		this.resStat = {
			metal : ko.observable(),
			crystal : ko.observable(),
			deuterium : ko.observable()
		};
		this.sta = {
			metal : ko.observable(),
			crystal : ko.observable(),
			deuterium : ko.observable()
		};
		this.tra = {
			metal : ko.observable(),
			crystal : ko.observable(),
			deuterium : ko.observable()
		};
		this.resOv = {
			metal : ko.observable(),
			crystal : ko.observable(),
			deuterium : ko.observable()
		};
		this.prodH = {
			metal : ko.observable(),
			crystal : ko.observable(),
			deuterium : ko.observable()
		};
		this.prodD = {
			metal : ko.observable(),
			crystal : ko.observable(),
			deuterium : ko.observable()
		};
		this.prodW = {
			metal : ko.observable(),
			crystal : ko.observable(),
			deuterium : ko.observable()
		};
		this.rate = {
			metal : ko.observable(),
			crystal : ko.observable(),
			deuterium : ko.observable()
		};

		//noinspection JSUnusedGlobalSymbols
		this.cP = ko.observable(config[cfg.current_summary] || SUMMARY_TYPES[0]);

		this.toggle = function (model, evt) {
			const target = $(evt.currentTarget);
			var index = SUMMARY_TYPES.indexOf(this.cP());
			if (target.hasClass('ui-icon-arrowthick-1-w')) {
				index--;
			} else {
				index++;
			}
			if (index < 0) {
				index = SUMMARY_TYPES.length - 1;
			} else if (index > SUMMARY_TYPES.length - 1) {
				index = 0;
			}
			this.cP(SUMMARY_TYPES[index]);
			const store = {};
			const uni = location.host;
			store[uni] = store[uni] || {};
			store[uni][cfg.current_summary] = SUMMARY_TYPES[index];
			_s.port.send(MESSAGES.setConfig, store);
		};

		calcResources();
		Timer.add(calcResources);
		calcCap();
		Timer.add(calcCap);
		calcResOv(true);
		Timer.add(calcResOv);
		calcProd();
		Timer.add(calcProd);

		function calcCap() {
			Object.keys(planet.storage).forEach(function (key) {
				const seconds = (planet.storage[key] - _res[key]) / planet.production[key];
				self.stoCap[key](formatTime(seconds));
			});
			return true;
		}

		function calcProd() {
			var op = null;
			Object.keys(_s.planets).forEach(function (key) {
				const pl = _s.planets[key];
				if (!pl.resourcesTimeStamp) {
					return;
				}
				op = ocalc.sum(op, pl.production);
			});
			const pH = ocalc.product(op, 3600);
			const pD = ocalc.product(pH, 24);
			const pW = ocalc.product(pD, 7);
			const h = ocalc.format(pH, NF.D0);
			self.prodH.metal(h.metal);
			self.prodH.crystal(h.crystal);
			self.prodH.deuterium(h.deuterium);
			const d = ocalc.format(pD, NF.D0);
			self.prodD.metal(d.metal);
			self.prodD.crystal(d.crystal);
			self.prodD.deuterium(d.deuterium);
			const w = ocalc.format(pW, NF.D0);
			self.prodW.metal(w.metal);
			self.prodW.crystal(w.crystal);
			self.prodW.deuterium(w.deuterium);
			const r = ocalc.format(ocalc.quotient(op, op.deuterium), NF.D2);
			self.rate.metal(r.metal);
			self.rate.crystal(r.crystal);
			self.rate.deuterium(r.deuterium);
			return true;
		}

		function calcResources() {
			const now = new Date();
			const delta = (now.getTime() - planet.resourcesTimeStamp - _s.deltaT) / 1000;
			_res = ocalc.resources(planet, delta);
			const r = ocalc.format(_res, NF.D0);
			self.res.metal(r.metal);
			self.res.crystal(r.crystal);
			self.res.deuterium(r.deuterium);
			self.resStat.metal(_res.metal >= planet.storage.metal ? 'overmark' : 'undermark');
			self.resStat.crystal(_res.crystal >= planet.storage.crystal ? 'overmark' : 'undermark');
			self.resStat.deuterium(_res.deuterium >= planet.storage.deuterium ? 'overmark' : 'undermark');
			return true;
		}

		function calcResOv(first) {
			const now = new Date();
			var r = null;
			Object.keys(_s.planets).forEach(function (key) {
				const pl = _s.planets[key];
				if (!pl.resourcesTimeStamp) {
					return;
				}
				const delta = (now.getTime() - pl.resourcesTimeStamp) / 1000;
				r = ocalc.sum(r, ocalc.resources(pl, delta));
			});
			const t = ocalc.format(r, NF.D0);
			self.sta.metal(t.metal);
			self.sta.crystal(t.crystal);
			self.sta.deuterium(t.deuterium);
			if (first) {
				player.events.forEach(function (/*{}*/ event) {
					if (event.mission !== '4' && event.rF) {
						_resTra = ocalc.sum(_resTra, event.res);
					} else if (event.mission === '4' || event.attitude === 'neutral') {
						_resTra = ocalc.sum(_resTra, event.res);
					}
				});
				if (!_resTra) {
					_resTra = ocalc.toRes(0);
				}
				const resFormatted = ocalc.format(_resTra, NF.D0);
				self.tra.metal(resFormatted.metal);
				self.tra.crystal(resFormatted.crystal);
				self.tra.deuterium(resFormatted.deuterium);
			}
			const resOvFormatted = ocalc.format(ocalc.sum(r, _resTra), NF.D0);
			self.resOv.metal(resOvFormatted.metal);
			self.resOv.crystal(resOvFormatted.crystal);
			self.resOv.deuterium(resOvFormatted.deuterium);
			return true;
		}
	}
})();
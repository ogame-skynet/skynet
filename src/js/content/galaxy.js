/* global $, Q, Skynet, _i, MESSAGES, extend, STATUS, hexToRgb, nf */

(function (_s) {
	const cfg = {
		galaxy_show_stats : 'galaxy.show.stats',
		change_layout_galaxy_rows : 'change.layout.galaxy.rows',
		galaxy_row_height : 'galaxy.row.height',
		galaxy_mark_debris : 'galaxy.mark.debris',
		galaxy_debris_size : 'galaxy.debris.size',
		galaxy_debris_color : 'galaxy.debris.color',
		galaxy_mark_position : 'galaxy.mark.position',
		galaxy_mark_position_color : 'galaxy.mark.position.color'
	};
	const cfg_def = [
		{key : cfg.galaxy_show_stats, label : 'galaxy show stats', type : 'boolean', def : true, cat : 'galaxy'},
		{key : cfg.change_layout_galaxy_rows, label : 'change galaxy rows', type : 'boolean', def : true, cat : 'galaxy'},
		{key : cfg.galaxy_row_height, label : 'galaxy row size', type : 'number', def : 28, cat : 'galaxy'},
		{key : cfg.galaxy_mark_debris, label : 'mark debris', type : 'boolean', def : true, cat : 'galaxy'},
		{key : cfg.galaxy_debris_size, label : 'debris size', type : 'number', def : 10000, cat : 'galaxy', scope : 'uni'},
		{key : cfg.galaxy_debris_color, label : 'debris color', type : 'color', def : '#ff0000', cat : 'galaxy'},
		{key : cfg.galaxy_mark_position, label : 'mark position in galaxy', type : 'boolean', def : true, cat : 'galaxy'},
		{key : cfg.galaxy_mark_position_color, label : 'position in galaxy color', type : 'color', def : '#770077', cat : 'galaxy'}
	];
	_s.addSettings(cfg_def);

	_s.page.then(function (page) {
		if (page === 'galaxy') {
			const observer = new MutationObserver(function (mutations) {
				mutations.forEach(function (mutation) {
					for (var i = 0; i < mutation.addedNodes.length; i++) {
						if (mutation.addedNodes[i].id === 'mobileDiv') {
							galaxyChanged(mutation.addedNodes[i]);
						}
					}
				});
			});
			observer.observe(Q('#galaxyContent'), {
				childList : true
			});
		}
	});

	function checkPlanets() {
		const coords = [_i($('#galaxy_input').val()), _i($('#system_input').val()), 0];
		Promise.all([_s.player, _s.port.get(MESSAGES.getPlanets, {
			position : {lower : coords, upper : [coords[0], coords[1], 16]}
		})]).then(function (args) {
			const currentPlayer = args[0];
			const knownPlanets = args[1];
			const planets = [];
			const players = {};
			const oldPlanets = [];
			$('#galaxytable').find('tr').each(function () {
				const me = $(this);
				const planet = {
					id : me.find('td[data-planet-id]').attr('data-planet-id'),
					type : 'p'
				};
				if (!planet.id) {
					return;
				}
				const pData = me.find('td.playername a[rel]');
				if (pData.length) {
					planet.owner = pData.attr('rel').replace(/\D+/g, '');
				}
				if (!planet.owner) {
					return;
				}
				const player = {
					id : planet.owner,
					name : pData.parent().find('h1 span').text().trim(),
					officers : 0,
					status : 0
				};
				me.find('span.status').each(function () {
					const me = $(this);
					if (me.find('span.status_abbr_noob').length) {
						player.status = player.status || STATUS.noob;
					}
					if (me.find('span.status_abbr_inactive').length) {
						player.status = player.status || STATUS.inactive;
					}
					if (me.find('span.status_abbr_longinactive').length) {
						player.status = player.status || STATUS.longinactive;
					}
				});
				if (!players[player.id]) {
					players[player.id] = player;
				}
				planet.position = extend([], coords);
				planet.position[2] = _i(me.find('td.position').text().trim());
				planet.name = me.find('td[data-planet-id] h1 span').text().trim();
				const p = prepareSave(planet, knownPlanets, planets);
				if (p.status && ((p.status & 1) === 1)) {
					me.css('opacity', '0.2');
				}
				me.find('td[data-moon-id]').each(function () {
					const me = $(this);
					const moon = {
						id : me.attr('data-moon-id'),
						type : 'm',
						owner : planet.owner,
						position : planet.position,
						name : me.find('div.htmlTooltip h1 span').text().trim()
					};
					prepareSave(moon, knownPlanets, planets);
				});
			});
			Object.keys(players).forEach(function (id) {
				_s.port.get(MESSAGES.getPlayer, {id : id}).then(function (dbPlayer) {
					const player = players[id];
					if (!dbPlayer || dbPlayer.name !== player.name || dbPlayer.status !== player.status) {
						_s.port.send(MESSAGES.updatePlayer, extend(dbPlayer, player));
					}
				});
			});
			knownPlanets.forEach(function (p) {
				if (p.owner !== currentPlayer.id) {
					oldPlanets.push(p);
				}
			});
			_s.port.send(MESSAGES.updatePlanets, planets);
			if (oldPlanets.length) {
				_s.port.send(MESSAGES.deletePlanets, oldPlanets);
			}
		});

		function prepareSave(planet, knownPlanets, planets) {
			const kP = getKnownPlanet();
			if (!kP) {
				planets.push(planet);
				return planet;
			} else if (kP.name !== planet.name ||
				JSON.stringify(kP.position) !== JSON.stringify(planet.position)) {
				const p = extend(kP, planet);
				planets.push(p);
				return p;
			}
			return kP;

			function getKnownPlanet() {
				for (var i = 0; i < knownPlanets.length; i++) {
					var p = knownPlanets[i];
					if (p.id === planet.id) {
						knownPlanets.splice(i, 1);
						return p;
					}
				}
				return null;
			}
		}
	}

	function galaxyChanged(root) {
		const me = $(root);
		checkPlanets();
		_s.config.then(function (config) {
			if (config[cfg.galaxy_show_stats]) {
				me.find('td.playername').each(function () {
					const td = $(this);
					td.css({'text-align' : 'left'});
					td.find('> :first-child').css({'margin-left' : 6});
					const rank = td.find('div.htmlTooltip li.rank a').text();
					if (rank) {
						td.append($('<span>',
							{css : {float : 'right'}, text : nf().format(_i(rank))}));
					}
					fixWidth(td);
				});
			}
			if (config[cfg.galaxy_mark_debris]) {
				$('td.debris div.htmlTooltip').each(function () {
					const me = $(this);
					var metal = -1;
					var crystal = -1;
					me.find('.debris-content').each(function () {
						const me = $(this);
						var amount = me.text().replace(/\D/g, '');
						if (metal < 0) {
							metal = _i(amount);
						} else {
							crystal = _i(amount);
						}
					});
					if (metal + crystal > config[cfg.galaxy_debris_size]) {
						var tr = me.parents('td.debris').eq(0);
						var c = hexToRgb(config[cfg.galaxy_debris_color]);
						tr.css({
							'background-color' : 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', 0.4)',
							'border-radius' : 6
						});
					}
				});
			}
			if (config[cfg.galaxy_mark_position]) {
				const match = location.search.match(/&galaxy=(\d+)&system=(\d+)&position=(\d+)/);
				if (match) {
					const coords = [$('#galaxy_input').val(), $('#system_input').val(), 0];
					if (coords[0] === match[1] && coords[1] === match[2]) {
						me.find('#galaxytable tbody tr').eq(_i(match[3]) - 1).css({
							border : '1px solid ' + config[cfg.galaxy_mark_position_color],
							'border-radius' : 6
						});
					}
				}
			}
		});

		function fixWidth(td) {
			var w = 0;
			td.find('> :visible').each(function () {
				const child = $(this);
				w += child.width();
			});
			if (w > 140) {
				const name = td.find('> a > span');
				if (name.text().match(/^(.+?)(\.\.\.)?$/)) {
					name.text(RegExp.$1.substr(0, RegExp.$1.length - 1) + '...');
					fixWidth(td);
				}
			}
		}
	}

})(Skynet);
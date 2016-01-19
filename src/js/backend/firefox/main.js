/* global require, MESSAGES, Skynet, Port, Config, prepareConfig, getCSS */

const pageMod = require('sdk/page-mod');
const prefs = require('sdk/preferences/service');
const self = require('sdk/self');
const Mod = require('sdk/content/mod');
const Style = require('sdk/stylesheet/style');

const Resources = (function () {
	const cache = {};

	function addToCache(key, what) {
		cache[key] = what;
		return what;
	}

	function getIfExist(fileName) {
		try {
			return self.data.load(fileName);
		} catch (e) {
		}
		return null;
	}

	return {
		/**
		 *
		 * @param {{key:string,type:string,i18n:boolean}} args
		 * @returns {*}
		 */
		get: function (args) {
			var i, content, result = cache[args.key];
			if (result) {
				return result;
			}
			if (args.i18n) {
				//noinspection JSUnresolvedFunction
				const languages = prefs.getLocalized('intl.accept_languages').split(',');
				for (i = 0; i < languages.length; i++) {
					var l = languages[i].replace(/\s/g, '');
					if (l.match(/^(.+?)-.+?$/)) {
						l = RegExp.$1;
					}
					content = getIfExist(args.key + '_' + l + '.' + args.type);
					if (content) {
						if (args.type === 'json') {
							return addToCache(args.key, JSON.parse(content));
						}
						return addToCache(args.key, content);
					}
				}
			}
			content = getIfExist(args.key + '.' + args.type);
			if (content) {
				if (args.type === 'json') {
					return addToCache(args.key, JSON.parse(content));
				}
				return addToCache(args.key, content);
			}
		}
	};
})();

//noinspection JSUnresolvedFunction,JSUnusedGlobalSymbols
pageMod.PageMod({
	include: [/https?:\/\/.+.ogame.gameforge.com\/.*/],
	exclude: [/.*board.*/, /.*support.*/],
	contentStyleFile: [
		'./ext/jquery-ui.min.css',
		'./ext/nanoscroller.css',
		'./css/standard.css',
		'./css/images.css'
	],
	contentScriptFile: [
		'./ext/jquery.min.js',
		'./ext/jquery-ui.min.js',
		'./ext/knockout.min.js',
		'./ext/jquery.nanoscroller.min.js',
		'./content.js'],
	contentScriptOptions: {
		i18n: Resources.get({key: 'i18n/messages', type: 'json', i18n: true}),
		version: self.version
	},
	contentScriptWhen: 'start',
	onAttach: function (worker) {
		const uni = worker.tab.url.match(/^https?:\/\/(.+?ogame\.gameforge\.com)\/game\/index\.php/) ?
			RegExp.$1 : '';
		if (uni) {
			Config.get().then(function (config) {
				const _c = prepareConfig(config, uni);
				const css = getCSS(_c);
				if (css) {
					//noinspection JSUnresolvedFunction
					var style = Style.Style({
						source: css
					});
					Mod.attach(style, worker.tab);
				}
			});
		}
		Skynet.attach(new Port(worker.port, worker.tab));
		//noinspection JSUnresolvedFunction
		worker.port.on(MESSAGES.getResource, function (msg) {
			//noinspection JSUnresolvedFunction
			worker.port.emit(MESSAGES.getResource,
				Resources.get({key: msg.key, type: msg.type, i18n: msg.localize}));
		});
	}
});

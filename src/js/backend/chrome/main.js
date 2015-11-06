/* global chrome, Config, prepareConfig, getCSS, Skynet, Port */

chrome.runtime.onConnect.addListener(function (port) {
	Skynet.attach(new Port(port, port.sender.tab));
});

chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
	if (change.status === 'loading') {
		if (tab.url.match(/^https?:\/\/(.+?ogame\.gameforge\.com)\/game\/index\.php/)) {
			const host = RegExp.$1;
			if (!host.match(/board|support/)) {
				Config.get().then(function (config) {
					const _c = prepareConfig(config, host);
					const css = getCSS(_c);
					if (css) {
						chrome.tabs.insertCSS(tabId, {code : css, runAt : 'document_start'});
					}
				});
			}
		}
	}
});
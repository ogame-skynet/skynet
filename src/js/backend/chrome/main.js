/* global chrome, Skynet, Port */

chrome.runtime.onConnect.addListener(function (port) {
	Skynet.attach(new Port(port, port.sender.tab));
});
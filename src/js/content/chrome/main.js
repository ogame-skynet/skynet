/* global chrome, $ */

$(function () {
	const extPath = chrome.runtime.getURL('');
	$('head').append($('<style>',
		{type : 'text/css', text : '@import url("' + extPath + 'ext/jquery-ui.min.css");'}))
		.append($('<style>',
			{type : 'text/css', text : '@import url("' + extPath + 'css/images.css");'}));
});

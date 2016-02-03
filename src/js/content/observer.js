/* exported Observer */

/**
 *
 * @author Martin Burchard
 * @see https://gist.github.com/Warsaalk
 * @class
 */
const Observer = function (targetArg, config) {
	var target = typeof targetArg === 'string' ? document.querySelector(targetArg) :
		targetArg ? targetArg : document;
	var listeners = [];

	/**
	 * Listen for nodes that exactly match the given selector
	 *
	 * @param {string} selector
	 * @param {Observer~observerCallback} callback
	 */
	this.listenTo = function (selector, callback) {
		var result = target.querySelectorAll(selector);
		if (result.length) {
			for (var i = 0; i < result.length; i++) {
				callback.call(result[i]);
			}
			return;
		}
		listeners.push({selector: selector, callback: callback});
	};

	var mutationObserver = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			for (var i = 0; i < mutation.addedNodes.length; i++) {
				var me = mutation.addedNodes[i];
				if (me.nodeType === Node.ELEMENT_NODE) {
					listeners.forEach(function (listener) {
						if (me.matches(listener.selector)) {
							listener.callback.call(me);
						}
					});
				}
			}
		});
	});
	//noinspection JSCheckFunctionSignatures
	mutationObserver.observe(target, config || {childList: true});
};

/**
 * @callback Observer~observerCallback
 */

/**
 *
 * @param {(string|Object)} target
 * @param {Object} [config]
 * @returns {Observer}
 */
Observer.create = function (target, config) {
	return new Observer(target, config);
};
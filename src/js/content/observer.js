/* exported Observer */

/**
 *
 * @author Martin Burchard
 * @see https://gist.github.com/Warsaalk
 * @class
 */
function Observer(targetArg, config) {
	var target = typeof targetArg === 'string' ? document.querySelector(targetArg) :
		targetArg ? targetArg : document;
	var listeners = [];

	/**
	 * Listen for nodes that exactly match the given selector
	 *
	 * @param {string} selector
	 * @param {Observer~observerCallback} callback
	 * @param {boolean} [deep]
	 */
	this.listenTo = function (selector, callback, deep) {
		var result = target.querySelectorAll(selector);
		if (result.length) {
			for (var i = 0; i < result.length; i++) {
				callback.call(result[i]);
			}
			return;
		}
		listeners.push({selector: selector, callback: callback, deep: deep});
	};

	var mutationObserver = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			var i, j, k, hasTriggered, elements, me;
			for (i = 0; i < mutation.addedNodes.length; i++) {
				me = mutation.addedNodes[i];
				hasTriggered = false;
				if (me.nodeType === Node.ELEMENT_NODE) {
					for (j = 0; j < listeners.length; j++) {
						if (listeners[j] && me.matches(listeners[j].selector)) {
							listeners[j].callback.call(me);
							listeners[j] = null;
							hasTriggered = true;
						}
					}
					if (!hasTriggered) {
						for (j = 0; j < listeners.length; j++) {
							if (listeners[j] && listeners[j].deep) {
								elements = target.querySelectorAll(listeners[j].selector);
								for (k = 0; k < elements.length; k++) {
									listeners[k].callback.call(elements[j]);
									listeners[k] = null;
								}
							}
						}
					}
				}
			}
		});
	});
	//noinspection JSCheckFunctionSignatures
	mutationObserver.observe(target, config || {childList: true});
}

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
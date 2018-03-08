/* global genUUID */
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
		}
		listeners.push({selector: selector, callback: callback, deep: deep, id: genUUID()});
		return this;
	};

	/**
	 * Listen for nodes that exactly match the given selector
	 *
	 * @param {string} selector
	 * @param {Observer~observerCallback} callback
	 * @param {boolean} [deep]
	 */
	this.listenToOnce = function (selector, callback, deep) {
		var result = target.querySelectorAll(selector);
		if (result.length) {
			for (var i = 0; i < result.length; i++) {
				callback.call(result[i]);
			}
		}
		listeners.push({selector: selector, callback: callback, deep: deep, id: genUUID(), once: true});
		return this;
	};

	var mutationObserver = new MutationObserver(function (mutations) {
		var listenersUsed = [];
		mutations.forEach(function (mutation) {
			var i, j, me;
			for (i = 0; i < mutation.addedNodes.length; i++) {
				me = mutation.addedNodes[i];
				if (me.nodeType === Node.ELEMENT_NODE) {
					for (j = 0; j < listeners.length; j++) {
						if (listeners[j] && me.matches(listeners[j].selector)) {
							if (listenersUsed.indexOf(listeners[j].id) < 0) {
								listenersUsed.push(listeners[j].id);
								listeners[j].callback.call(me);
								if (listeners[j].once) {
									listeners[j] = null;
								}
							}
						}
					}
				}
			}
		});
		for (var j = 0; j < listeners.length; j++) {
			if (listeners[j] && listeners[j].deep) {
				var elements = target.querySelectorAll(listeners[j].selector);
				for (var k = 0; k < elements.length; k++) {
					var me = elements[k];
					if (listenersUsed.indexOf(listeners[j].id) < 0) {
						listenersUsed.push(listeners[j].id);
						listeners[j].callback.call(me);
						if (listeners[j].once) {
							listeners[j] = null;
						}
					}
				}
			}
		}
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
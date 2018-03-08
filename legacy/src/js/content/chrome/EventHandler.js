/* global Promise */
/* exported EventHandler */

//noinspection JSUnusedGlobalSymbols
function EventHandler() {
	const reg = {};

	/**
	 * Emit an event to all registered listeners
	 *
	 * @param {string} key
	 * @param {*} msg
	 */
	this.emit = function (key, msg) {
		if (reg[key]) {
			reg[key].forEach(function (/* Function */ method) {
				try {
					method.call(null, msg);
				} catch (e) {
					console.error(e);
				}
			});
		}
	};

	/**
	 * Register a listener to a specific event
	 *
	 * @param {string} key
	 * @param {Function} method
	 */
	this.on = function (key, method) {
		reg[key] = reg[key] || [];
		reg[key].push(method);
	};

	/**
	 * Register a listener to a specific event, that fires only once
	 *
	 * @param {string} key
	 * @param {Function} [method]
	 */
	this.once = function (key, method) {
		reg[key] = reg[key] || [];
		if (!method) {
			return new Promise(function (resolve) {
				const wrapper = function () {
					resolve.apply(null, arguments);
					removeListener(key, wrapper);
				};
				reg[key].push(wrapper);
			});
		}
		const wrapper = function () {
			method.apply(null, arguments);
			removeListener(key, wrapper);
		};
		reg[key].push(wrapper);
		return null;
	};

	//noinspection JSUnusedGlobalSymbols
	this.removeListener = removeListener;

	/**
	 * Remove a registered listener
	 *
	 * @param {string} key
	 * @param {Function} method
	 */
	function removeListener(key, method) {
		if (reg[key]) {
			reg[key].forEach(function (/* Function */ m, i, arr) {
				if (m === method) {
					arr.splice(i, 1);
				}
			});
		}
	}
}
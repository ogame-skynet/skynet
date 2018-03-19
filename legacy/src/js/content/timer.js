/* global $, Skynet */
/* exported Timer */

const Timer = (function (_s) {
	var nF = [];
	var hF = [];
	var to;

	/**
	 *
	 * @param {Function} func
	 * @param {boolean} [high]
	 */
	function add(func, high) {
		if (high) {
			hF.push(func);
			return;
		}
		nF.push(func);
	}

	/**
	 *
	 * @param {boolean} [high]
	 */
	function trigger(high) {
		var f = high ? hF : nF;
		var i = high ? 500 : 1000;
		f.forEach(function (/* Function */ func, index, arr) {
			if (!func.call()) {
				arr.splice(index, 1);
			}
		});
		var n = new Date();
		var p = i - n.getMilliseconds() % i;
		if (high) {
			_s.load(Math.round((i - p) / i * 100));
		}
		to = setTimeout(function () {
			trigger(high);
		}, p);
	}

	trigger();
	trigger(true);
	//$().unload(function () {
	//	clearTimeout(to);
	//});
	$(window).on("unload", function(e) {
		console.log("Will this ever be called?");
		clearTimeout(to);
	});

	return {
		add : add
	};
})(Skynet);
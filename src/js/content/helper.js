/* global $, ko, getI18n, _i */
/* exported _, _h, formatDate, formatTime, getTextNodesText, isNumeric, nf, gl */

/**
 *
 * @param {boolean} [direct]
 * @param {string} key
 * @param {*} [args]
 * @returns {*|string}
 * @private
 */
function _(direct, key, args) {
	if (typeof direct === 'string') {
		args = arguments[1];
		key = arguments[0];
		direct = false;
	}
	if (!direct) {
		return getI18n().getMessage(key.replace(/\s/g, '_'), args) || '[' + key + ']';
	}
	var i;
	var txt = key;
	if (Array.isArray(args)) {
		for (i = 0; i < args.length; i++) {
			txt = txt.replace(new RegExp('\\$' + (i + 1), 'g'), args[i]);
		}
		return txt;
	}
	if (typeof args === 'object') {
		Object.keys(args).forEach(function (elem) {
			txt = txt.replace(new RegExp('\\$' + elem + '\\$', 'g'), args[elem]);
		});
		return txt;
	}
	return txt;
}

/**
 *
 * @param {Array} json
 * @return {String}
 */
function _h(json) {

	function attrToString(attr) {
		if (typeof attr === 'string') {
			return attr.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g,
				'&gt;');
		} else if (typeof attr === 'number' || typeof attr === 'boolean') {
			return attr.toString();
		} else {
			var str = '';
			for (var elem in attr) {
				if (!attr.hasOwnProperty(elem)) {
					continue;
				}
				str += (str ? ' ' : '') + elem + ': ' + attr[elem] + ';';
			}
			return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g,
				'&gt;');
		}
	}

	function toHTML(name, attr) {
		var html = '';
		var args = [];
		Array.prototype.push.apply(args, arguments);
		var children = args.slice(2);
		if (!name || !name.match(/[a-zA-Z0-9]/gi)) {
			if (children) {
				children.forEach(function (elem) {
					if (Array.isArray(elem)) {
						//noinspection JSCheckFunctionSignatures
						html += toHTML.apply(null, elem);
					} else {
						html += elem;
					}
				});
			}
		} else {
			name = name.toLowerCase();
			html += '<' + name;
			if (attr) {
				for (var elem in attr) {
					if (attr.hasOwnProperty(elem) && elem !== 'text') {
						html += ' ' + elem + '="' + attrToString(attr[elem]) + '"';
					}
				}
			}
			html += ">";
			if (attr && attr.text) {
				html += attr.text.toString().replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g,
					'&lt;').replace(/>/g, '&gt;');
			}
			if (children) {
				children.forEach(function (elem) {
					if (Array.isArray(elem)) {
						//noinspection JSCheckFunctionSignatures
						html += toHTML.apply(null, elem);
					} else {
						html += elem;
					}
				});
			}
			if (!name.match(/^(?:br|meta|link)$/)) {
				html += '</' + name + '>';
			}
		}
		return html;
	}

	if (Array.isArray(json)) {
		return toHTML.apply(null, json);
	}
	return toHTML.apply(null, arguments);
}

const DF = {
	FULL : new DateFormatter('dd.MM.yyyy HH:mm:ss'),
	TIME_ONLY : new DateFormatter('HH:mm:ss'),
	DATE_ONLY : new DateFormatter('dd.MM.yyyy'),
	EXTENDED : new DateFormatter('dd.MM.yyyy HH:mm:ss.S')
};

/**
 * Format a date in a common format.
 *
 * @param {string} pattern
 */
function DateFormatter(pattern) {
	var f = nf(0, 2);
	var f2 = nf(0, 3);

	/**
	 * @param {Date} date
	 * @returns {string}
	 */
	this.format = function (date) {
		return pattern.replace(/yyyy/, '' + date.getFullYear()).replace(/yy/,
			'' + date.getYear()).replace(/dd/, f.format(date.getDate())).replace(/MM/,
			f.format(date.getMonth() + 1)).replace(/HH/, f.format(date.getHours())).replace(/mm/,
			f.format(date.getMinutes())).replace(/ss/, f.format(date.getSeconds())).replace(/S/,
			f2.format(date.getMilliseconds()));
	};
}

/**
 *
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
	var now = new Date();
	if (now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth() &&
		now.getDate() === date.getDate()) {
		return DF.TIME_ONLY.format(date);
	}
	return DF.FULL.format(date);
}

function formatTime(seconds) {
	if (seconds === Number.POSITIVE_INFINITY) {
		return _('never');
	}
	if (seconds <= 0) {
		return '-';
	}
	var rest = Math.floor(seconds);
	const s = rest % 60;
	rest = (rest - s) / 60;
	const m = rest % 60;
	rest = (rest - m) / 60;
	const h = rest % 24;
	rest = (rest - h) / 24;
	return (rest ? rest + "d " : "") + (rest || h ? h + "h " : "") + (rest || h || m ? m + "m" : "") +
		(rest ? "" : " " + s + "s");
}

function getTextNodesText(node, whiteSpace, deep) {
	const texts = [];
	const nwm = /\S/;
	gt(node);
	return texts;

	function gt(node) {
		var i;
		for (i = 0; i < node.childNodes.length; i++) {
			var child = node.childNodes[i];
			if (child.nodeType === 3) {
				if (whiteSpace || nwm.test(child.nodeValue)) {
					texts.push(child.nodeValue);
				}
			} else if (deep) {
				gt(child);
			}
		}
	}
}

function gl() {
	//noinspection JSUnresolvedVariable
	return navigator.languages[0];
}

function isNumeric(obj) {
	return !Array.isArray(obj) && (obj - parseFloat(obj) + 1) >= 0;
}

function nf(maximumFractionDigits, minimumIntegerDigits, maximumSignificantDigits, abbr) {
	if (abbr) {
		return {
			format : function (num) {
				var val = num;
				var mod = '';
				if (Math.abs(val) > 1000000) {
					if (Math.abs(val) > 1000000000) {
						val = val / 1000000000;
						mod = gl().match(/^de/) ? ' Bn' : ' Mrd';
					} else {
						val = val / 1000000;
						mod = ' M';
					}
				}
				return nf(3, 0, val >= 10 ? 5 : 4).format(val) + mod;
			}
		};
	}
	if (maximumSignificantDigits) {
		//noinspection JSUnresolvedVariable,JSUnresolvedFunction
		return new Intl.NumberFormat(gl, {
			maximumFractionDigits : maximumFractionDigits || 0,
			minimumIntegerDigits : minimumIntegerDigits || 1,
			maximumSignificantDigits : maximumSignificantDigits
		});
	}
	//noinspection JSUnresolvedVariable,JSUnresolvedFunction
	return new Intl.NumberFormat(gl, {
		maximumFractionDigits : maximumFractionDigits || 0,
		minimumIntegerDigits : minimumIntegerDigits || 1
	});
}

ko.bindingHandlers.color = {
	init : function (element, valueAccessor, allBindings) {
		ko.bindingHandlers.textInput.init(element, valueAccessor, allBindings);
	},
	update : function (element, valueAccessor) {
		var elem = $(element);
		var value = ko.utils.unwrapObservable(valueAccessor() || '');
		elem.css({
			'backgroundColor' : value
		});
		var color = elem.css('backgroundColor');
		if (color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)) {
			var num = (_i(RegExp.$1) + _i(RegExp.$2) + _i(RegExp.$2)) / 3;
			if (num > 180) {
				elem.css('color', 'black');
			} else {
				elem.css('color', 'white');
			}
		}
	}
};

ko.bindingHandlers.href = {
	update : function (element, valueAccessor) {
		ko.bindingHandlers.attr.update(element, function () {
			return {href : valueAccessor()};
		});
	}
};

ko.bindingHandlers.name = {
	update : function (element, valueAccessor) {
		ko.bindingHandlers.attr.update(element, function () {
			return {name : valueAccessor()};
		});
	}
};

ko.bindingHandlers.title = {
	update : function (element, valueAccessor) {
		ko.bindingHandlers.attr.update(element, function () {
			return {title : valueAccessor()};
		});
	}
};

ko.extenders.trackChanges = function (target, initial) {
	var initialValue = typeof ko.toJS(target) !== 'undefined' ? ko.toJS(target) : '';
	target.isChanged = ko.observable(initial.initial);
	target.subscribe(function (newValue) {
		// if the initial value is already a change then it will always keep as a change
		if (initial.initial) {
			return;
		}
		// if an observableArray is change tracked, sort and stringify it before the comparison
		if ($.isArray(initialValue) && $.isArray(newValue)) {
			var iV = extend([], initialValue).sort();
			var nV = extend([], newValue).sort();
			target.isChanged(JSON.stringify(iV) !== JSON.stringify(nV));
		} else {
			target.isChanged(initialValue !== newValue);
		}
	});
	return target;
};
/* global $ */

(function () {
	//noinspection JSPotentiallyInvalidConstructorUsage
	const _orig = $.ui.dialog.prototype.open;

	//noinspection JSPotentiallyInvalidConstructorUsage
	$.ui.dialog.prototype.open = function () {
		//noinspection JSUnresolvedVariable
		const dlg = $(this.uiDialog);
		if (this.options.css_scope) {
			if (!dlg.parent().hasClass(this.options.css_scope)) {
				dlg.wrap($('<div>', {
					'class' : this.options.css_scope
				}));
			}
		}
		_orig.apply(this, arguments);
		$(this.overlay).insertBefore(dlg);
		return _orig;
	};
})();

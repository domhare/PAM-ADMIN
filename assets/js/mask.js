(function () {
	'use strict';

	function mask(id, pattern, opts) {
		var el = document.getElementById(id);
		if (el) IMask(el, Object.assign({ mask: pattern }, opts || {}));
	}

	mask('date', '00/00/0000');
	mask('phone', '(000) 000-0000');
	mask('phoneExt', '(000) 000-0000{ x}0000');
	mask('ssn', '000-00-0000');
	mask('ccn', '0000 0000 0000 0000');
	mask('currency', Number, { thousandsSeparator: ',', scale: 2 });
	mask('products', 'a*-000-a000');
	mask('eyescript', '[+-]0.00 [+-]0.00 000');
	mask('pct', '00%');

})();

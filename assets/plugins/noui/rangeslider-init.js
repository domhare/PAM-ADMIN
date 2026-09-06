(function () {
	'use strict';

	var el = document.getElementById('range_03');
	if (!el || !window.noUiSlider) return;

	var wrapper = document.createElement('div');
	wrapper.className = 'range-slider-track';
	el.style.display = 'none';
	el.parentNode.insertBefore(wrapper, el);

	noUiSlider.create(wrapper, {
		start: [200, 800],
		connect: true,
		range: { min: 0, max: 1000 },
		step: 1,
		format: {
			to: function (value) { return '$' + Math.round(value); },
			from: function (value) { return Number(value.replace('$', '')); }
		}
	});

	wrapper.noUiSlider.on('update', function (values) {
		el.value = values[0] + ' - ' + values[1];
	});

})();

'use strict';

(function () {

	function parseValues(el) {
		return el.textContent.split(',').map(function (v) { return Number(v.trim()); });
	}

	// Peity's "fraction" notation: "1/5" (value/total) or "226,134" (value,remainder)
	function parseFraction(el) {
		var text = el.textContent.trim();
		if (text.indexOf('/') > -1) {
			var parts = text.split('/').map(Number);
			return [parts[0], parts[1] - parts[0]];
		}
		return parseValues(el);
	}

	function renderFractionChart(el, type, fillColors, width, height) {
		var values = parseFraction(el);
		el.textContent = '';
		el.style.display = 'inline-block';
		var chartWidth = width || 50;
		var chartHeight = height || 50;
		el.style.width = chartWidth + 'px';
		el.style.height = chartHeight + 'px';
		new ApexCharts(el, {
			chart: { type: type, height: chartHeight, width: chartWidth, sparkline: { enabled: true } },
			series: values,
			colors: fillColors || ['#506EE4', 'rgba(67, 87, 133, .09)'],
			legend: { show: false },
			dataLabels: { enabled: false },
			tooltip: { enabled: false }
		}).render();
	}

	function sparkline(selector, type, opts) {
		document.querySelectorAll(selector).forEach(function (el) {
			var values = parseValues(el);
			el.textContent = '';
			el.style.display = 'block';
			el.style.width = '100%';
			var height = (opts && opts.height) || 50;
			var width = (opts && opts.width) || '100%';
			var colors = (opts && opts.fill) || ['#664dc9'];
			var chartType = type === 'line' ? 'area' : type;
			new ApexCharts(el, {
				chart: { type: chartType, height: height, width: width, sparkline: { enabled: true } },
				series: type === 'pie' || type === 'donut' ? values : [{ data: values }],
				colors: colors,
				stroke: { width: type === 'line' ? 2 : 0, curve: 'straight' },
				fill: type === 'line' ? { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } } : { opacity: 1 },
				tooltip: { enabled: false }
			}).render();
		});
	}

	// Ticket charts (bar)
	sparkline('.ticket-chart-1', 'bar', { fill: ['#F26522'], height: 70 });
	sparkline('.ticket-chart-2', 'bar', { fill: ['#AB47BC'], height: 70 });
	sparkline('.ticket-chart-3', 'bar', { fill: ['#03C95A'], height: 70 });
	sparkline('.ticket-chart-4', 'bar', { fill: ['#0DCAF0'], height: 70 });

	// Subscription lines
	sparkline('.subscription-line-1', 'line', { fill: ['#F7A37A'], height: 35 });
	sparkline('.subscription-line-2', 'line', { fill: ['#70B1FF'], height: 25 });
	sparkline('.subscription-line-3', 'line', { fill: ['#60DD97'], height: 25 });
	sparkline('.subscription-line-4', 'line', { fill: ['#DE5555'], height: 25 });

	// Country charts
	sparkline('.country-chart-1', 'line', { fill: ['#1CCE6B'], height: 20 });
	sparkline('.country-chart-2', 'line', { fill: ['#D00C0C'], height: 20 });

	// Company bars
	sparkline('.company-bar1', 'bar', { fill: ['#FF6F28'], height: 40, width: 40 });
	sparkline('.company-bar2', 'bar', { fill: ['#4B3088'], height: 40, width: 40 });
	sparkline('.company-bar3', 'bar', { fill: ['#177DBC'], height: 40, width: 40 });
	sparkline('.company-bar4', 'bar', { fill: ['#2DCB73'], height: 40, width: 40 });

	// chart-peity.html demo page
	sparkline('.peity-line', 'line', { fill: ['#506EE4'], height: 65 });
	sparkline('.bar-colours-1', 'bar', { fill: ['#664dc9'], height: 100 });
	sparkline('.bar-colours-2', 'bar', { fill: ['#38cb89'], height: 100 });
	sparkline('.bar-colours-3', 'bar', { fill: ['#ffab00'], height: 100 });
	sparkline('.bar-colours-4', 'bar', { fill: ['#ef4b4b'], height: 100 });

	document.querySelectorAll('.pie-colours-2').forEach(function (el) {
		var values = parseValues(el);
		el.textContent = '';
		new ApexCharts(el, {
			chart: { type: 'pie', height: 100 },
			series: values,
			colors: ['#705ec8', '#fa057a', '#2dce89', '#ff5b51', '#fcbf09'],
			legend: { show: false },
			dataLabels: { enabled: false }
		}).render();
	});

	// Donut / Pie demo sections (fraction notation)
	document.querySelectorAll('span.donut').forEach(function (el) {
		var fill = null;
		try { fill = JSON.parse(el.dataset.peity || '{}').fill; } catch (e) { }
		renderFractionChart(el, 'donut', fill);
	});
	document.querySelectorAll('span.pie').forEach(function (el) {
		var fill = null;
		try { fill = JSON.parse(el.dataset.peity || '{}').fill; } catch (e) { }
		renderFractionChart(el, 'pie', fill);
	});
	document.querySelectorAll('span.bar').forEach(function (el) {
		var fill = null;
		try { fill = JSON.parse(el.dataset.peity || '{}').fill; } catch (e) { }
		var values = parseValues(el);
		el.textContent = '';
		new ApexCharts(el, {
			chart: { type: 'bar', height: 50, sparkline: { enabled: true } },
			series: [{ data: values }],
			colors: fill || ['#5b73e8'],
			plotOptions: { bar: { columnWidth: '70%' } },
			tooltip: { enabled: false }
		}).render();
	});
	document.querySelectorAll('.data-attributes span').forEach(function (el) {
		var fill = null;
		var width = 50;
		var height = 50;
		try { 
			var config = JSON.parse(el.dataset.peity || '{}');
			fill = config.fill; 
			if (config.radius) {
				width = config.radius * 2;
				height = config.radius * 2;
			}
		} catch (e) { }
		renderFractionChart(el, 'donut', fill, width, height);
	});

	document.querySelectorAll('.updating-chart').forEach(function (el) {
		var values = parseValues(el);
		var chart = new ApexCharts(el, {
			chart: { type: 'line', height: 65, sparkline: { enabled: true }, animations: { enabled: false } },
			series: [{ data: values }],
			colors: ['#664dc9'],
			stroke: { width: 2, curve: 'straight' },
			tooltip: { enabled: false }
		});
		chart.render();

		setInterval(function () {
			var random = Math.round(Math.random() * 20);
			values.shift();
			values.push(random);
			chart.updateSeries([{ data: values }]);
		}, 2500);
	});

})();

'use strict';

(function () {

	var years = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
	var seriesA = [12, 18, 15, 25, 30, 18, 12];
	var seriesB = [18, 22, 18, 28, 35, 28, 18];

	function renderChart(id, options) {
		var el = document.querySelector('#' + id);
		if (!el) return null;
		var chart = new ApexCharts(el, options);
		chart.render();
		return chart;
	}

	// Bar chart 1
	renderChart('morrisBar1', {
		chart: { type: 'bar', height: 250, toolbar: { show: false } },
		series: [
			{ name: 'Series A', data: seriesA },
			{ name: 'Series B', data: seriesB }
		],
		colors: ['#664dc9', '#44c4fa'],
		xaxis: { categories: years },
		plotOptions: { bar: { columnWidth: '60%', borderRadius: 3 } },
		dataLabels: { enabled: false }
	});

	// Bar chart 2 (stacked)
	renderChart('morrisBar3', {
		chart: { type: 'bar', height: 250, stacked: true, toolbar: { show: false } },
		series: [
			{ name: 'Series A', data: seriesA },
			{ name: 'Series B', data: seriesB }
		],
		colors: ['#664dc9', '#44c4fa'],
		xaxis: { categories: years },
		plotOptions: { bar: { columnWidth: '60%', borderRadius: 3 } },
		dataLabels: { enabled: false }
	});

	// Line chart
	renderChart('morrisLine1', {
		chart: { type: 'line', height: 250, toolbar: { show: false } },
		series: [
			{ name: 'Series A', data: seriesA },
			{ name: 'Series B', data: seriesB }
		],
		colors: ['#664dc9', '#44c4fa'],
		stroke: { width: 1, curve: 'straight' },
		xaxis: { categories: years },
		yaxis: { max: 50 }
	});

	// Area chart
	renderChart('morrisArea1', {
		chart: { type: 'area', height: 250, toolbar: { show: false } },
		series: [
			{ name: 'Series A', data: [10, 25, 80, 25, 30, 18, 12] },
			{ name: 'Series B', data: [15, 22, 60, 28, 35, 28, 18] }
		],
		colors: ['#664dc9', '#44c4fa'],
		stroke: { width: 1, curve: 'straight' },
		fill: { opacity: 0.9 },
		xaxis: { categories: years },
		yaxis: { max: 100 }
	});

	// Live-updating sine/cosine line chart
	(function () {
		var el = document.querySelector('#morrisBar6');
		if (!el) return;

		function generate(offset) {
			var categories = [];
			var y = [];
			var z = [];
			for (var x = 0; x <= 360; x += 10) {
				var v = (offset + x) % 360;
				categories.push(x);
				y.push(Number(Math.sin(Math.PI * v / 180).toFixed(4)));
				z.push(Number(Math.cos(Math.PI * v / 180).toFixed(4)));
			}
			return { categories: categories, y: y, z: z };
		}

		var initial = generate(0);
		var chart = new ApexCharts(el, {
			chart: { type: 'line', height: 250, animations: { enabled: false }, toolbar: { show: false } },
			series: [
				{ name: 'data1', data: initial.y },
				{ name: 'data2', data: initial.z }
			],
			colors: ['#664dc9', '#44c4fa'],
			stroke: { width: 1, curve: 'straight' },
			markers: { size: 0 },
			xaxis: { categories: initial.categories, labels: { show: false } },
			yaxis: { min: -1, max: 1 }
		});
		chart.render();

		var nReloads = 0;
		setInterval(function () {
			nReloads++;
			var next = generate(5 * nReloads);
			chart.updateSeries([
				{ name: 'data1', data: next.y },
				{ name: 'data2', data: next.z }
			]);
			var reloadStatus = document.getElementById('reloadStatus');
			if (reloadStatus) reloadStatus.textContent = nReloads + ' reloads';
		}, 100);
	})();

	// Licensed/SORN line chart
	renderChart('morrisBar7', {
		chart: { type: 'line', height: 250, toolbar: { show: false } },
		series: [
			{ name: 'Licensed', data: [3407, 3351, 3269, 3246, 3257, 3248, 3171, 3171, 3201, 3215] },
			{ name: 'SORN', data: [660, 629, 618, 661, 667, 627, 660, 676, 656, 622] }
		],
		colors: ['#664dc9', '#44c4fa'],
		stroke: { width: 1, curve: 'straight' },
		xaxis: {
			categories: ['2012-10-01', '2012-09-30', '2012-09-29', '2012-09-20', '2012-09-19', '2012-09-18', '2012-09-17', '2012-09-16', '2012-09-15', '2012-09-10']
		}
	});

	// Donut chart
	renderChart('morrisDonut1', {
		chart: { type: 'donut', height: 250 },
		series: [50, 30, 20],
		labels: ['Sales', 'Pending', 'Process'],
		colors: ['#664dc9', '#44c4fa', '#38cb89']
	});

	// Single-series line chart
	renderChart('morrisline', {
		chart: { type: 'line', height: 250, toolbar: { show: false } },
		series: [{ name: 'Licensed', data: [20, 10, 15, 10, 20, 10] }],
		colors: ['#664dc9'],
		stroke: { width: 1, curve: 'straight' },
		xaxis: {
			categories: ['2012-10-01', '2012-09-30', '2012-09-29', '2012-09-20', '2012-09-19', '2012-09-18']
		}
	});

})();

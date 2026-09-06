'use strict';

(function () {

	var newCust = [20, 35, 25, 22, 18, 27, 34, 35, 48, 30];
	var newCustLine = [10, 15, 25, 22, 18, 27, 34];
	var retCustLine = [8, 17, 28, 20, 16, 24, 36];

	function renderChart(id, options) {
		var el = document.querySelector('#' + id);
		if (!el) return;
		new ApexCharts(el, options).render();
	}

	// Bar chart 1
	renderChart('flotBar1', {
		chart: { type: 'bar', height: 250, toolbar: { show: false } },
		series: [{ name: 'Value', data: newCust }],
		colors: ['#44c4fa'],
		plotOptions: { bar: { columnWidth: '40%', borderRadius: 3 } },
		dataLabels: { enabled: false },
		xaxis: { labels: { style: { colors: '#8e9cad', fontSize: '10px' } } },
		yaxis: { labels: { style: { colors: '#8e9cad', fontSize: '10px' } } },
		grid: { borderColor: 'rgba(67, 87, 133, .09)' }
	});

	// Bar chart 2 (two series)
	renderChart('flotBar2', {
		chart: { type: 'bar', height: 250, toolbar: { show: false } },
		series: [
			{ name: 'Series A', data: [30, 15, 45, 22, 18, 27, 34, 35, 48] },
			{ name: 'Series B', data: [80, 20, 24, 17, 10, 24, 30, 16, 22] }
		],
		colors: ['#664dc9', '#44c4fa'],
		plotOptions: { bar: { columnWidth: '60%', borderRadius: 3 } },
		dataLabels: { enabled: false },
		xaxis: { labels: { style: { colors: '#8e9cad', fontSize: '10px' } } },
		yaxis: { labels: { style: { colors: '#8e9cad', fontSize: '10px' } } },
		grid: { borderColor: 'rgba(67, 87, 133, .09)' }
	});

	// Line chart 1
	renderChart('flotLine1', {
		chart: { type: 'line', height: 250, toolbar: { show: false } },
		series: [
			{ name: 'Sales', data: newCustLine },
			{ name: 'Customer', data: retCustLine }
		],
		colors: ['#664dc9', '#44c4fa'],
		stroke: { width: 2, curve: 'straight' },
		markers: { size: 0 },
		legend: { position: 'top', horizontalAlign: 'left' },
		xaxis: { labels: { style: { colors: '#8e9cad', fontSize: '10px' } } },
		yaxis: { min: 0, max: 40, labels: { style: { colors: '#8e9cad', fontSize: '10px' } } },
		grid: { borderColor: 'rgba(67, 87, 133, .09)' }
	});

	// Line chart 2 (with markers)
	renderChart('flotLine2', {
		chart: { type: 'line', height: 250, toolbar: { show: false } },
		series: [
			{ name: 'Sales', data: newCustLine },
			{ name: 'Customer', data: retCustLine }
		],
		colors: ['#664dc9', '#44c4fa'],
		stroke: { width: 2, curve: 'straight' },
		markers: { size: 4 },
		legend: { position: 'top', horizontalAlign: 'right' },
		xaxis: { labels: { style: { colors: '#8e9cad', fontSize: '10px' } } },
		yaxis: { min: 0, max: 50, labels: { style: { colors: '#8e9cad', fontSize: '10px' } } },
		grid: { borderColor: 'rgba(67, 87, 133, .09)' }
	});

	// Area chart 1
	renderChart('flotArea1', {
		chart: { type: 'area', height: 250, toolbar: { show: false } },
		series: [
			{ name: 'Sales', data: newCustLine },
			{ name: 'Customer', data: retCustLine }
		],
		colors: ['#664dc9', '#44c4fa'],
		stroke: { width: 1, curve: 'straight' },
		fill: { type: 'gradient', gradient: { opacityFrom: 0.8, opacityTo: 0 } },
		markers: { size: 0 },
		legend: { position: 'top', horizontalAlign: 'left' },
		xaxis: { labels: { style: { colors: '#8e9cad', fontSize: '10px' } } },
		yaxis: { min: 0, max: 50, labels: { style: { colors: '#8e9cad', fontSize: '10px' } } },
		grid: { borderColor: 'rgba(67, 87, 133, .09)' }
	});

	// Area chart 2 (lighter fill, with markers)
	renderChart('flotArea2', {
		chart: { type: 'area', height: 250, toolbar: { show: false } },
		series: [
			{ name: 'Sales', data: newCustLine },
			{ name: 'Customer', data: retCustLine }
		],
		colors: ['#664dc9', '#44c4fa'],
		stroke: { width: 1, curve: 'straight' },
		fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0 } },
		markers: { size: 4 },
		legend: { position: 'top', horizontalAlign: 'left' },
		xaxis: { labels: { style: { colors: '#8e9cad', fontSize: '10px' } } },
		yaxis: { min: 0, max: 50, labels: { style: { colors: '#8e9cad', fontSize: '10px' } } },
		grid: { borderColor: 'rgba(67, 87, 133, .09)' }
	});

	// Pie chart 1
	var pieLabels = ['Series 1', 'Series 2', 'Series 3', 'Series 4', 'Series 5'];
	var pieColors = ['#664dc9', '#44c4fa', '#38cb89', '#ef4b4b', '#ffab00'];
	renderChart('flotPie1', {
		chart: { type: 'pie', height: 250 },
		series: [10, 50, 30, 30, 60],
		labels: pieLabels,
		colors: pieColors,
		legend: { show: false },
		dataLabels: { style: { fontSize: '8pt' } }
	});

	// Pie chart 2 (donut)
	renderChart('flotPie2', {
		chart: { type: 'donut', height: 250 },
		series: [10, 50, 30, 30, 60],
		labels: pieLabels,
		colors: pieColors,
		legend: { show: false },
		dataLabels: { style: { fontSize: '8pt' } }
	});

})();

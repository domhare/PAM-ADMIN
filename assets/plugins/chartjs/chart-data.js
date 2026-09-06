document.addEventListener('DOMContentLoaded', function () {
	'use strict';
	if (document.getElementById('chartBar1')) {
		var ctx1 = document.getElementById('chartBar1').getContext('2d');
		new Chart(ctx1, {
			type: 'bar',
			data: {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
				datasets: [{
					label: 'Sales',
					data: [24, 10, 32, 24, 26, 20],
					backgroundColor: '#44c4fa'
				}]
			},
			options: {
				maintainAspectRatio: false,
				responsive: true,
				legend: {
					display: false,
					labels: {
						display: false
					}
				},
				scales: {
					x: {
						ticks: {
							font: { size: 11 },
							beginAtZero: true
						},
					},
					y: {
						ticks: {
							font: { size: 10 },
							beginAtZero: true,
							max: 80
						}
					},
				}
			}
		});
	}
	if (document.getElementById('chartBar2')) {
		var ctx2 = document.getElementById('chartBar2').getContext('2d');
		new Chart(ctx2, {
			type: 'bar',
			data: {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
				datasets: [{
					label: 'Sales',
					data: [14, 12, 34, 25, 24, 20],
					backgroundColor: '#44c4fa'
				}]
			},
			options: {
				maintainAspectRatio: false,
				responsive: true,
				legend: {
					display: false,
					labels: {
						display: false
					}
				},
				scales: {
					x: {
						ticks: {
							beginAtZero: true,
							font: { size: 11 } // ✅ Correct way to set font size in v4
						},
						barPercentage: 0.6 // ✅ Moved outside `ticks`
					},
					y: {
						ticks: {
							beginAtZero: true,
							font: { size: 10 }, // ✅ Correct font size format
							max: 80 // ✅ Sets max value for the Y-axis
						}
					}
				}
			}
		});
	}
	if (document.getElementById('chartBar3')) {
		var ctx3 = document.getElementById('chartBar3').getContext('2d');
		var gradient = ctx3.createLinearGradient(0, 0, 0, 250);
		gradient.addColorStop(0, '#0d7858');
		gradient.addColorStop(1, '#44c4fa');
		new Chart(ctx3, {
			type: 'bar',
			data: {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
				datasets: [{
					label: 'Sales',
					data: [14, 12, 34, 25, 24, 20],
					backgroundColor: gradient
				}]
			},
			options: {
				maintainAspectRatio: false,
				responsive: true,
				legend: {
					display: false,
					labels: {
						display: false
					}
				},
				scales: {
					x: {
						ticks: {
							beginAtZero: true,
							font: { size: 11 }
						},
						barPercentage: 0.6
					},
					y: {
						ticks: {
							beginAtZero: true,
							font: { size: 10 },
							max: 80
						}
					}
				}
			}
		});
	}
	if (document.getElementById('chartBar4')) {

		var ctx4 = document.getElementById('chartBar4').getContext('2d');
		new Chart(ctx4, {
			type: 'bar',
			data: {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
				datasets: [{
					label: 'Sales',
					data: [14, 12, 34, 25, 24, 20],
					backgroundColor: ['#44c4fa', '#1976D2', '#09800F', '#303F9F', '#FDAF22', '#09800F']
				}]
			},
			options: {
				indexAxis: 'y',
				maintainAspectRatio: false,
				legend: {
					display: false,
					labels: {
						display: false
					}
				},
				scales: {
					x: {
						ticks: {
							beginAtZero: true,
							font: { size: 11 }
						}
					},
					y: {
						ticks: {
							beginAtZero: true,
							font: { size: 10 },
							max: 80
						}
					}
				}
			}
		});
	}
	if (document.getElementById('chartBar5')) {
		var ctx5 = document.getElementById('chartBar5').getContext('2d');
		new Chart(ctx5, {
			type: 'bar',
			data: {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
				datasets: [{
					data: [14, 12, 34, 25, 24, 20],
					backgroundColor: ['#44c4fa', '#1976D2', '#09800F', '#FDAF22', '#B71C1C']
				}, {
					data: [22, 30, 25, 30, 20, 40],
					backgroundColor: '#44c4fa'
				}]
			},
			options: {
				indexAxis: 'y',
				maintainAspectRatio: false,
				legend: {
					display: false,
					labels: {
						display: false
					}
				},
				scales: {
					y: {
						ticks: {
							beginAtZero: true,
							font: { size: 11 }
						}
					},
					x: {
						ticks: {
							beginAtZero: true,
							font: { size: 11 },
							max: 80
						}
					}
				}
			}
		});
	}


	/** STACKED BAR CHART **/
	if (document.getElementById('chartStacked1')) {
		var ctx6 = document.getElementById('chartStacked1');
		new Chart(ctx6, {
			type: 'bar',
			data: {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
				datasets: [{
					data: [14, 12, 34, 25, 24, 20],
					backgroundColor: '#44c4fa',
					borderWidth: 1,
					fill: true
				}, {
					data: [14, 12, 34, 25, 24, 20],
					backgroundColor: '#0D7858',
					borderWidth: 1,
					fill: true
				}]
			},
			options: {
				maintainAspectRatio: false,
				legend: {
					display: false,
					labels: {
						display: false
					}
				},
				scales: {
					y: {
						stacked: true,
						ticks: {
							beginAtZero: true,
							font: { size: 11 }
						}
					},
					x: {
						barPercentage: 0.5,
						stacked: true,
						ticks: {
							font: { size: 11 }
						}
					}
				}
			}
		});
	}



	if (document.getElementById('avghiretime')) {
		const ctx = document.getElementById('avghiretime').getContext('2d');

		new Chart(ctx, {
			type: 'bar',
			data: {
				labels: ['Jan', 'Feb', 'Mar'],
				datasets: [
					{
						label: 'Applied to Shortlisted',
						data: [2, 4, 3],
						backgroundColor: '#0b4c5f',
						borderColor: '#ffffff',
						borderWidth: 3,
						borderDash: [4, 4],
						borderRadius: 8,
						borderSkipped: false,
						barThickness: 70,
						stack: 'stack1'
					},
					{
						label: 'Shortlisted',
						data: [1.7, 1.7, 1.7],
						backgroundColor: '#3e6f7c',
						borderColor: '#ffffff',
						borderWidth: 3,
						borderDash: [4, 4],
						borderRadius: 8,
						borderSkipped: false,
						barThickness: 70,
						stack: 'stack1'
					},
					{
						label: 'Interview to Offer',
						data: [4, 2, 2],
						backgroundColor: '#9fb8bf',
						borderColor: '#ffffff',
						borderWidth: 3,
						borderDash: [4, 4],
						borderRadius: 8,
						borderSkipped: false,
						barThickness: 70,
						stack: 'stack1'
					},
					{
						label: 'Acceptance',
						data: [3, 7, 5],
						backgroundColor: '#c9d8dc',
						borderColor: '#ffffff',
						borderWidth: 3,
						borderDash: [4, 4],
						borderRadius: 8,
						borderSkipped: false,
						barThickness: 70,
						stack: 'stack1'
					}
				]
			}
			,
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						enabled: true
					}
				},
				scales: {
					x: {
						stacked: true,
						grid: {
							display: false,
							padding : {
								left : -10
							}
						},
						ticks: {
							font: { size: 11 }
						}
					},
					y: {
						stacked: true,
						beginAtZero: true,
						grid: {
							borderDash: [4, 4],
							color: '#e5e7eb'
						},
						ticks: {
							stepSize: 5,
							font: { size: 11 }
						}
					}
				}
			}
		});
	}




	if (document.getElementById('chartStacked2')) {
		var ctx7 = document.getElementById('chartStacked2');
		new Chart(ctx7, {
			type: 'bar',
			data: {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
				datasets: [{
					data: [14, 12, 34, 25, 24, 20],
					backgroundColor: '#44c4fa',
					borderWidth: 1,
					fill: true
				}, {
					data: [14, 12, 34, 25, 24, 20],
					backgroundColor: '#0D7858',
					borderWidth: 1,
					fill: true
				}]
			},
			options: {
				indexAxis: 'y',
				maintainAspectRatio: false,
				legend: {
					display: false,
					labels: {
						display: false
					}
				},
				scales: {
					y: {
						stacked: true,
						ticks: {
							beginAtZero: true,
							font: { size: 10 },
							max: 80
						}
					},
					x: {
						stacked: true,
						ticks: {
							beginAtZero: true,
							font: { size: 11 }
						}
					}
				}
			}
		});
	}
	/* LINE CHART */
	if (document.getElementById('chartLine1')) {
		var ctx8 = document.getElementById('chartLine1');
		new Chart(ctx8, {
			type: 'line',
			data: {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
				datasets: [{
					data: [14, 12, 34, 25, 44, 36, 35, 25, 30, 32, 20, 25],
					borderColor: '#44c4fa',
					borderWidth: 1,
					fill: false
				}, {
					data: [35, 30, 45, 35, 55, 40, 10, 20, 25, 55, 50, 45],
					borderColor: '#0D7858',
					borderWidth: 1,
					fill: false
				}]
			},
			options: {
				maintainAspectRatio: false,
				legend: {
					display: false,
					labels: {
						display: false
					}
				},
				scales: {
					yAxeys: {
						ticks: {
							beginAtZero: true,
							font: { size: 10 },
							max: 80
						}
					},
					y: {
						ticks: {
							beginAtZero: true,
							font: { size: 11 }
						}
					}
				}
			}
		});
	}
	/** AREA CHART **/
	if (document.getElementById('chartArea1')) {
		var ctx9 = document.getElementById('chartArea1');
		ctx9.height = 220;

		var gradient1 = ctx3.createLinearGradient(0, 350, 0, 0);
		gradient1.addColorStop(0, 'rgba(102, 77, 201,0)');
		gradient1.addColorStop(1, 'rgba(102, 77, 201,.5)');
		var gradient2 = ctx3.createLinearGradient(0, 280, 0, 0);
		gradient2.addColorStop(0, 'rgba(91, 115, 232,0)');
		gradient2.addColorStop(1, 'rgba(91, 115, 232,.5)');
		new Chart(ctx9, {
			type: 'line',
			data: {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
				datasets: [{
					data: [14, 12, 34, 25, 44, 36, 35, 25, 30, 32, 20, 25],
					borderColor: '#44c4fa',
					borderWidth: 1,
					backgroundColor: gradient1
				}, {
					data: [35, 30, 45, 35, 55, 40, 10, 20, 25, 65, 50, 45],
					borderColor: '#0D7858',
					borderWidth: 1,
					backgroundColor: gradient2
				}]
			},
			options: {
				maintainAspectRatio: false,
				legend: {
					display: false,
					labels: {
						display: false
					}
				},
				scales: {
					y: {
						ticks: {
							beginAtZero: true,
							font: { size: 10 },
							max: 100
						}
					},
					x: {
						ticks: {
							beginAtZero: true,
							font: { size: 11 }
						}
					}
				}
			}
		});

		/** PIE CHART **/
		var datapie = {
			labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
			datasets: [{
				data: [35, 20, 8, 15, 24],
				backgroundColor: ['#664dc9', '#44c4fa', '#38cb89', '#3e80eb', '#ffab00', '#ef4b4b']
			}]
		};
		var optionpie = {
			maintainAspectRatio: false,
			responsive: true,
			legend: {
				display: false,
			},
			animation: {
				animateScale: true,
				animateRotate: true
			}
		};
	}
	// For a doughnut chart
	if (document.getElementById('chartPie')) {
		var ctx6 = document.getElementById('chartPie');
		var myPieChart6 = new Chart(ctx6, {
			type: 'doughnut',
			data: datapie,
			options: optionpie
		});
		/** PIE CHART **/
		var datapie = {
			labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
			datasets: [{
				data: [35, 20, 8, 15, 24],
				backgroundColor: ['#44c4fa', '#1976D2', '#6A1B9A', '#303F9F', '#FDAF22', '#09800F']
			}]
		};
		var optionpie = {
			maintainAspectRatio: false,
			responsive: true,
			legend: {
				display: false,
			},
			animation: {
				animateScale: true,
				animateRotate: true
			}
		};
	}
	// For a pie chart
	if (document.getElementById('chartDonut')) {
		var ctx7 = document.getElementById('chartDonut');
		var myPieChart7 = new Chart(ctx7, {
			type: 'pie',
			data: datapie,
			options: optionpie
		});
		/** PIE CHART **/
		var datapie = {
			labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
			datasets: [{
				data: [35, 20, 8, 15, 24],
				backgroundColor: ['#44c4fa', '#1976D2', '#6A1B9A', '#303F9F', '#FDAF22', '#09800F']
			}]
		};
		var optionpie = {
			maintainAspectRatio: false,
			responsive: true,
			legend: {
				display: false,
			},
			animation: {
				animateScale: true,
				animateRotate: true
			}
		};

		const data = {
			datasets: [{
				label: 'Appointment',
				data: [{
					x: -10,
					y: 0
				}, {
					x: 0,
					y: 10
				}, {
					x: 10,
					y: 5
				}, {
					x: 0.5,
					y: 5.5
				}],
				backgroundColor: '#1F9CC6'
			}],
		};

		var ctx12 = document.getElementById('chartRadar');
		var radar = new Chart(ctx12, {
			type: 'scatter',
			data: data,
			options: {
				scales: {
					x: {
						type: 'linear',
						position: 'bottom'
					}
				}
			}
		});
	}

	if (document.getElementById('mySemiDonutChart')) {
		var ctx = document.getElementById('mySemiDonutChart').getContext('2d');
		var mySemiDonutChart = new Chart(ctx, {
			type: 'doughnut', // Chart type
			data: {
				labels: ['Ongoing', 'Onhold', 'Completed', 'Overdue'],
				datasets: [{
					label: 'Semi Donut',
					data: [20, 40, 20, 10],
					backgroundColor: ['#FFC107', '#1B84FF', '#44c4fa', '#0D7858'],
					borderWidth: -10,
					borderColor: 'transparent', // Border between segments
					hoverBorderWidth: 0,   // Border radius for curved edges
					cutout: '75%',
					spacing: -30,
				}]
			},
			options: {
				rotation: -90,
				circumference: 185,
				layout: {
					padding: {
						top: -20,    // Set to 0 to remove top padding
						bottom: 20, // Set to 0 to remove bottom padding
					}
				},
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false // Hide the legend
					}
				}, elements: {
					arc: {
						borderWidth: -30, // Ensure consistent overlap
						borderRadius: 30, // Add some rounding
					}
				},
			}
		});
	}


	if (document.getElementById('attendance')) {
		var ctx = document.getElementById('attendance').getContext('2d');
		var mySemiDonutChart = new Chart(ctx, {
			type: 'doughnut', // Chart type
			data: {
				labels: ['Late', 'Present', 'Permission', 'Absent'],
				datasets: [{
					label: 'Semi Donut',
					data: [40, 20, 30, 10],
					backgroundColor: ['#0C4B5E', '#03C95A', '#FFC107', '#E70D0D'],
					borderWidth: 5,
					borderRadius: 10,
					borderColor: '#fff', // Border between segments
					hoverBorderWidth: 0,   // Border radius for curved edges
					cutout: '60%',
				}]
			},
			options: {
				rotation: -100,
				circumference: 200,
				layout: {
					padding: {
						top: -20,    // Set to 0 to remove top padding
						bottom: -20, // Set to 0 to remove bottom padding
					}
				},
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false // Hide the legend
					}
				},
			}
		});
	}


	if (document.getElementById('deal_chart')) {

		const ctx = document.getElementById('deal_chart');
	  
		new Chart(ctx, {
		  type: 'doughnut',
		  data: {
			labels: ['Email', 'Chat', 'Sales'],
			datasets: [{
			  data: [45, 25, 30],
			  backgroundColor: [
				'#3f6f7f', // blue
				'#ffc107', // yellow
				'#ff6a2c'  // orange
			  ],
			  borderWidth: 0,
			  borderRadius: 20,   // 🔥 rounded arc ends
			  spacing: 6          // 🔥 gap between segments
			}]
		  },
		  options: {
			responsive: false,
			cutout: '75%',        // 🔥 donut thickness
			plugins: {
			  legend: {
				display: false
			  },
			  tooltip: {
				enabled: false
			  }
			}
		  }
		});
	  }
	  if (document.getElementById('training-chart')) {

		const centerTextPlugin = {
			id: 'centerText',
			beforeDraw(chart) {
				const { ctx, chartArea } = chart;
				if (!chartArea) return;
	
				const value = '20%'; 
	
				ctx.save();
				ctx.font = '600 12px Arial';
				ctx.fillStyle = '#fff';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
	
				const x = (chartArea.left + chartArea.right) / 2;
				const y = (chartArea.top + chartArea.bottom) / 2;
	
				ctx.fillText(value, x, y);
				ctx.restore();
			}
		};
	
		var ctx = document.getElementById('training-chart').getContext('2d');
		var mySemiDonutChart = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: ['Training', 'Completed'],
				datasets: [{
					label: 'Semi Donut',
					data: [80, 20],
					backgroundColor: ['#fff', '#F26522'],
					borderWidth: 2,
					borderRadius: 10,
					borderColor: '#3B7080', 
					hoverBorderWidth: 0,   
					cutout: '60%',
				}]
			},
			options: {
				rotation: -90,
				circumference: 360,
				layout: {
					padding: {
						top: -20,    
						bottom: -20, 
					}
				},
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false 
					},
					// THIS REMOVES THE HOVER LABEL ONLY
					tooltip: {
						enabled: false 
					}
				},
			},
			plugins: [centerTextPlugin]
		});
	}

	if (document.getElementById('imageChart')) {
		const imageUrls = [
			'assets/img/users/user-01.jpg',
			'assets/img/users/user-05.jpg',
			'assets/img/users/user-03.jpg',
			'assets/img/users/user-04.jpg',
			'assets/img/users/user-02.jpg',
			'assets/img/users/user-06.jpg',
			'assets/img/users/user-07.jpg',
			'assets/img/users/user-08.jpg',
			'assets/img/users/user-30.jpg',
			'assets/img/users/user-27.jpg',
		];

		const chartData = [100, 95, 100, 100, 100, 70, 45, 78, 75, 80]; // Your data array goes here
		const labels = ['Micheal', 'Martinz', 'Clark', 'Hensrita', 'Lisa', 'Davis', 'Anderson', 'James', 'Merkel', 'Daniel'];

		// Array to store loaded Image objects
		const preloadedImages = [];


		// --- CUSTOM PLUGIN 1: DRAW IMAGES (Uses preloadedImages array) ---
		const imageLabelsPlugin = {
			id: 'imageLabels',
			afterDraw(chart) {
				const { ctx, chartArea: { bottom }, scales: { x } } = chart;
				ctx.save();

				preloadedImages.forEach((image, index) => {
					if (!image || !image.complete) return; // Skip if image not fully loaded

					const xPos = x.getPixelForValue(index);
					const imageSize = 24;
					const imageY = bottom + 10;
					const radius = imageSize / 2;
					const centerX = xPos;
					const centerY = imageY + radius;

					// Draw image (clipping mask ensures circular shape)
					ctx.save(); // Save context before clipping
					ctx.beginPath();
					ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
					ctx.clip();
					ctx.drawImage(image, xPos - radius, imageY, imageSize, imageSize);
					ctx.restore(); // Restore context after clipping

					// White border
					ctx.beginPath();
					ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
					ctx.strokeStyle = '#FFFFFF';
					ctx.lineWidth = 2;
					ctx.stroke();
					ctx.closePath();
				});
				ctx.restore();
			}
		};

		// --- CUSTOM PLUGIN 2: DRAW VERTICAL LINES ---
		// (This plugin is unchanged)
		const verticalLinesPlugin = {
			id: 'verticalLines',
			afterDatasetsDraw(chart) {
				const { ctx, scales: { x, y } } = chart;
				ctx.save();
				ctx.strokeStyle = '#B9CBD1';
				ctx.lineWidth = 6;
				const offset = 2;

				for (let i = 0; i < chart.data.datasets[0].data.length; i++) { // Use datasets[0].data
					const xPos = x.getPixelForValue(i);
					const yPos = y.getPixelForValue(chart.data.datasets[0].data[i]);
					ctx.beginPath();
					ctx.moveTo(xPos, yPos + offset);
					ctx.lineTo(xPos, y.getPixelForValue(0));
					ctx.stroke();
				}
				ctx.restore();
			}
		};


		// --- CHART CONFIGURATION & INITIALIZATION ---
		const config = {
			type: 'line',
			data: {
				labels: labels,
				datasets: [{
					label: 'Score',
					data: chartData,
					pointBackgroundColor: '#0C4B5E',
					pointBorderColor: '#fff',
					pointBorderWidth: 2,
					pointRadius: 6,
					pointHoverRadius: 8,
					showLine: false,
				}]
			},
			options: { /* ... (options remain the same) ... */
				responsive: true, maintainAspectRatio: false,
				layout: { padding: { top: 10, bottom: 25, } },
				scales: {
					y: { min: 0, max: 110, ticks: { stepSize: 25, color: '#9CA3AF' }, grid: { color: '#F3F4F6' } },
					x: { grid: { display: false }, ticks: { display: false } }
				},
				plugins: { legend: { display: false }, tooltip: { enabled: true } }
			},
			plugins: [imageLabelsPlugin, verticalLinesPlugin]
		};


		// Function to preload images and initialize chart
		function initializeChart() {
			let imagesLoadedCount = 0;
			imageUrls.forEach((url, index) => {
				const img = new Image();
				img.src = url;
				img.onload = () => {
					imagesLoadedCount++;
					if (imagesLoadedCount === imageUrls.length) {
						// All images loaded, now render the chart
						const ctx = document.getElementById('imageChart').getContext('2d');
						new Chart(ctx, config);
					}
				};
				preloadedImages[index] = img;
			});
		}

		// Start the process
		initializeChart();
	}

	if (document.getElementById('cost_chart')) {

		const centerTextPlugin = {
			id: 'centerText',
			beforeDraw(chart) {
				const { ctx, chartArea } = chart;
				if (!chartArea) return;

				const value = '$2,458,900'; // text you want to show

				ctx.save();
				ctx.font = '600 12px Arial';
				ctx.fillStyle = '#111827';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'bottom';

				const x = (chartArea.left + chartArea.right) / 2;
				const y = chartArea.bottom - 50;

				ctx.fillText(value, x, y);
				ctx.restore();
			}
		};
		var ctx = document.getElementById('cost_chart').getContext('2d');
		var myDonutChart = new Chart(ctx, {
			type: 'doughnut', // Chart type
			data: {
				labels: ['Salaries', 'Benefits', 'Bonuses', 'Overtime', 'Training', 'Incentives'],
				datasets: [{
					label: 'Semi Donut',
					data: [40, 10, 10, 20, 10, 10],
					backgroundColor: ['#0C4B5E', '#618B98', '#7298A4', '#84A5AF', '#95B2BB', '#A7BFC6'],
					borderWidth: 5,
					borderRadius: 10,
					borderColor: '#fff', // Border between segments
					hoverBorderWidth: 0,   // Border radius for curved edges
					cutout: '80%',
				}]
			},
			options: {
				rotation: -90,
				circumference: 180,
				layout: {
					padding: {
						top: -20,    // Set to 0 to remove top padding
						bottom: -20, // Set to 0 to remove bottom padding
					}
				},
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false // Hide the legend
					}
				},
			},
			
		   plugins: [centerTextPlugin]
		});
	}

	if (document.getElementById('imageChartWeek')) {
	const imageUrls = [
           'assets/img/users/user-01.jpg', 
          'assets/img/users/user-05.jpg', 
          'assets/img/users/user-03.jpg', 
          'assets/img/users/user-04.jpg', 
          'assets/img/users/user-02.jpg', 
          'assets/img/users/user-06.jpg', 
          'assets/img/users/user-07.jpg', 
          'assets/img/users/user-08.jpg', 
          'assets/img/users/user-30.jpg', 
          'assets/img/users/user-27.jpg', 
        ];

        const chartData = [100, 95, 100, 100, 100, 70, 45, 78, 75, 80]; // Your data array goes here
        const labels = ['Micheal', 'Martinz', 'Clark', 'Hensrita', 'Lisa', 'Davis', 'Anderson', 'James', 'Merkel', 'Daniel'];

        // Array to store loaded Image objects
        const preloadedImages = [];


        // --- CUSTOM PLUGIN 1: DRAW IMAGES (Uses preloadedImages array) ---
        const imageLabelsPlugin = {
            id: 'imageLabels',
            afterDraw(chart) {
                const {ctx, chartArea: {bottom}, scales: {x}} = chart;
                ctx.save();

                preloadedImages.forEach((image, index) => {
                    if (!image || !image.complete) return; // Skip if image not fully loaded

                    const xPos = x.getPixelForValue(index);
                    const imageSize = 24; 
                    const imageY = bottom + 10;
                    const radius = imageSize / 2;
                    const centerX = xPos;
                    const centerY = imageY + radius;

                    // Draw image (clipping mask ensures circular shape)
                    ctx.save(); // Save context before clipping
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.clip(); 
                    ctx.drawImage(image, xPos - radius, imageY, imageSize, imageSize);
                    ctx.restore(); // Restore context after clipping

                    // White border
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.closePath();
                });
                ctx.restore();
            }
        };

        // --- CUSTOM PLUGIN 2: DRAW VERTICAL LINES ---
        // (This plugin is unchanged)
        const verticalLinesPlugin = {
            id: 'verticalLines',
            afterDatasetsDraw(chart) {
                const {ctx, scales: {x, y}} = chart;
                ctx.save();
                ctx.strokeStyle = '#B9CBD1'; 
                ctx.lineWidth = 6; 
                const offset = 2; 

                for (let i = 0; i < chart.data.datasets[0].data.length; i++) { // Use datasets[0].data
                    const xPos = x.getPixelForValue(i);
                    const yPos = y.getPixelForValue(chart.data.datasets[0].data[i]);
                    ctx.beginPath();
                    ctx.moveTo(xPos, yPos + offset); 
                    ctx.lineTo(xPos, y.getPixelForValue(0)); 
                    ctx.stroke();
                }
                ctx.restore();
            }
        };


        // --- CHART CONFIGURATION & INITIALIZATION ---
        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score',
                    data: chartData,
                    pointBackgroundColor: '#0C4B5E', 
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false, 
                }]
            },
            options: { /* ... (options remain the same) ... */
                responsive: true, maintainAspectRatio: false,
                layout: { padding: { top: 10, bottom: 25, } },
                scales: {
                    y: { min: 0, max: 110, ticks: { stepSize: 25, color: '#9CA3AF' }, grid: { color: '#F3F4F6' } },
                    x: { grid: { display: false }, ticks: { display: false } }
                },
                plugins: { legend: { display: false }, tooltip: { enabled: true } }
            },
            plugins: [imageLabelsPlugin, verticalLinesPlugin]
        };

        
        // Function to preload images and initialize chart
        function initializeChart() {
            let imagesLoadedCount = 0;
            imageUrls.forEach((url, index) => {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    imagesLoadedCount++;
                    if (imagesLoadedCount === imageUrls.length) {
                        // All images loaded, now render the chart
                        const ctx = document.getElementById('imageChartWeek').getContext('2d');
                        new Chart(ctx, config);
                    }
                };
                preloadedImages[index] = img;
            });
        }

        // Start the process
        initializeChart();
	}


	if (document.getElementById('imageChartMonth')) {
	const imageUrls = [
           'assets/img/users/user-01.jpg', 
          'assets/img/users/user-05.jpg', 
          'assets/img/users/user-03.jpg', 
          'assets/img/users/user-04.jpg', 
          'assets/img/users/user-02.jpg', 
          'assets/img/users/user-06.jpg', 
          'assets/img/users/user-07.jpg', 
          'assets/img/users/user-08.jpg', 
          'assets/img/users/user-30.jpg', 
          'assets/img/users/user-27.jpg', 
        ];

        const chartData = [100, 95, 100, 100, 100, 70, 45, 78, 75, 80]; // Your data array goes here
        const labels = ['Micheal', 'Martinz', 'Clark', 'Hensrita', 'Lisa', 'Davis', 'Anderson', 'James', 'Merkel', 'Daniel'];

        // Array to store loaded Image objects
        const preloadedImages = [];


        // --- CUSTOM PLUGIN 1: DRAW IMAGES (Uses preloadedImages array) ---
        const imageLabelsPlugin = {
            id: 'imageLabels',
            afterDraw(chart) {
                const {ctx, chartArea: {bottom}, scales: {x}} = chart;
                ctx.save();

                preloadedImages.forEach((image, index) => {
                    if (!image || !image.complete) return; // Skip if image not fully loaded

                    const xPos = x.getPixelForValue(index);
                    const imageSize = 24; 
                    const imageY = bottom + 10;
                    const radius = imageSize / 2;
                    const centerX = xPos;
                    const centerY = imageY + radius;

                    // Draw image (clipping mask ensures circular shape)
                    ctx.save(); // Save context before clipping
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.clip(); 
                    ctx.drawImage(image, xPos - radius, imageY, imageSize, imageSize);
                    ctx.restore(); // Restore context after clipping

                    // White border
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.closePath();
                });
                ctx.restore();
            }
        };

        // --- CUSTOM PLUGIN 2: DRAW VERTICAL LINES ---
        // (This plugin is unchanged)
        const verticalLinesPlugin = {
            id: 'verticalLines',
            afterDatasetsDraw(chart) {
                const {ctx, scales: {x, y}} = chart;
                ctx.save();
                ctx.strokeStyle = '#B9CBD1'; 
                ctx.lineWidth = 6; 
                const offset = 2; 

                for (let i = 0; i < chart.data.datasets[0].data.length; i++) { // Use datasets[0].data
                    const xPos = x.getPixelForValue(i);
                    const yPos = y.getPixelForValue(chart.data.datasets[0].data[i]);
                    ctx.beginPath();
                    ctx.moveTo(xPos, yPos + offset); 
                    ctx.lineTo(xPos, y.getPixelForValue(0)); 
                    ctx.stroke();
                }
                ctx.restore();
            }
        };


        // --- CHART CONFIGURATION & INITIALIZATION ---
        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score',
                    data: chartData,
                    pointBackgroundColor: '#0C4B5E', 
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false, 
                }]
            },
            options: { /* ... (options remain the same) ... */
                responsive: true, maintainAspectRatio: false,
                layout: { padding: { top: 10, bottom: 25, } },
                scales: {
                    y: { min: 0, max: 110, ticks: { stepSize: 25, color: '#9CA3AF' }, grid: { color: '#F3F4F6' } },
                    x: { grid: { display: false }, ticks: { display: false } }
                },
                plugins: { legend: { display: false }, tooltip: { enabled: true } }
            },
            plugins: [imageLabelsPlugin, verticalLinesPlugin]
        };

        
        // Function to preload images and initialize chart
        function initializeChart() {
            let imagesLoadedCount = 0;
            imageUrls.forEach((url, index) => {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    imagesLoadedCount++;
                    if (imagesLoadedCount === imageUrls.length) {
                        // All images loaded, now render the chart
                        const ctx = document.getElementById('imageChartMonth').getContext('2d');
                        new Chart(ctx, config);
                    }
                };
                preloadedImages[index] = img;
            });
        }

        // Start the process
        initializeChart();
	}


	if (document.getElementById('imageChartYear')) {
	const imageUrls = [
           'assets/img/users/user-01.jpg', 
          'assets/img/users/user-05.jpg', 
          'assets/img/users/user-03.jpg', 
          'assets/img/users/user-04.jpg', 
          'assets/img/users/user-02.jpg', 
          'assets/img/users/user-06.jpg', 
          'assets/img/users/user-07.jpg', 
          'assets/img/users/user-08.jpg', 
          'assets/img/users/user-30.jpg', 
          'assets/img/users/user-27.jpg', 
        ];

        const chartData = [100, 95, 100, 100, 100, 70, 45, 78, 75, 80]; // Your data array goes here
        const labels = ['Micheal', 'Martinz', 'Clark', 'Hensrita', 'Lisa', 'Davis', 'Anderson', 'James', 'Merkel', 'Daniel'];

        // Array to store loaded Image objects
        const preloadedImages = [];


        // --- CUSTOM PLUGIN 1: DRAW IMAGES (Uses preloadedImages array) ---
        const imageLabelsPlugin = {
            id: 'imageLabels',
            afterDraw(chart) {
                const {ctx, chartArea: {bottom}, scales: {x}} = chart;
                ctx.save();

                preloadedImages.forEach((image, index) => {
                    if (!image || !image.complete) return; // Skip if image not fully loaded

                    const xPos = x.getPixelForValue(index);
                    const imageSize = 24; 
                    const imageY = bottom + 10;
                    const radius = imageSize / 2;
                    const centerX = xPos;
                    const centerY = imageY + radius;

                    // Draw image (clipping mask ensures circular shape)
                    ctx.save(); // Save context before clipping
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.clip(); 
                    ctx.drawImage(image, xPos - radius, imageY, imageSize, imageSize);
                    ctx.restore(); // Restore context after clipping

                    // White border
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.closePath();
                });
                ctx.restore();
            }
        };

        // --- CUSTOM PLUGIN 2: DRAW VERTICAL LINES ---
        // (This plugin is unchanged)
        const verticalLinesPlugin = {
            id: 'verticalLines',
            afterDatasetsDraw(chart) {
                const {ctx, scales: {x, y}} = chart;
                ctx.save();
                ctx.strokeStyle = '#B9CBD1'; 
                ctx.lineWidth = 6; 
                const offset = 2; 

                for (let i = 0; i < chart.data.datasets[0].data.length; i++) { // Use datasets[0].data
                    const xPos = x.getPixelForValue(i);
                    const yPos = y.getPixelForValue(chart.data.datasets[0].data[i]);
                    ctx.beginPath();
                    ctx.moveTo(xPos, yPos + offset); 
                    ctx.lineTo(xPos, y.getPixelForValue(0)); 
                    ctx.stroke();
                }
                ctx.restore();
            }
        };


        // --- CHART CONFIGURATION & INITIALIZATION ---
        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score',
                    data: chartData,
                    pointBackgroundColor: '#0C4B5E', 
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false, 
                }]
            },
            options: { /* ... (options remain the same) ... */
                responsive: true, maintainAspectRatio: false,
                layout: { padding: { top: 10, bottom: 25, } },
                scales: {
                    y: { min: 0, max: 110, ticks: { stepSize: 25, color: '#9CA3AF' }, grid: { color: '#F3F4F6' } },
                    x: { grid: { display: false }, ticks: { display: false } }
                },
                plugins: { legend: { display: false }, tooltip: { enabled: true } }
            },
            plugins: [imageLabelsPlugin, verticalLinesPlugin]
        };

        
        // Function to preload images and initialize chart
        function initializeChart() {
            let imagesLoadedCount = 0;
            imageUrls.forEach((url, index) => {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    imagesLoadedCount++;
                    if (imagesLoadedCount === imageUrls.length) {
                        // All images loaded, now render the chart
                        const ctx = document.getElementById('imageChartYear').getContext('2d');
                        new Chart(ctx, config);
                    }
                };
                preloadedImages[index] = img;
            });
        }

        // Start the process
        initializeChart();
	}


});




// Tickets by Category
if (document.getElementById('ticket-category')) {

  const ctx = document.getElementById('ticket-category');

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['IT Support', 'HR', 'Payroll', 'Access', 'Hardware', 'Other'],  
      datasets: [{
        data: [30, 12, 10, 18, 8, 12],
        backgroundColor: [
          '#F68B4A',
          '#6E8F99',
          '#45C676',
          '#F2BE1A',
          '#4C8DFF',
          '#E53935'
        ],
        borderColor: '#ffffff',
        borderWidth: 3,
        borderRadius: 8,
        spacing: 1
      }]
    },

    options: {
      rotation: -90,
      circumference: 180,
      cutout: '72%',

      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: { display: false },

        tooltip: {
          enabled: true,
          backgroundColor: '#111827',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 10,
          cornerRadius: 6,
          displayColors: false,

          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.parsed}`;
            }
          }
        }
      }
    }
  });
}



window.addEventListener('DOMContentLoaded', (event) => {
    // We use a specific selector to make sure we get the <canvas> 
    // even if the ID is shared or nested inside a div
    const canvas = document.querySelector('canvas#recruitment');

    if (canvas && typeof canvas.getContext === 'function') {
        const ctx = canvas.getContext('2d');
        
        const totalSegments = 15;
        const filledSegments = 7;
        const data = Array(totalSegments).fill(1);

        const colors = data.map((_, i) =>
            i < filledSegments ? '#FF7028' : '#F3F4F6'
        );

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    borderRadius: 12,
                    spacing: 10,
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                rotation: -110,
                circumference: 220,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    } else {
        " ";
    }
});
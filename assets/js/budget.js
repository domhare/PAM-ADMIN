/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/
(function () {
	"use strict";

	// Budgets
	document.addEventListener('click', function (e) {
		if (!e.target.closest('.add-revenue')) return;

		var revenuescontent = '<div class="row align-items-end revenues-cont">' +
			'<div class="col-md-6">' +
				'<div class="mb-3">' +
					'<input type="text" class="form-control">' +
				'</div>' +
			'</div>' +
			'<div class="col-md-6">' +
				'<div class="d-flex align-items-center mb-3">' +
					'<div>' +
						'<div class="d-flex align-items-center">' +
							'<input type="text" class="form-control">' +
							'<div class="ms-2">' +
								'<a href="javascript:void(0);" class="btn btn-icon trash-revenue btn-sm btn-primary rounded-circle"><i class="ti ti-trash"></i></a>' +
							'</div>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>';

		var container = document.querySelector('.revenues-content');
		if (container) container.insertAdjacentHTML('beforeend', revenuescontent);
		e.preventDefault();
	});

	// Remove Budget
	document.addEventListener('click', function (e) {
		var trashRevenue = e.target.closest('.trash-revenue');
		if (!trashRevenue) return;
		var row = trashRevenue.closest('.revenues-cont');
		if (row) row.remove();
		e.preventDefault();
	});

	// Add Expense
	document.addEventListener('click', function (e) {
		if (!e.target.closest('.add-expenses')) return;

		var expensescontent = '<div class="row align-items-end expenses-cont">' +
			'<div class="col-md-6">' +
				'<div class="mb-3">' +
					'<input type="text" class="form-control">' +
				'</div>' +
			'</div>' +
			'<div class="col-md-6">' +
				'<div class="d-flex align-items-center mb-3">' +
					'<div>' +
						'<div class="d-flex align-items-center">' +
							'<input type="text" class="form-control">' +
							'<div class="ms-2">' +
								'<a href="javascript:void(0);" class="btn btn-icon trash-expenses btn-sm btn-primary rounded-circle"><i class="ti ti-trash"></i></a>' +
							'</div>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>';

		var container = document.querySelector('.expenses-content');
		if (container) container.insertAdjacentHTML('beforeend', expensescontent);
		e.preventDefault();
	});

	// Remove Expense
	document.addEventListener('click', function (e) {
		var trashExpenses = e.target.closest('.trash-expenses');
		if (!trashExpenses) return;
		var row = trashExpenses.closest('.expenses-cont');
		if (row) row.remove();
		e.preventDefault();
	});

})();

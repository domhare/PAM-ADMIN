/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/
(function () {
	"use strict";

	// Add Salary Settings

	document.addEventListener('click', function (e) {
		if (!e.target.closest('.add-salary-btn')) return;

		var expensescontent = '<div class="row salary-add-row">' +
			'<div class="col-md-4">' +
				'<div class="mb-3">' +
					'<label class="form-label">Salary From</label>' +
					'<input type="text" class="form-control">' +
				'</div>' +
			'</div>' +
			'<div class="col-md-4">' +
				'<div class="mb-3">' +
					'<label class="form-label">Salary To</label>' +
					'<input type="text" class="form-control">' +
				'</div>' +
			'</div>' +
			' <div class="col-md-4">' +
				'<div class="d-flex align-items-center">' +
					'<div class="mb-3 flex-fill">' +
						'<label class="form-label">Percentage</label>' +
						'<input type="text" class="form-control">' +
					'</div>' +
					'<div class="d-flex align-items-center pt-3 ms-3">' +
						'<a href="#" class="avatar avatar-md rounded bg-gray delete-salary text-primary"><i class="ti ti-trash"></i></a>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>' +
	'</div>';

		var container = document.querySelector('.add-salary-info');
		if (container) container.insertAdjacentHTML('beforeend', expensescontent);
		e.preventDefault();
	});

	// Remove Salary
	document.addEventListener('click', function (e) {
		var deleteSalary = e.target.closest('.delete-salary');
		if (!deleteSalary) return;
		var row = deleteSalary.closest('.salary-add-row');
		if (row) row.remove();
		e.preventDefault();
	});

})();

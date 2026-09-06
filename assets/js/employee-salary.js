/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/
(function () {
	"use strict";

	function initNewSelects(container) {
		container.querySelectorAll('.select').forEach(function (el) {
			if (!el.tomselect) new TomSelect(el, { width: '100%', controlInput: null });
		});
	}

	//Earnings Append
	document.addEventListener('click', function (e) {
		if (!e.target.closest('.add-earnings')) return;

		var expandearning =
			'<div class="row earning-add-row">' +
				'<div class="col-md-3">' +
					'<div class="mb-3">' +
						'<label class="form-label">Basic</label>' +
						'<input type="text" class="form-control">' +
					'</div>' +
				'</div>' +
				'<div class="col-md-3">' +
					'<div class="mb-3">' +
						'<label class="form-label">DA(40%)</label>' +
						'<input type="text" class="form-control">' +
					'</div>' +
				'</div>' +
				'<div class="col-md-3">' +
					'<div class="mb-3">' +
						'<label class="form-label">HRA(15%)</label>' +
						'<input type="text" class="form-control">' +
					'</div>' +
				'</div>' +
				'<div class="col-md-3 d-flex align-items-center">' +
					'<div class="mb-3">' +
						'<label class="form-label">Conveyance</label>' +
						'<input type="text" class="form-control">' +
					'</div>' +
				'</div>' +
				'<div class="col-md-3">' +
					'<div class="mb-3">' +
						'<label class="form-label">Allowance </label>' +
						'<input type="text" class="form-control">' +
					'</div>' +
				'</div>' +
				'<div class="col-md-3">' +
					'<div class="mb-3">' +
						'<label class="form-label">Medical Allowance</label>' +
						'<input type="text" class="form-control">' +
					'</div>' +
				'</div>' +
				'<div class="col-md-3">' +
					'<div class="mb-3">' +
						'<label class="form-label">Others</label>' +
						'<div class="d-flex align-items-center">' +
						'<input type="text" class="form-control"> ' +
						'<a href="#" class="link-danger ms-2 delete-earning"><i class="far fa-trash-alt"></i></a>' +
						'<div>' +
					'</div>' +
				'</div>' +
			'</div>';
		var container = document.querySelector('.earning-row');
		if (container) {
			container.insertAdjacentHTML('beforeend', expandearning);
			initNewSelects(container);
		}
		e.preventDefault();
	});

	// Remove earning
	document.addEventListener('click', function (e) {
		var deleteEarning = e.target.closest('.delete-earning');
		if (!deleteEarning) return;
		var row = deleteEarning.closest('.earning-add-row');
		if (row) row.remove();
		e.preventDefault();
	});

	//Deduction Append
	document.addEventListener('click', function (e) {
		if (!e.target.closest('.add-deduction')) return;

		var expanddeduction =
			'<div class="row deduction-add-row">' +
				'<div class="col-md-3">' +
					'<div class="mb-3">' +
						'<label class="form-label">TDS</label>' +
						'<input type="text" class="form-control">' +
					'</div>' +
				'</div>' +
				'<div class="col-md-3">' +
					'<div class="mb-3">' +
						'<label class="form-label">ESI</label>' +
						'<input type="text" class="form-control">' +
					'</div>' +
				'</div>' +
				'<div class="col-md-3">' +
					'<div class="mb-3">' +
						'<label class="form-label">PF</label>' +
						'<input type="text" class="form-control">' +
					'</div>' +
				'</div>' +
				'<div class="col-md-3 d-flex align-items-center">' +
					'<div class="mb-3">' +
						'<label class="form-label">Leave</label>' +
						'<input type="text" class="form-control">' +
					'</div>' +
				'</div>' +
				'<div class="col-md-3">' +
					'<div class="mb-3">' +
						'<label class="form-label">Prof.Tax</label>' +
						'<input type="text" class="form-control">' +
					'</div>	' +
				'</div>' +
				'<div class="col-md-3">' +
					'<div class="mb-3">' +
						'<label class="form-label">Labour Welfare</label>' +
						'<input type="text" class="form-control">' +
					'</div>' +
				'</div>' +
				'<div class="col-md-3">' +
					'<div class="mb-3">' +
						'<label class="form-label">Others</label>' +
						'<div class="d-flex align-items-center">' +
						'<input type="text" class="form-control">' +
						'<a href="#" class="link-danger ms-2 delete-deduction"><i class="far fa-trash-alt"></i></a>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>';
		var container = document.querySelector('.deduction-row');
		if (container) {
			container.insertAdjacentHTML('beforeend', expanddeduction);
			initNewSelects(container);
		}
		e.preventDefault();
	});

	// Remove earning
	document.addEventListener('click', function (e) {
		var deleteDeduction = e.target.closest('.delete-deduction');
		if (!deleteDeduction) return;
		var row = deleteDeduction.closest('.deduction-add-row');
		if (row) row.remove();
		e.preventDefault();
	});

})();

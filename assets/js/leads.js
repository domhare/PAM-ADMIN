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

	//Leads Append

	// Attach click event to the "add-lead-phno" button
	document.addEventListener('click', function (e) {
		if (!e.target.closest('.add-modal-row')) return;

		// Create the new HTML structure for the additional input and select
		var newRow = '<div class="row phone-add-row">' +
		'<div class="col-lg-8">' +
			'<div class="input-block mb-3">' +
			'<input class="form-control" type="text">' +
			'</div>' +
		'</div>' +
		'<div class="col-lg-4 d-flex align-items-end">' +
			'<div class="input-block w-100 mb-3 d-flex align-items-center">' +
			'<div class="w-100">' +
				'<select class="select">' +
				'<option>Work</option>' +
				'<option>Home</option>' +
				'</select>' +
			'</div>' +
			'<a href="#" class="avatar avatar-md rounded delete-phone text-primary"><i class="ti ti-trash"></i></a>' +
			'</div>' +
		'</div>' +
	  '</div>';

		var container = document.querySelector('.lead-phno-col');
		if (container) {
			container.insertAdjacentHTML('beforeend', newRow);
			initNewSelects(container);
		}
		e.preventDefault();
	});


	// Remove phone
	document.addEventListener('click', function (e) {
		var deletePhone = e.target.closest('.delete-phone');
		if (!deletePhone) return;
		var row = deletePhone.closest('.phone-add-row');
		if (row) row.remove();
		e.preventDefault();
	});

	//email Append

	document.addEventListener('click', function (e) {
		if (!e.target.closest('.add-email-row')) return;

		var expandemail = '<div class="row email-add-row">' +
		  '<div class="col-lg-8">' +
			'<div class="input-block mb-3">' +
			  '<input class="form-control" type="text">' +
			'</div>' +
		  '</div>' +
		  '<div class="col-lg-4 d-flex align-items-end">' +
			'<div class="input-block w-100 mb-3 d-flex align-items-center">' +
			  '<div class="w-100">' +
				'<select class="select">' +
				  '<option>Work</option>' +
				  '<option>Home</option>' +
				'</select>' +
			  '</div>' +
			  '<a href="#" class="avatar avatar-md rounded delete-email text-primary"><i class="ti ti-trash"></i></a>' +
			'</div>' +
		  '</div>' +
	'</div>';

		var container = document.querySelector('.lead-email-col');
		if (container) {
			container.insertAdjacentHTML('beforeend', expandemail);
			initNewSelects(container);
		}
		e.preventDefault();
	});

	// Remove email
	document.addEventListener('click', function (e) {
		var deleteEmail = e.target.closest('.delete-email');
		if (!deleteEmail) return;
		var row = deleteEmail.closest('.email-add-row');
		if (row) row.remove();
		e.preventDefault();
	});

})();

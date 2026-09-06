/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/
(function () {
	"use strict";

	// Add Description
	document.addEventListener('click', function (e) {
		if (!e.target.closest('.add-more-description')) return;

		var servicecontent = '<div class="row extra-title-row">' +
			'<div class="col-md-6">' +
			'<div class="mb-3">' +
			'<label class="form-label">Description</label>' +
			'<input type="text" class="form-control">' +
			'</div>' +
			'</div>' +
			'<div class="col-md-6">' +
			'<div class="row">' +
			'<div class="col-md-4">' +
			'<div class="mb-3">' +
			'<label class="form-label">Qty</label>' +
			'<input type="text" class="form-control">' +
			'</div>' +
			'</div>' +
			'<div class="col-md-4">' +
			'<div class="mb-3">' +
			'<label class="form-label">Discount</label>' +
			'<input type="text" class="form-control">' +
			'</div>' +
			'</div>' +
			'<div class="col-md-4">' +
			'<div class="mb-3">' +
			'<label class="form-label">Rate</label>' +
			'<div class="d-flex align-items-center">' +
			'<input type="text" class="form-control">' +
			'<a href="#" class="link-danger ms-2 delete-item"><i class="far fa-trash-alt"></i></a>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>';
		var container = document.querySelector('.add-description-info');
		if (container) container.insertAdjacentHTML('beforeend', servicecontent);
		e.preventDefault();
	});

	document.addEventListener('click', function (e) {
		var deleteItem = e.target.closest('.add-description-info .delete-item');
		if (!deleteItem) return;
		var row = deleteItem.closest('.extra-title-row');
		if (row) row.remove();
		e.preventDefault();
	});

})();

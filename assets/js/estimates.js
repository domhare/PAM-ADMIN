/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/
(function () {
	"use strict";

	document.addEventListener('click', function (e) {
		if (!e.target.closest('.add-more-estimate')) return;

		var servicecontent = '<div class="row add-title-row">' +
			'<div class="col-md-2">' +
			'<div class="mb-3">' +
			'<label class="form-label">Item</label>' +
			'<input type="text" class="form-control">' +
			'</div>' +
			'</div>' +
			'<div class="col-md-4">' +
			'<div class="mb-3">' +
			'<label class="form-label">Description</label>' +
			'<input type="text" class="form-control">' +
			'</div>' +
			'</div>' +
			'<div class="col-md-2">' +
			'<div class="mb-3">' +
			'<label class="form-label">Unit Cost</label>' +
			'<input type="text" class="form-control">' +
			'</div>' +
			'</div>' +
			'<div class="col-md-2">' +
			'<div class="mb-3">' +
			'<label class="form-label">Qty</label>' +
			'<input type="text" class="form-control">' +
			'</div>' +
			'</div>' +
			'<div class="col-md-2">' +
			'<div class="mb-3">' +
			'<label class="form-label">Amount</label>' +
			'<div class="d-flex align-items-center">' +
			'<input type="text" class="form-control">' +
			'<a href="#" class="link-danger ms-2 delete-item"><i class="far fa-trash-alt"></i></a>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>';
		var container = document.querySelector('.add-estimate-info');
		if (container) container.insertAdjacentHTML('beforeend', servicecontent);
		e.preventDefault();
	});

	document.addEventListener('click', function (e) {
		var deleteItem = e.target.closest('.add-estimate-info .delete-item');
		if (!deleteItem) return;
		var row = deleteItem.closest('.add-title-row');
		if (row) row.remove();
		e.preventDefault();
	});

})();

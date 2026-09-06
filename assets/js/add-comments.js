/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/
(function () {
	"use strict";

	function slideUp(el, duration) {
		if (!el) return;
		duration = duration || 300;
		el.style.height = el.offsetHeight + 'px';
		el.style.transitionProperty = 'height, margin, padding';
		el.style.transitionDuration = duration + 'ms';
		el.offsetHeight; // force reflow
		el.style.overflow = 'hidden';
		el.style.height = '0px';
		el.style.paddingTop = '0px';
		el.style.paddingBottom = '0px';
		el.style.marginTop = '0px';
		el.style.marginBottom = '0px';
		window.setTimeout(function () {
			el.style.display = 'none';
			el.style.removeProperty('height');
			el.style.removeProperty('padding-top');
			el.style.removeProperty('padding-bottom');
			el.style.removeProperty('margin-top');
			el.style.removeProperty('margin-bottom');
			el.style.removeProperty('overflow');
			el.style.removeProperty('transition-duration');
			el.style.removeProperty('transition-property');
		}, duration);
	}

	function slideDown(el, duration) {
		if (!el) return;
		duration = duration || 300;
		el.style.removeProperty('display');
		var display = window.getComputedStyle(el).display;
		if (display === 'none') display = 'block';
		el.style.display = display;
		var height = el.offsetHeight;
		el.style.overflow = 'hidden';
		el.style.height = '0px';
		el.style.paddingTop = '0px';
		el.style.paddingBottom = '0px';
		el.style.marginTop = '0px';
		el.style.marginBottom = '0px';
		el.offsetHeight; // force reflow
		el.style.transitionProperty = 'height, margin, padding';
		el.style.transitionDuration = duration + 'ms';
		el.style.height = height + 'px';
		el.style.removeProperty('padding-top');
		el.style.removeProperty('padding-bottom');
		el.style.removeProperty('margin-top');
		el.style.removeProperty('margin-bottom');
		window.setTimeout(function () {
			el.style.removeProperty('height');
			el.style.removeProperty('overflow');
			el.style.removeProperty('transition-duration');
			el.style.removeProperty('transition-property');
		}, duration);
	}

	function slideToggle(el, duration) {
		if (!el) return;
		if (window.getComputedStyle(el).display === 'none') {
			slideDown(el, duration);
		} else {
			slideUp(el, duration);
		}
	}

	// Add Comment
	if (document.querySelector('.add-comment')) {
		document.querySelectorAll('.add-comment').forEach(function (el) {
			el.addEventListener('click', function () {
				var wrap = this.closest('.notes-editor');
				var editWrap = wrap ? wrap.querySelector('.note-edit-wrap') : null;
				slideToggle(editWrap);
			});
		});
		document.querySelectorAll('.add-cancel').forEach(function (el) {
			el.addEventListener('click', function () {
				var editWrap = this.closest('.note-edit-wrap');
				slideUp(editWrap);
			});
		});
	}

	document.addEventListener('click', function (e) {
		if (!e.target.closest('.add-sign')) return;

		var signcontent = '<div class="row sign-cont">' +
			'<div class="col-md-6">' +
				'<div class="mb-3">' +
					'<input class="form-control" type="text">' +
				'</div>' +
			'</div>' +
			'<div class="col-md-6">' +
				'<div class="d-flex align-items-center mb-3">' +
					'<div class="flex-fill me-2">' +
					'<input class="form-control" type="text">' +
					'</div>' +
					'<div class="input-btn">' +
						'<a href="javascript:void(0);" class="btn btn-icon btn-sm text-primary trash-sign"><i class="ti ti-trash"></i></a>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>';
		var container = document.querySelector('.sign-content');
		if (container) container.insertAdjacentHTML('beforeend', signcontent);
		e.preventDefault();
	});

	// Remove Sign
	document.addEventListener('click', function (e) {
		var trashSign = e.target.closest('.trash-sign');
		if (!trashSign) return;
		var row = trashSign.closest('.sign-cont');
		if (row) row.remove();
		e.preventDefault();
	});

})();

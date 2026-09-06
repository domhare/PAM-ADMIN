/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/
(function () {
	"use strict";

	// Otp Verfication
	document.querySelectorAll('.digit-group input').forEach(function (input) {
		input.setAttribute('maxlength', 1);
		input.addEventListener('keyup', function (e) {
			var parent = input.parentElement;
			if (e.keyCode === 8 || e.keyCode === 37) {
				var prev = parent.querySelector('input#' + input.dataset.previous);
				if (prev) { prev.select(); }
			}
			else if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 96 && e.keyCode <= 105) || e.keyCode === 39) {
				var next = parent.querySelector('input#' + input.dataset.next);
				if (next) {
					next.select();
				} else {
					if (parent.dataset.autosubmit) {
						var form = parent.closest('form');
						if (form) form.submit();
					}
				}
			}
		});
	});
	document.querySelectorAll('.digit-group input').forEach(function (input) {
		input.addEventListener('keyup', function () {
			if (input.value != '') {
				input.classList.add('active');
			} else {
				input.classList.remove('active');
			}
		});
	});

})();

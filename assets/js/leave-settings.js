/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/
(function () {
	"use strict";

	// Leave Settings
	document.querySelectorAll('.edit-leave-btn').forEach(function (el) {
		el.addEventListener('click', function () {
			var target = this.parentElement && this.parentElement.parentElement && this.parentElement.parentElement.parentElement;
			if (target) target.classList.toggle('show');
		});
	});

})();

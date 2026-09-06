/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/
(function () {
	"use strict";

	function percentageToDegrees(percentage) {
		return percentage / 100 * 360
	}

	function updateCircleProgress(el) {
		var value = el.dataset.value;
		var left = el.querySelector('.progress-left .progress-bar');
		var right = el.querySelector('.progress-right .progress-bar');

		if (value > 0) {
			if (value <= 50) {
				right.style.transform = 'rotate(' + percentageToDegrees(value) + 'deg)';
			} else {
				right.style.transform = 'rotate(180deg)';
				left.style.transform = 'rotate(' + percentageToDegrees(value - 50) + 'deg)';
			}
		}
	}

	document.querySelectorAll('.circle-progress').forEach(updateCircleProgress);

	const bottomcenterToast2 = document.querySelectorAll('.delete-toast-btn');
	const bottomcentertoastExample2 = document.querySelectorAll('.delete-toast');

	bottomcenterToast2.forEach((a, index) => {
		a.addEventListener('click', () => {
			const toast = new bootstrap.Toast(bottomcentertoastExample2[index]);
			toast.show();
		});
	});

	document.querySelectorAll('.attendance-circle-progress').forEach(updateCircleProgress);

})();

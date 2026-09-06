/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/

(function () {
	"use strict";

	function wireToggle(selector, toggleClass) {
		document.querySelectorAll(selector).forEach(function (el) {
			el.addEventListener('click', function () {
				var target = this.parentElement && this.parentElement.parentElement;
				if (target) target.classList.toggle(toggleClass);
			});
		});
	}

	// Todo Strike Content
	wireToggle('.todo-item input', 'todo-strike');
	wireToggle('.todo-inbox-check input', 'todo-strike-content');
	wireToggle('.todo-list input', 'todo-strike-content');

})();

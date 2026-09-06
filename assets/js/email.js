/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/

(function () {
	"use strict";

	function slideToggle(el, duration) {
		if (!el) return;
		duration = duration || 300;
		if (window.getComputedStyle(el).display === 'none') {
			el.style.removeProperty('display');
			var display = window.getComputedStyle(el).display;
			if (display === 'none') display = 'block';
			el.style.display = display;
			var height = el.offsetHeight;
			el.style.overflow = 'hidden';
			el.style.height = '0px';
			el.offsetHeight; // force reflow
			el.style.transitionProperty = 'height';
			el.style.transitionDuration = duration + 'ms';
			el.style.height = height + 'px';
			window.setTimeout(function () {
				el.style.removeProperty('height');
				el.style.removeProperty('overflow');
				el.style.removeProperty('transition-duration');
				el.style.removeProperty('transition-property');
			}, duration);
		} else {
			el.style.height = el.offsetHeight + 'px';
			el.style.transitionProperty = 'height';
			el.style.transitionDuration = duration + 'ms';
			el.offsetHeight; // force reflow
			el.style.overflow = 'hidden';
			el.style.height = '0px';
			window.setTimeout(function () {
				el.style.display = 'none';
				el.style.removeProperty('height');
				el.style.removeProperty('overflow');
				el.style.removeProperty('transition-duration');
				el.style.removeProperty('transition-property');
			}, duration);
		}
	}

	function wireViewAll(menuSelector, buttonSelector) {
		var menus = document.querySelectorAll(menuSelector);
		if (menus.length === 0) return;
		menus.forEach(function (menu) { menu.style.display = 'none'; });
		document.querySelectorAll(buttonSelector).forEach(function (btn) {
			btn.addEventListener('click', function () {
				this.textContent = this.textContent === 'Less' ? 'Show More' : 'Less';
				menus.forEach(function (menu) { slideToggle(menu, 900); });
			});
		});
	}

	// View all Show hide One
	wireViewAll('.more-menu', '.viewall-button');
	wireViewAll('.more-menu-2', '.viewall-button-2');
	wireViewAll('.more-menu-3', '.viewall-button-3');

	// Compose Mail Popup
	document.addEventListener('click', function (e) {
		if (!e.target.closest('#compose_mail')) return;
		document.body.insertAdjacentHTML('beforeend', '<div class="modal-backdrop fade show"></div>');
		var composeView = document.getElementById('compose-view');
		if (composeView) composeView.classList.add('show');
	});

	document.addEventListener('click', function (e) {
		if (!e.target.closest('#compose-close')) return;
		var backdrop = document.querySelector('.modal-backdrop');
		if (backdrop) backdrop.remove();
		var composeView = document.getElementById('compose-view');
		if (composeView) composeView.classList.remove('show');
	});

})();

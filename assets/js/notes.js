/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/
(function () {
    "use strict";

	//Notes Slider
	if (document.querySelector('.notes-slider')) {
		new Swiper('.notes-slider', {
			loop: true,
			spaceBetween: 24,
			slidesPerView: 1,
			speed: 2000,
			navigation: {
				nextEl: '.slide-nav5 .swiper-button-next',
				prevEl: '.slide-nav5 .swiper-button-prev'
			},
			breakpoints: {
				768: {
					slidesPerView: 2
				},
				1300: {
					slidesPerView: 3
				}
			}
		});
	}

})();

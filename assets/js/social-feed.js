/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/

(function () {
    "use strict";

	//Channel Logo Slider
	if (document.querySelector('.channels-slider')) {
		new Swiper('.channels-slider', {
			loop: true,
			spaceBetween: 24,
			slidesPerView: 3,
			speed: 2000,
			navigation: {
				nextEl: '.custom-nav .swiper-button-next',
				prevEl: '.custom-nav .swiper-button-prev'
			},
			breakpoints: {
				768: {
					slidesPerView: 8
				},
				1300: {
					slidesPerView: 8
				}
			}
		});
	}

	//Social Gallery Slider
	if (document.querySelector('.social-gallery-slider')) {
		new Swiper('.social-gallery-slider', {
			loop: true,
			spaceBetween: 8,
			slidesPerView: 2,
			speed: 2000,
			breakpoints: {
				768: {
					slidesPerView: 3
				},
				1300: {
					slidesPerView: 4
				}
			}
		});
	}

})();

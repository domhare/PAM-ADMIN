/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/
(function () {
    "use strict";

	// Image Slider
	if (document.querySelector('.media-images-slider')) {
		new Swiper('.media-images-slider', {
			spaceBetween: 15,
			loop: false,
			slidesPerView: 2,
			navigation: {
				nextEl: '.media-images-slider .swiper-button-next',
				prevEl: '.media-images-slider .swiper-button-prev'
			},
			breakpoints: {
				800: {
					slidesPerView: 5
				},
				1170: {
					slidesPerView: 7
				}
			}
		});
	}

})();

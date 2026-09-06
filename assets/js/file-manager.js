/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/

(function () {
    "use strict";

	// Folder Slider
	if (document.querySelector('.folders-carousel')) {
		new Swiper('.folders-carousel', {
			loop: true,
			spaceBetween: 15,
			slidesPerView: 1,
			navigation: {
				nextEl: '.folders-carousel .swiper-button-next',
				prevEl: '.folders-carousel .swiper-button-prev'
			},
			breakpoints: {
				768: {
					slidesPerView: 2
				},
				1400: {
					slidesPerView: 3
				}
			}
		});
	}

	// Files Slider
	if (document.querySelector('.files-carousel')) {
		new Swiper('.files-carousel', {
			slidesPerView: 1,
			loop: true,
			spaceBetween: 15,
			speed: 1000,
			navigation: {
				nextEl: '.files-carousel .swiper-button-next',
				prevEl: '.files-carousel .swiper-button-prev'
			},
			breakpoints: {
				768: {
					slidesPerView: 2
				},
				1200: {
					slidesPerView: 3
				}
			}
		});
	}

	// Video Slider
	if (document.querySelector('.video-section')) {
		var playerSettings = {
			controls : ['play-large'],
			fullscreen : { enabled: false},
			resetOnEnd : true,
			hideControls  :true,
	  		clickToPlay:true,
		    keyboard : false,
		}

		const players = Plyr.setup('.js-player', playerSettings);

		 players.forEach(function(instance,index) {
			instance.on('play',function(){
				players.forEach(function(instance1,index1){
					if(instance != instance1){
						instance1.pause();
					}
				});
			});
		});

		new Swiper('.video-section', {
		    loop: true,
		    spaceBetween: 15,
		    slidesPerView: 1,
			navigation: {
				nextEl: '.video-section .swiper-button-next',
				prevEl: '.video-section .swiper-button-prev'
			},
			breakpoints: {
				768: {
					slidesPerView: 2
				},
				1200: {
					slidesPerView: 3
				}
			},
			on: {
				slideChangeTransitionStart: function() {
					players.forEach(function(instance,index1){
						instance.pause();
					});
				}
			}
		});
	}
	document.querySelectorAll('.video-section, .files-carousel, .folders-carousel').forEach(function (carousel) {
		carousel.addEventListener('show.bs.dropdown', function (e) {
			var toggle = e.target.closest('[data-bs-toggle="dropdown"]');
			if (!toggle) return;
			var menu = toggle.nextElementSibling;
			if (menu && menu.classList.contains('dropdown-menu')) {
				carousel.parentElement.insertBefore(menu, carousel.nextSibling);
			}
		});
	});

})();

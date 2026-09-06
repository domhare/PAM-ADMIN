
(function () {
	"use strict";

	document.addEventListener('click', function (e) {
		if (!e.target.closest('.next')) return;
		var activeTab = document.querySelector('.form-tab .active');
		var activeLi = activeTab ? activeTab.closest('li') : null;
		var nextLi = activeLi ? activeLi.nextElementSibling : null;
		var nextTab = nextLi ? nextLi.querySelector('a') : null;

		if (nextTab) {
			console.log("Next Tab Found:", nextTab.getAttribute('href')); // Debugging
			bootstrap.Tab.getOrCreateInstance(nextTab).show();
		} else {
			console.log("No Next Tab");
		}
	});

	document.addEventListener('click', function (e) {
		if (!e.target.closest('.previous')) return;
		var activeTab = document.querySelector('.form-tab .active');
		var activeLi = activeTab ? activeTab.closest('li') : null;
		var prevLi = activeLi ? activeLi.previousElementSibling : null;
		var prevTab = prevLi ? prevLi.querySelector('a') : null;

		if (prevTab) {
			console.log("Previous Tab Found:", prevTab.getAttribute('href')); // Debugging
			bootstrap.Tab.getOrCreateInstance(prevTab).show();
		} else {
			console.log("No Previous Tab");
		}
	});
})();

/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/

(function () {
	"use strict";

	// Kanban Drag

	document.querySelectorAll('.kanban-drag-wrap').forEach(function (wrap) {
		new Sortable(wrap, {
			group: 'kanban-cards',
			handle: '.kanban-card',
			ghostClass: 'drag-placeholder',
			animation: 150
		});
	});

})();

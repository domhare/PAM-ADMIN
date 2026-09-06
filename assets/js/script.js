/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/

(function () {
	"use strict";

	// Variables declarations
	var wrapper = document.querySelector('.main-wrapper');
	var slimScrolls = document.querySelectorAll('.slimscroll');
	var pageWrapper = document.querySelector('.page-wrapper');
	feather.replace();

	// Page Content Height Resize
	window.addEventListener('resize', function () {
		if (document.querySelector('.page-wrapper')) {
			document.querySelectorAll('.page-wrapper').forEach(function (el) {
				el.style.minHeight = window.innerHeight + 'px';
			});
		}
	});

	// Mobile menu sidebar overlay
	document.body.insertAdjacentHTML('beforeend', '<div class="sidebar-overlay"></div>');

	document.addEventListener('click', function (e) {
		if (e.target.closest('#mobile_btn')) {
			if (wrapper) wrapper.classList.toggle('slide-nav');
			var overlay = document.querySelector('.sidebar-overlay');
			if (overlay) overlay.classList.toggle('opened');
			document.documentElement.classList.add('menu-opened');
			var taskWindow = document.getElementById('task_window');
			if (taskWindow) taskWindow.classList.remove('opened');
			return false;
		}
	});

	document.addEventListener('click', function (e) {
		var overlay = e.target.closest('.sidebar-overlay');
		if (overlay) {
			document.documentElement.classList.remove('menu-opened');
			overlay.classList.remove('opened');
			if (wrapper) wrapper.classList.remove('slide-nav');
			overlay.classList.remove('opened');
			var taskWindow = document.getElementById('task_window');
			if (taskWindow) taskWindow.classList.remove('opened');
		}
	});

	// Logo Hide Btn

	document.addEventListener('click', function (e) {
		var hideset = e.target.closest('.hideset');
		if (hideset) {
			var target = hideset.parentElement && hideset.parentElement.parentElement && hideset.parentElement.parentElement.parentElement;
			if (target) target.style.display = 'none';
		}
	});

	document.addEventListener('click', function (e) {
		var deleteSet = e.target.closest('.delete-set');
		if (deleteSet) {
			var target = deleteSet.parentElement && deleteSet.parentElement.parentElement;
			if (target) target.style.display = 'none';
		}
	});

	// Stick Sidebar: handled via pure CSS (position: sticky) — see assets/scss/layout/_content.scss

	// Datatable — a small vanilla-JS search/sort/pagination controller.
	// Previously used Grid.js, but its bundled Pagination component has an
	// internal processor-registration race (unrelated to our markup — reproduced
	// even against clean tables) that intermittently throws
	// "Cannot read properties of undefined (reading 'length')" and leaves the
	// grid unrendered. Rendering the same .gridjs-* class names ourselves avoids
	// the dependency (and the race) entirely while keeping the existing
	// _gridjs.scss styling working unchanged.
	document.querySelectorAll('.datatable').forEach(function (table) {
		var headerCells = Array.prototype.slice.call(table.querySelectorAll('thead th'));
		if (headerCells.length === 0) return;

		var bodyRowEls = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
		var expectedColumnCount = headerCells.length;
		var pageLimit = 10;

		var columnHasMarkup = headerCells.map(function (th, index) {
			if (th.children.length > 0) return true;
			return bodyRowEls.some(function (tr) {
				var td = tr.children[index];
				return td && td.children.length > 0;
			});
		});

		var columns = headerCells.map(function (th, index) {
			var headerHtml = th.innerHTML ? th.innerHTML.trim() : '';
			return {
				html: headerHtml || '&nbsp;',
				sortable: !th.classList.contains('no-sort') && !columnHasMarkup[index]
			};
		});

		var rows = bodyRowEls.map(function (tr) {
			var cells = Array.prototype.slice.call(tr.querySelectorAll('td'));

			while (cells.length < expectedColumnCount) {
				var emptyTd = document.createElement('td');
				emptyTd.innerHTML = '';
				tr.appendChild(emptyTd);
				cells.push(emptyTd);
			}

			return cells.slice(0, expectedColumnCount).map(function (td) {
				return td ? td.innerHTML.trim() : '';
			});
		});

		var state = {
			keyword: '',
			sortIndex: -1,
			sortDir: 1, // 1 = asc, -1 = desc
			page: 0
		};

		// --- Build static shell (Row Per Page + search box + table + footer) ---
		var container = document.createElement('div');
		container.className = 'gridjs-datatable-wrapper gridjs gridjs-container';

		var head = document.createElement('div');
		head.className = 'gridjs-head';

		var lengthContainer = document.createElement('div');
		lengthContainer.className = 'gridjs-length';
		var lengthLabel = document.createElement('label');
		lengthLabel.innerHTML = 'Row Per Page ';
		var lengthSelect = document.createElement('select');
		lengthSelect.className = 'gridjs-select gridjs-page-limit-select';
		[10, 25, 50, 100].forEach(function (val) {
			var opt = document.createElement('option');
			opt.value = val;
			opt.textContent = val;
			if (val === pageLimit) opt.selected = true;
			lengthSelect.appendChild(opt);
		});
		lengthLabel.appendChild(lengthSelect);
		lengthContainer.appendChild(lengthLabel);

		var search = document.createElement('div');
		search.className = 'gridjs-search';
		var searchInput = document.createElement('input');
		searchInput.type = 'search';
		searchInput.placeholder = 'Search';
		searchInput.className = 'gridjs-input gridjs-search-input';
		search.appendChild(searchInput);

		head.appendChild(lengthContainer);
		head.appendChild(search);

		var wrapper = document.createElement('div');
		wrapper.className = 'gridjs-wrapper';
		var gridTable = document.createElement('table');
		gridTable.className = 'gridjs-table';
		var thead = document.createElement('thead');
		var theadTr = document.createElement('tr');
		theadTr.className = 'gridjs-tr';

		var ths = columns.map(function (col, index) {
			var th = document.createElement('th');
			th.className = 'gridjs-th' + (col.sortable ? ' gridjs-th-sort' : '');
			var contentSpan = document.createElement('span');
			contentSpan.className = 'gridjs-th-content';
			contentSpan.innerHTML = col.html;
			th.appendChild(contentSpan);
			if (col.sortable) {
				var sortBtn = document.createElement('button');
				sortBtn.className = 'gridjs-sort gridjs-sort-neutral';
				sortBtn.setAttribute('title', 'Sort column');
				th.appendChild(sortBtn);
				th.addEventListener('click', function () {
					if (state.sortIndex === index) {
						state.sortDir = state.sortDir === 1 ? -1 : 1;
					} else {
						state.sortIndex = index;
						state.sortDir = 1;
					}
					state.page = 0;
					render();
				});
			}
			theadTr.appendChild(th);
			return th;
		});
		thead.appendChild(theadTr);
		gridTable.appendChild(thead);

		var tbody = document.createElement('tbody');
		tbody.className = 'gridjs-tbody';
		gridTable.appendChild(tbody);
		wrapper.appendChild(gridTable);

		var footer = document.createElement('div');
		footer.className = 'gridjs-footer';
		var pagination = document.createElement('div');
		pagination.className = 'gridjs-pagination';
		var summary = document.createElement('div');
		summary.className = 'gridjs-summary';
		var pages = document.createElement('div');
		pages.className = 'gridjs-pages';
		pagination.appendChild(summary);
		pagination.appendChild(pages);
		footer.appendChild(pagination);

		container.appendChild(head);
		container.appendChild(wrapper);
		container.appendChild(footer);

		table.parentNode.insertBefore(container, table.nextSibling);
		table.style.display = 'none';

		searchInput.addEventListener('input', function () {
			state.keyword = searchInput.value;
			state.page = 0;
			render();
		});

		lengthSelect.addEventListener('change', function () {
			pageLimit = parseInt(lengthSelect.value, 10) || 10;
			state.page = 0;
			render();
		});

		function getFilteredSortedRows() {
			var result = rows;
			if (state.keyword) {
				var needle = state.keyword.toLowerCase();
				result = result.filter(function (row) {
					return row.some(function (cellHtml) {
						var text = cellHtml.replace(/<[^>]*>/g, '').toLowerCase();
						return text.indexOf(needle) !== -1;
					});
				});
			}
			if (state.sortIndex !== -1) {
				var index = state.sortIndex;
				var dir = state.sortDir;
				result = result.slice().sort(function (a, b) {
					var av = a[index].replace(/<[^>]*>/g, '').trim();
					var bv = b[index].replace(/<[^>]*>/g, '').trim();
					var an = parseFloat(av);
					var bn = parseFloat(bv);
					var cmp;
					if (!isNaN(an) && !isNaN(bn) && String(an) === av && String(bn) === bv) {
						cmp = an < bn ? -1 : an > bn ? 1 : 0;
					} else {
						cmp = av.toLowerCase() < bv.toLowerCase() ? -1 : av.toLowerCase() > bv.toLowerCase() ? 1 : 0;
					}
					return cmp * dir;
				});
			}
			return result;
		}

		function render() {
			ths.forEach(function (th, index) {
				var sortBtn = th.querySelector('.gridjs-sort');
				if (!sortBtn) return;
				sortBtn.className = 'gridjs-sort ' + (
					state.sortIndex === index
						? (state.sortDir === 1 ? 'gridjs-sort-asc' : 'gridjs-sort-desc')
						: 'gridjs-sort-neutral'
				);
			});

			var filtered = getFilteredSortedRows();
			var totalRows = filtered.length;
			var totalPages = Math.max(1, Math.ceil(totalRows / pageLimit));
			if (state.page >= totalPages) state.page = totalPages - 1;
			if (state.page < 0) state.page = 0;

			var start = state.page * pageLimit;
			var pageRows = filtered.slice(start, start + pageLimit);

			tbody.innerHTML = '';
			if (pageRows.length === 0) {
				var emptyTr = document.createElement('tr');
				emptyTr.className = 'gridjs-tr';
				var emptyTd = document.createElement('td');
				emptyTd.className = 'gridjs-td gridjs-message';
				emptyTd.colSpan = expectedColumnCount;
				emptyTd.textContent = 'No matching records found';
				emptyTr.appendChild(emptyTd);
				tbody.appendChild(emptyTr);
			} else {
				pageRows.forEach(function (row) {
					var tr = document.createElement('tr');
					tr.className = 'gridjs-tr';
					row.forEach(function (cellHtml) {
						var td = document.createElement('td');
						td.className = 'gridjs-td';
						td.innerHTML = cellHtml;
						tr.appendChild(td);
					});
					tbody.appendChild(tr);
				});
			}

			summary.textContent = totalRows === 0
				? 'No records to show'
				: 'Showing ' + (start + 1) + '-' + Math.min(start + pageLimit, totalRows) + ' of ' + totalRows + ' entries';

			renderPager(totalPages);
		}

		function renderPager(totalPages) {
			pages.innerHTML = '';

			var prevBtn = document.createElement('button');
			prevBtn.title = 'Previous';
			prevBtn.disabled = state.page === 0;
			prevBtn.addEventListener('click', function () {
				state.page--;
				render();
			});
			pages.appendChild(prevBtn);

			for (var i = 0; i < totalPages; i++) {
				(function (pageIndex) {
					var pageBtn = document.createElement('button');
					pageBtn.textContent = String(pageIndex + 1);
					pageBtn.className = pageIndex === state.page ? 'gridjs-currentPage' : '';
					pageBtn.addEventListener('click', function () {
						state.page = pageIndex;
						render();
					});
					pages.appendChild(pageBtn);
				})(i);
			}

			var nextBtn = document.createElement('button');
			nextBtn.title = 'Next';
			nextBtn.disabled = state.page >= totalPages - 1;
			nextBtn.addEventListener('click', function () {
				state.page++;
				render();
			});
			pages.appendChild(nextBtn);
		}

		render();
	});




	setTimeout(function () {
		var loader = document.getElementById('global-loader');
		if (loader) {
			loader.style.transition = 'opacity 200ms linear';
			loader.style.opacity = '0';
			var removeLoader = function () {
				loader.style.display = 'none';
				loader.remove();
			};
			loader.addEventListener('transitionend', removeLoader, { once: true });
			// Fallback in case transitionend doesn't fire (e.g. display already none)
			setTimeout(removeLoader, 250);
		}
	}, 50); // Increased to 50ms to allow Firefox to initialize the element

	// Datetimepicker -> Flatpickr
	if (document.querySelector('.datetimepicker')) {
		flatpickr('.datetimepicker', {
			dateFormat: 'd-m-Y'
		});
	}

	// toggle-password
	document.addEventListener('click', function (e) {
		var toggle = e.target.closest('.toggle-password');
		if (toggle) {
			toggle.classList.toggle('ti-eye');
			toggle.classList.toggle('ti-eye-off');
			var input = document.querySelector('.pass-input');
			if (input) {
				input.setAttribute('type', input.getAttribute('type') === 'password' ? 'text' : 'password');
			}
		}
	});
	document.addEventListener('click', function (e) {
		var toggle = e.target.closest('.toggle-passwords');
		if (toggle) {
			toggle.classList.toggle('ti-eye');
			toggle.classList.toggle('ti-eye-off');
			var input = document.querySelector('.pass-inputs');
			if (input) {
				input.setAttribute('type', input.getAttribute('type') === 'password' ? 'text' : 'password');
			}
		}
	});
	document.addEventListener('click', function (e) {
		var toggle = e.target.closest('.toggle-passworda');
		if (toggle) {
			toggle.classList.toggle('ti-eye');
			toggle.classList.toggle('ti-eye-off');
			var input = document.querySelector('.pass-inputa');
			if (input) {
				input.setAttribute('type', input.getAttribute('type') === 'password' ? 'text' : 'password');
			}
		}
	});

	// Select -> Tom Select
	// (bare `.select2` init lives in custom-tom-select.js — not duplicated here)

	if (document.querySelector('.select')) {
		document.querySelectorAll('.select').forEach(function (el) {
			if (!el.tomselect) new TomSelect(el, { width: '100%', controlInput: null });
		});
	}

	// Tags input -> Tom Select (tags/create mode, replaces bootstrap-tagsinput)
	if (document.querySelector('[data-role="tagsinput"]')) {
		document.querySelectorAll('[data-role="tagsinput"]').forEach(function (el) {
			if (el.tomselect) return;
			var initialValues = (el.value || '').split(',').map(function (v) { return v.trim(); }).filter(Boolean);
			new TomSelect(el, {
				plugins: ['remove_button'],
				persist: false,
				createOnBlur: true,
				create: true,
				valueField: 'value',
				labelField: 'value',
				searchField: 'value',
				options: initialValues.map(function (v) { return { value: v }; }),
				items: initialValues
			});
		});
	}

	// Select Image -> Tom Select

	if (document.querySelector('.select-img')) {
		function formatStateImg(data, escape) {
			var img = (data.$option && data.$option.dataset.image) || '';
			return '<div><img src="' + escape(img) + '" class="img-flag" width="16px"> ' + escape(data.text) + '</div>';
		}
		document.querySelectorAll('.select-img').forEach(function (el) {
			if (!el.tomselect) {
				new TomSelect(el, {
					controlInput: null,
					render: {
						option: formatStateImg,
						item: formatStateImg
					}
				});
			}
		});
	}

	// Rich text editor (Quill, replaces Summernote)
	if (document.querySelector('.summernote')) {
		document.querySelectorAll('.summernote').forEach(function (el) {
			new Quill(el, {
				theme: 'snow',
				modules: {
					toolbar: [
						[{ size: ['small', false, 'large', 'huge'] }],
						['bold', 'italic', 'underline', 'strike'],
						['clean'],
						['image']
					]
				}
			});
		});
	}

	// Sidebar scrollbar (SimpleBar, replaces jQuery slimScroll)
	var simpleBarInstances = [];
	if (slimScrolls.length > 0 && window.SimpleBar) {
		slimScrolls.forEach(function (el) {
			simpleBarInstances.push(new SimpleBar(el));
		});
		function syncSlimScrollHeight() {
			var height = (window.innerHeight - 60) + 'px';
			slimScrolls.forEach(function (el) {
				el.style.height = height;
			});
			simpleBarInstances.forEach(function (instance) {
				instance.recalculate();
			});
		}
		syncSlimScrollHeight();
		window.addEventListener('resize', syncSlimScrollHeight);
	}

	// slideToggle/slideUp/slideDown helpers (replace jQuery's animation methods)
	function slideUp(el, duration) {
		if (!el) return;
		duration = duration || 300;
		el.style.height = el.offsetHeight + 'px';
		el.style.transitionProperty = 'height, margin, padding';
		el.style.transitionDuration = duration + 'ms';
		el.offsetHeight; // force reflow
		el.style.overflow = 'hidden';
		el.style.height = '0px';
		el.style.paddingTop = '0px';
		el.style.paddingBottom = '0px';
		el.style.marginTop = '0px';
		el.style.marginBottom = '0px';
		window.setTimeout(function () {
			el.style.display = 'none';
			el.style.removeProperty('height');
			el.style.removeProperty('padding-top');
			el.style.removeProperty('padding-bottom');
			el.style.removeProperty('margin-top');
			el.style.removeProperty('margin-bottom');
			el.style.removeProperty('overflow');
			el.style.removeProperty('transition-duration');
			el.style.removeProperty('transition-property');
		}, duration);
	}

	function slideDown(el, duration) {
		if (!el) return;
		duration = duration || 300;
		el.style.removeProperty('display');
		var display = window.getComputedStyle(el).display;
		if (display === 'none') display = 'block';
		el.style.display = display;
		var height = el.offsetHeight;
		el.style.overflow = 'hidden';
		el.style.height = '0px';
		el.style.paddingTop = '0px';
		el.style.paddingBottom = '0px';
		el.style.marginTop = '0px';
		el.style.marginBottom = '0px';
		el.offsetHeight; // force reflow
		el.style.transitionProperty = 'height, margin, padding';
		el.style.transitionDuration = duration + 'ms';
		el.style.height = height + 'px';
		el.style.removeProperty('padding-top');
		el.style.removeProperty('padding-bottom');
		el.style.removeProperty('margin-top');
		el.style.removeProperty('margin-bottom');
		window.setTimeout(function () {
			el.style.removeProperty('height');
			el.style.removeProperty('overflow');
			el.style.removeProperty('transition-duration');
			el.style.removeProperty('transition-property');
		}, duration);
	}

	// Sidebar
	function init() {
		document.querySelectorAll('.sidebar-menu a').forEach(function (link) {
			link.addEventListener('click', function (e) {
				if (this.parentElement.classList.contains('submenu')) {
					e.preventDefault();
				}
				var parentUl = this.closest('ul');
				if (!this.classList.contains('subdrop')) {
					if (parentUl) {
						parentUl.querySelectorAll('ul').forEach(function (ul) { ul.style.display = 'none'; });
						parentUl.querySelectorAll('a').forEach(function (a) { a.classList.remove('subdrop'); });
					}
					var nextUl = this.nextElementSibling;
					if (nextUl && nextUl.tagName === 'UL') nextUl.style.display = 'block';
					this.classList.add('subdrop');
				} else {
					this.classList.remove('subdrop');
					var nextUl2 = this.nextElementSibling;
					if (nextUl2 && nextUl2.tagName === 'UL') nextUl2.style.display = 'none';
				}
			});
		});
		document.querySelectorAll('.sidebar-menu ul li.submenu a.active').forEach(function (activeSubmenuLink) {
			// Walk up through every ancestor <li>, keeping the outermost one
			// (mirrors jQuery's $(...).parents('li:last')).
			var ancestorLis = [];
			var li = activeSubmenuLink.closest('li');
			while (li) {
				ancestorLis.push(li);
				li = li.parentElement ? li.parentElement.closest('li') : null;
			}
			var targetLi = ancestorLis.length ? ancestorLis[ancestorLis.length - 1] : null;
			if (targetLi) {
				var firstLink = targetLi.querySelector(':scope > a');
				if (firstLink) {
					firstLink.classList.add('active');
					firstLink.dispatchEvent(new Event('click'));
				}
			}
		});
	}


	// Sidebar Initiate
	init();
	document.addEventListener('mouseover', function (e) {
		e.stopPropagation();
		if (document.body.classList.contains('mini-sidebar') && document.getElementById('toggle_btn') && document.getElementById('toggle_btn').offsetParent !== null) {
			var targ = e.target.closest('.sidebar, .header-left');
			if (targ) {
				document.body.classList.add('expand-menu');
				document.querySelectorAll('.subdrop + ul').forEach(function (ul) { slideDown(ul); });
			} else {
				document.body.classList.remove('expand-menu');
				document.querySelectorAll('.subdrop + ul').forEach(function (ul) { slideUp(ul); });
			}
			return false;
		}
	});

	// Sidebar
	function colinit() {
		document.querySelectorAll('.sidebar-right ul a').forEach(function (link) {
			link.addEventListener('click', function (e) {
				if (this.parentElement.classList.contains('submenu')) {
					e.preventDefault();
				}
				var parentUl = this.closest('ul');
				if (!this.classList.contains('subdrop')) {
					if (parentUl) {
						parentUl.querySelectorAll('ul').forEach(function (ul) { ul.style.display = 'none'; });
						parentUl.querySelectorAll('a').forEach(function (a) { a.classList.remove('subdrop'); });
					}
					var nextUl = this.nextElementSibling;
					if (nextUl && nextUl.tagName === 'UL') nextUl.style.display = 'block';
					this.classList.add('subdrop');
				} else {
					this.classList.remove('subdrop');
					var nextUl2 = this.nextElementSibling;
					if (nextUl2 && nextUl2.tagName === 'UL') nextUl2.style.display = 'none';
				}
			});
		});
		document.querySelectorAll('.sidebar-right ul li.submenu a.active').forEach(function (activeSubmenuLink) {
			var ancestorLis = [];
			var li = activeSubmenuLink.closest('li');
			while (li) {
				ancestorLis.push(li);
				li = li.parentElement ? li.parentElement.closest('li') : null;
			}
			var targetLi = ancestorLis.length ? ancestorLis[ancestorLis.length - 1] : null;
			if (targetLi) {
				var firstLink = targetLi.querySelector(':scope > a');
				if (firstLink) {
					firstLink.classList.add('active');
					firstLink.dispatchEvent(new Event('click'));
				}
			}
		});
	}
	colinit();

	// Table Responsive

	setTimeout(function () {
		document.querySelectorAll('.table').forEach(function (table) {
			if (table.parentElement) table.parentElement.classList.add('table-responsive');
		});
	}, 1000);

	// Date Range Picker -> Flatpickr
	// Note: the preset shortcuts (Today/Yesterday/Last 7 Days/etc.) provided by the
	// old daterangepicker plugin are intentionally NOT reproduced — Flatpickr has no
	// built-in equivalent and building a custom panel was declined for this migration.
	// Users now pick a start/end date directly on the calendar (mode: 'range').

	function formatRangeDate(date) {
		var mm = String(date.getMonth() + 1).padStart(2, '0');
		var dd = String(date.getDate()).padStart(2, '0');
		var yyyy = date.getFullYear();
		return mm + '/' + dd + '/' + yyyy;
	}

	if (document.querySelector('.bookingrange')) {
		var bookingStart = new Date();
		bookingStart.setDate(bookingStart.getDate() - 6);
		var bookingEnd = new Date();

		document.querySelectorAll('.bookingrange').forEach(function (el) {
			flatpickr(el, {
				mode: 'range',
				dateFormat: 'm/d/Y',
				defaultDate: [bookingStart, bookingEnd],
				onChange: function (selectedDates, dateStr, instance) {
					if (selectedDates.length === 2) {
						var span = instance.element.parentElement ? instance.element.parentElement.querySelector('span:not(.input-icon-addon)') : null;
						if (span) {
							span.innerHTML = formatRangeDate(selectedDates[0]) + ' - ' + formatRangeDate(selectedDates[1]);
						} else if (instance.element.tagName === 'INPUT') {
							instance.element.value = formatRangeDate(selectedDates[0]) + ' - ' + formatRangeDate(selectedDates[1]);
						}
					}
				}
			});
			var span = el.parentElement ? el.parentElement.querySelector('span:not(.input-icon-addon)') : null;
			if (span) {
				span.innerHTML = formatRangeDate(bookingStart) + ' - ' + formatRangeDate(bookingEnd);
			} else if (el.tagName === 'INPUT') {
				el.value = formatRangeDate(bookingStart) + ' - ' + formatRangeDate(bookingEnd);
			}
		});
	}


	if (document.querySelector('.daterange')) {
		document.querySelectorAll('.daterange').forEach(function (el) {
			flatpickr(el, {
				mode: 'range',
				dateFormat: 'm/d/Y',
				onClose: function (selectedDates, dateStr, instance) {
					if (selectedDates.length === 2) {
						instance.element.value = formatRangeDate(selectedDates[0]) + ' - ' + formatRangeDate(selectedDates[1]);
					}
				}
			});
		});

		var daterangeInput = document.getElementById('daterange');
		if (daterangeInput) {
			daterangeInput.addEventListener('input', function () {
				this.style.width = (this.value.length + 10) + 'px'; // 10ch adds space for padding
			});
		}
	}

	//toggle_btn
	document.addEventListener('click', function (e) {
		var toggleBtn = e.target.closest('#toggle_btn');
		if (toggleBtn) {
			if (document.body.classList.contains('mini-sidebar')) {
				document.body.classList.remove('mini-sidebar');
				toggleBtn.classList.add('active');
				localStorage.setItem('screenModeNightTokenState', 'night');
				setTimeout(function () {
					document.body.classList.remove('mini-sidebar');
					var headerLeft = document.querySelector('.header-left');
					if (headerLeft) headerLeft.classList.add('active');
				}, 100);
			} else {
				document.body.classList.add('mini-sidebar');
				toggleBtn.classList.remove('active');
				localStorage.removeItem('screenModeNightTokenState');
				setTimeout(function () {
					document.body.classList.add('mini-sidebar');
					var headerLeft = document.querySelector('.header-left');
					if (headerLeft) headerLeft.classList.remove('active');
				}, 100);
			}
			return false;
		}
	});

	var myDiv = document.querySelector('.sticky-sidebar-one');

	document.querySelectorAll('.themecolorset').forEach(function (el) {
		el.addEventListener('click', function () {
			document.querySelectorAll('.themecolorset').forEach(function (o) { o.classList.remove('active'); });
			this.classList.add('active');
		});
	});

	document.querySelectorAll('.theme-layout').forEach(function (el) {
		el.addEventListener('click', function () {
			document.querySelectorAll('.theme-layout').forEach(function (o) { o.classList.remove('active'); });
			this.classList.add('active');
		});
	});


	if (document.querySelector('.win-maximize')) {
		document.querySelectorAll('.win-maximize').forEach(function (el) {
			el.addEventListener('click', function (e) {
				if (!document.fullscreenElement) {
					document.documentElement.requestFullscreen();
				} else {
					if (document.exitFullscreen) {
						document.exitFullscreen();
					}
				}
			});
		});
	}


	document.addEventListener('click', function (e) {
		if (e.target.closest('#check_all')) {
			document.querySelectorAll('.checkmail').forEach(function (el) { el.click(); });
			return false;
		}
	});
	document.addEventListener('change', function (e) {
		var selectAllItems2 = e.target.closest('#select-all2');
		if (!selectAllItems2) return;
		document.querySelectorAll('.form-check.form-check-md :checkbox').forEach(function (cb) {
			cb.checked = selectAllItems2.checked;
		});
	});

	// Tooltip
	if (document.querySelector('[data-bs-toggle="tooltip"]')) {
		var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
		var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
			return new bootstrap.Tooltip(tooltipTriggerEl);
		});
	}

	if (window.location.hash == "#LightMode") {
		localStorage.setItem('theme', 'dark');
	}
	else {
		if (window.location.hash == "#DarkMode") {
			localStorage.setItem('theme', 'light');
		}
	}


	document.querySelectorAll('ul.tabs li').forEach(function (li) {
		li.addEventListener('click', function () {
			var theTab = this.id;
			console.log(theTab);
			if (this.classList.contains('active')) {
				// do nothing
			} else {
				var wrapperEl = this.closest('.tabs_wrapper');
				if (wrapperEl) {
					wrapperEl.querySelectorAll('ul.tabs li, .tabs_container .tab_content').forEach(function (el) {
						el.classList.remove('active');
					});
				}
				document.querySelectorAll('.tabs_container .tab_content[data-tab="' + theTab + '"], ul.tabs li[id="' + theTab + '"]').forEach(function (el) {
					el.classList.add('active');
				});
			}
		});
	});

	// Date Range Picker (with time) -> Flatpickr
	if (document.querySelector('input[name="datetimes"]')) {
		var datetimesStart = new Date();
		datetimesStart.setMinutes(0, 0, 0);
		var datetimesEnd = new Date(datetimesStart);
		datetimesEnd.setHours(datetimesEnd.getHours() + 32);

		flatpickr('input[name="datetimes"]', {
			mode: 'range',
			enableTime: true,
			dateFormat: 'm/d h:i K',
			time_24hr: false,
			defaultDate: [datetimesStart, datetimesEnd]
		});
	}

	if (document.querySelector('.custom-input')) {
		const inputRange = document.querySelector('.custom-input');

		inputRange.addEventListener('input', function () {
			const progress = (inputRange.value - inputRange.min) / (inputRange.max - inputRange.min) * 100;
			inputRange.style.background = `linear-gradient(to top, var(--md-sys-color-on-surface-variant) 0%, var(--md-sys-color-on-surface-variant) ${progress}%, var(--md-sys-color-surface-variant) ${progress}%, var(--md-sys-color-surface-variant) 100%)`;
		});
	}

	// Datetimepicker time -> Flatpickr
	// Format corrected from the source template's inconsistent 'HH:mm A' (24-hour
	// token + AM/PM suffix) to a standard 12-hour display.
	if (document.querySelector('.timepicker')) {
		flatpickr('.timepicker', {
			enableTime: true,
			noCalendar: true,
			dateFormat: 'h:i K',
			time_24hr: false
		});
	}

	// Collapse Header
	if (document.querySelector('.btnFullscreen')) {
		const btnFullscreenElements = document.getElementsByClassName('btnFullscreen');

		// Add an event listener to each element
		Array.from(btnFullscreenElements).forEach(element => {
			element.addEventListener('click', function () {
				toggleFullscreen();
			});
		});

		// Function to toggle fullscreen mode
		function toggleFullscreen() {
			if (!document.fullscreenElement) {
				document.documentElement.requestFullscreen();
			} else {
				if (document.exitFullscreen) {
					document.exitFullscreen();
				}
			}
		}
	}

	if (document.getElementById('collapse-header')) {
		document.getElementById('collapse-header').onclick = function () {
			this.classList.toggle('active');
			document.body.classList.toggle('header-collapse');
		}
	}

	// Increment Decrement

	function updateValue(obj, delta) {
		var item = obj.parentElement.querySelector('input');
		var newValue = parseInt(item.value, 10) + delta;
		item.value = Math.max(newValue, 0);
	}
	document.querySelectorAll('.inc').forEach(function (el) {
		el.addEventListener('click', function () { updateValue(this, 1); });
	});
	document.querySelectorAll('.dec').forEach(function (el) {
		el.addEventListener('click', function () { updateValue(this, -1); });
	});


	/* card with fullscreen */
	let DIV_CARD = ".card";
	let cardFullscreenBtn = document.querySelectorAll(
		'[data-bs-toggle="card-fullscreen"]'
	);
	cardFullscreenBtn.forEach((ele) => {
		ele.addEventListener("click", function (e) {
			let $this = this;
			let card = $this.closest(DIV_CARD);
			card.classList.toggle("card-fullscreen");
			card.classList.remove("card-collapsed");
			e.preventDefault();
			return false;
		});
	});
	/* card with fullscreen */

	/* card with close button */
	let DIV_CARD_CLOSE = ".card";
	let cardRemoveBtn = document.querySelectorAll(
		'[data-bs-toggle="card-remove"]'
	);
	cardRemoveBtn.forEach((ele) => {
		ele.addEventListener("click", function (e) {
			e.preventDefault();
			let $this = this;
			let card = $this.closest(DIV_CARD_CLOSE);
			card.remove();
			return false;
		});
	});
	/* card with close button */

	setTimeout(function () {
		document.querySelectorAll('.rating-select').forEach(function (el) {
			el.addEventListener('click', function () {
				var icon = this.querySelector('i');
				if (icon) {
					icon.classList.toggle('ti-star');
					icon.classList.toggle('ti-star-filled');
					icon.classList.toggle('filled');
				}
			});
		});
	}, 100);


	// Datetimepicker (year) -> Flatpickr monthSelect plugin
	if (document.querySelector('.yearpicker')) {
		document.querySelectorAll('.yearpicker').forEach(function (el) {
			flatpickr(el, {
				dateFormat: 'M Y',
				plugins: [
					new monthSelectPlugin({
						shorthand: true,
						dateFormat: 'M Y',
						theme: 'light'
					})
				]
			});
		});
	}

	// Upload Image

	document.querySelectorAll('.image-sign').forEach(function (el) {
		el.addEventListener('change', function () {
			var uploadPic = this.closest('.upload-pic');
			var frames = uploadPic ? uploadPic.querySelector('.frames') : null;
			if (!frames) return;
			frames.innerHTML = '';
			for (var i = 0; i < this.files.length; i++) {
				var img = document.createElement('img');
				img.src = window.URL.createObjectURL(this.files[i]);
				img.width = 100;
				img.height = 100;
				frames.appendChild(img);
			}
		});
	});

	// Datetimepicker (inline) -> Flatpickr
	if (document.querySelector('.datepic')) {
		flatpickr('.datepic', {
			dateFormat: 'd-m-Y',
			inline: true
		});
	}

	if (document.querySelector('.stack-menu')) {
		var activeTab = null;
		document.querySelectorAll('.stack-menu .nav a').forEach(function (link) {
			link.addEventListener('click', function (e) {
				e.preventDefault();
				var currentTab = this.getAttribute('href');
				var currentTabEl = document.querySelector(currentTab);

				if (activeTab === currentTab) {
					if (currentTabEl && currentTabEl.offsetParent !== null) {
						currentTabEl.style.display = 'none';
						activeTab = null;
					} else if (currentTabEl) {
						currentTabEl.style.display = '';
						activeTab = currentTab;
					}
				} else {
					document.querySelectorAll('#myTabContent .tab-pane').forEach(function (pane) {
						pane.style.display = 'none';
					});
					if (currentTabEl) currentTabEl.style.display = '';
					activeTab = currentTab;
				}
			});
		});
	}

	// Contact Wizard
	document.querySelectorAll('.add-info-fieldset .wizard-next-btn').forEach(function (btn) {
		btn.addEventListener('click', function () { // Function Runs On NEXT Button Click
			var fieldset = this.closest('fieldset');
			if (fieldset) {
				fieldset.style.display = 'none';
				var nextFieldset = fieldset.nextElementSibling;
				if (nextFieldset) {
					nextFieldset.style.display = 'none';
					nextFieldset.style.opacity = '0';
					nextFieldset.style.transition = 'opacity 400ms';
					// fadeIn('slow') replacement
					requestAnimationFrame(function () {
						nextFieldset.style.display = '';
						requestAnimationFrame(function () {
							nextFieldset.style.opacity = '1';
						});
					});
				}
			}
			// Adding Class Active To Show Steps Forward;
			var activeBar = document.querySelector('.progress-bar-wizard .active');
			if (activeBar) {
				activeBar.classList.remove('active');
				activeBar.classList.add('activated');
				var next = activeBar.nextElementSibling;
				if (next) next.classList.add('active');
			}
		});
	});

	document.addEventListener('change', function (e) {
		var selectAllAll = e.target.closest('#select-all');
		if (!selectAllAll) return;
		var checked = selectAllAll.checked;
		document.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
			cb.checked = checked;
		});
	});

	function toggleFullscreen(elem) {
		elem = elem || document.documentElement;
		if (!document.fullscreenElement && !document.mozFullScreenElement &&
			!document.webkitFullscreenElement && !document.msFullscreenElement) {
			if (elem.requestFullscreen) {
				elem.requestFullscreen();
			} else if (elem.msRequestFullscreen) {
				elem.msRequestFullscreen();
			} else if (elem.mozRequestFullScreen) {
				elem.mozRequestFullScreen();
			} else if (elem.webkitRequestFullscreen) {
				elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
		}
	}

	// Click Tag
	document.querySelectorAll('.click-tag').forEach(function (tag) {
		tag.addEventListener('click', function () {
			// Remove active class from all tags
			document.querySelectorAll('.click-tag').forEach(function (t) { t.classList.remove('active'); });

			// Add active class to the clicked tag
			this.classList.add('active');
		});
	});

	// Popover
	const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
	const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))

	// GLightbox
	if (document.querySelector('.glightbox') && window.GLightbox) {
		GLightbox({ selector: '.glightbox' });
	}

	// Toasts
	document.addEventListener('DOMContentLoaded', function () {
		const toastPlacement = document.getElementById('toastPlacement');
		const placementSelect = document.getElementById('selectToastPlacement');
		if (toastPlacement && placementSelect) {
			const originalClass = toastPlacement.className;
			placementSelect.addEventListener('change', function () {
				toastPlacement.className = `${originalClass} ${this.value}`.trim();
			});
		}
	});

})();

// Dual listbox (replaces bootstrap-multiselect)
function initDualListbox(fromId, toId) {
	var fromSelect = document.getElementById(fromId);
	var toSelect = document.getElementById(toId);
	if (!fromSelect || !toSelect) return;

	function moveOptions(source, target, onlySelected) {
		Array.from(source.options).forEach(function (opt) {
			if (!onlySelected || opt.selected) {
				opt.selected = false;
				target.appendChild(opt);
			}
		});
	}

	var rightAll = document.getElementById(fromId + '_rightAll');
	var rightSelected = document.getElementById(fromId + '_rightSelected');
	var leftSelected = document.getElementById(fromId + '_leftSelected');
	var leftAll = document.getElementById(fromId + '_leftAll');

	if (rightAll) rightAll.addEventListener('click', function () { moveOptions(fromSelect, toSelect, false); });
	if (rightSelected) rightSelected.addEventListener('click', function () { moveOptions(fromSelect, toSelect, true); });
	if (leftSelected) leftSelected.addEventListener('click', function () { moveOptions(toSelect, fromSelect, true); });
	if (leftAll) leftAll.addEventListener('click', function () { moveOptions(toSelect, fromSelect, false); });
}

initDualListbox('customleave_select', 'customleave_select_to');
initDualListbox('edit_customleave_select', 'edit_customleave_select_to');

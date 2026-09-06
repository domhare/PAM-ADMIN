/*
Author       : Dreamstechnologies
Template Name: Smarthr - Bootstrap Admin Template
*/

(function () {
	"use strict";

	//Top Online Contacts
	if (document.querySelector('.chat-close')) {
		// layout content remove
		document.querySelectorAll('.chat-close').forEach(function (el) {
			el.addEventListener('click', function () {
				document.querySelectorAll('.chat').forEach(function (chat) { chat.classList.remove('show'); });
			});
		});
	}

	document.querySelectorAll('.close_profile').forEach(function (el) {
		el.addEventListener('click', function () {
			document.querySelectorAll('.right-side-contact').forEach(function (rc) {
				rc.classList.add('hide-right-sidebar');
				rc.classList.remove('show-right-sidebar');
			});
			if (window.innerWidth > 991 && window.innerWidth < 1201) {
				document.querySelectorAll('.chat').forEach(function (chat) { chat.style.marginLeft = '0'; });
			}
			if (window.innerWidth < 992) {
				document.querySelectorAll('.chat').forEach(function (chat) { chat.classList.remove('hide-chatbar'); });
			}
		});
	});

	if (document.querySelector('.emoj-action')) {
		document.querySelectorAll('.emoj-action').forEach(function (el) {
			el.addEventListener('click', function () {
				document.querySelectorAll('.emoj-group-list').forEach(function (list) {
					list.style.display = (window.getComputedStyle(list).display === 'none') ? '' : 'none';
				});
			});
		});
	}

	if (document.querySelector('.emoj-action-foot')) {
		document.querySelectorAll('.emoj-action-foot').forEach(function (el) {
			el.addEventListener('click', function () {
				document.querySelectorAll('.emoj-group-list-foot').forEach(function (list) {
					list.style.display = (window.getComputedStyle(list).display === 'none') ? '' : 'none';
				});
			});
		});
	}

	//Chat Resize

	document.querySelectorAll('.close_profile').forEach(function (el) {
		el.addEventListener('click', function () {
			document.querySelectorAll('.right-user-side').forEach(function (rs) { rs.classList.remove('open-message'); });
			document.querySelectorAll('.chat-center-blk .card-comman').forEach(function (c) { c.classList.add('chat-center-space'); });
		});
	});
	document.querySelectorAll('.profile-open').forEach(function (el) {
		el.addEventListener('click', function () {
			document.querySelectorAll('.right-user-side').forEach(function (rs) { rs.classList.remove('add-setting'); });
			document.querySelectorAll('.chat-center-blk .card-comman').forEach(function (c) { c.classList.remove('chat-center-space'); });
		});
	});

	//Call Resize
	document.querySelectorAll('.close_profile').forEach(function (el) {
		el.addEventListener('click', function () {
			document.querySelectorAll('.right-user-side').forEach(function (rs) { rs.classList.remove('open-message'); });
			document.querySelectorAll('.video-screen-inner').forEach(function (v) { v.classList.remove('video-space'); });
			document.querySelectorAll('.right-side-party').forEach(function (r) { r.classList.remove('open-message'); });
			document.querySelectorAll('.meeting-list').forEach(function (m) { m.classList.remove('add-meeting'); });
			var chatRoom = document.getElementById('chat-room');
			if (chatRoom) chatRoom.classList.remove('open-chats');
			document.querySelectorAll('.main-img').forEach(function (m) { m.classList.remove('main-img-hide'); });
			document.querySelectorAll('.join-video').forEach(function (j) { j.classList.remove('main-img-hide'); });
			document.querySelectorAll('.call-user-side').forEach(function (c) { c.classList.add('add-setting'); });
		});
	});

	var showMessage = document.getElementById('show-message');
	if (showMessage) {
		showMessage.addEventListener('click', function () {
			var chatRoom = document.getElementById('chat-room');
			if (chatRoom) chatRoom.classList.add('open-chats');
			document.querySelectorAll('.right-side-party').forEach(function (r) { r.classList.remove('open-message'); });
			document.querySelectorAll('.main-img').forEach(function (m) { m.classList.add('main-img-hide'); });
			document.querySelectorAll('.join-video').forEach(function (j) { j.classList.add('main-img-hide'); });
		});
	}

	//Chat Search Visible
	document.querySelectorAll('.chat-search-btn').forEach(function (el) {
		el.addEventListener('click', function () {
			document.querySelectorAll('.chat-search').forEach(function (cs) { cs.classList.add('visible-chat'); });
		});
	});
	document.querySelectorAll('.close-btn-chat').forEach(function (el) {
		el.addEventListener('click', function () {
			document.querySelectorAll('.chat-search').forEach(function (cs) { cs.classList.remove('visible-chat'); });
		});
	});
	document.querySelectorAll('.chat-search .form-control').forEach(function (input) {
		input.addEventListener('keyup', function () {
			var value = input.value.toLowerCase();
			document.querySelectorAll('.chat .chat-body .messages .chats').forEach(function (chat) {
				chat.style.display = chat.textContent.toLowerCase().indexOf(value) > -1 ? '' : 'none';
			});
		});
	});
	document.querySelectorAll('.guest-off').forEach(function (el) {
		el.addEventListener('click', function () {
			this.classList.toggle('activate');
			document.querySelectorAll('.chat-active-users').forEach(function (u) { u.classList.toggle('show-active-users'); });
		});
	});
})();

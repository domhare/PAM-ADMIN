/**
 * Verbindet email.html mit dem PHP-Backend unter api/.
 *
 * Ohne erreichbares Backend (z. B. auf GitHub Pages) bleibt die Seite
 * unverändert und zeigt nur einen Hinweis - die Demo-Daten bleiben stehen.
 */
(function () {
	'use strict';

	var API = 'api/';
	var AVATAR_COLORS = ['bg-primary', 'bg-purple', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger', 'bg-dark'];

	var state = {
		folder: 'inbox',
		page: 1,
		search: '',
		csrf: '',
		account: { address: '', name: '' },
		messages: [],
		selection: []
	};

	var el = {};

	document.addEventListener('DOMContentLoaded', function () {
		el.list = document.querySelector('.mails-list');
		el.title = document.getElementById('mail-folder-title');
		el.total = document.getElementById('mail-count-total');
		el.unread = document.getElementById('mail-count-unread');
		el.search = document.getElementById('mail-search');
		el.refresh = document.getElementById('mail-refresh');
		el.folderLinks = document.querySelectorAll('[data-folder]');
		el.accountName = document.getElementById('mail-account-name');
		el.accountAddress = document.getElementById('mail-account-address');

		if (!el.list) {
			return;
		}
		boot();
	});

	function boot() {
		request('session.php')
			.then(function (data) {
				if (data.account) {
					state.account = data.account;
					showAccount();
				}
				state.csrf = data.csrf || '';
				if (data.authenticated) {
					start();
				} else {
					showLogin();
				}
			})
			.catch(function (error) {
				showBanner(
					'Kein Mail-Backend erreichbar - die Seite zeigt Beispieldaten. ' +
					'Für echte Mails müssen die Dateien auf dem Strato-Webspace liegen (PHP). (' + error.message + ')',
					'warning'
				);
			});
	}

	function start() {
		hideLogin();
		bindControls();
		loadFolders();
		loadMessages();
	}

	/* ------------------------------------------------------------------ API */

	function request(path, options) {
		options = options || {};
		var config = {
			method: options.method || 'GET',
			headers: { 'Accept': 'application/json' },
			credentials: 'same-origin'
		};
		if (options.body) {
			config.headers['Content-Type'] = 'application/json';
			config.headers['X-CSRF-Token'] = state.csrf;
			config.body = JSON.stringify(options.body);
		}

		return fetch(API + path, config).then(function (response) {
			return response.text().then(function (text) {
				var data;
				try {
					data = JSON.parse(text);
				} catch (e) {
					throw new Error('Unerwartete Antwort vom Server (HTTP ' + response.status + ')');
				}
				if (!response.ok || data.ok === false) {
					var error = new Error(data.error || 'HTTP ' + response.status);
					error.status = response.status;
					throw error;
				}
				return data;
			});
		});
	}

	/* -------------------------------------------------------------- Anmeldung */

	function showLogin() {
		if (document.getElementById('mail-login-overlay')) {
			return;
		}
		var overlay = document.createElement('div');
		overlay.id = 'mail-login-overlay';
		overlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
		overlay.style.cssText = 'background:rgba(15,23,42,.55);z-index:2000;backdrop-filter:blur(2px)';
		overlay.innerHTML =
			'<form class="bg-white rounded shadow p-4" style="width:min(24rem,92vw)">' +
			'<h5 class="mb-1">Postfach entsperren</h5>' +
			'<p class="mb-3 fs-13 text-gray">' + escapeHtml(state.account.address || '') + '</p>' +
			'<div class="mb-3">' +
			'<label class="form-label" for="mail-login-password">Panel-Passwort</label>' +
			'<input type="password" class="form-control" id="mail-login-password" autocomplete="current-password" autofocus>' +
			'</div>' +
			'<div class="alert alert-danger py-2 d-none" id="mail-login-error"></div>' +
			'<button type="submit" class="btn btn-primary w-100">Anmelden</button>' +
			'</form>';

		overlay.querySelector('form').addEventListener('submit', function (event) {
			event.preventDefault();
			var password = overlay.querySelector('#mail-login-password').value;
			var error = overlay.querySelector('#mail-login-error');
			error.classList.add('d-none');

			request('session.php', { method: 'POST', body: { action: 'login', password: password } })
				.then(function (data) {
					state.csrf = data.csrf || '';
					if (data.account) {
						state.account = data.account;
						showAccount();
					}
					start();
				})
				.catch(function (e) {
					error.textContent = e.message;
					error.classList.remove('d-none');
				});
		});

		document.body.appendChild(overlay);
	}

	function hideLogin() {
		var overlay = document.getElementById('mail-login-overlay');
		if (overlay) {
			overlay.remove();
		}
	}

	function showAccount() {
		if (el.accountName) {
			el.accountName.textContent = state.account.name || 'Postfach';
		}
		if (el.accountAddress) {
			el.accountAddress.textContent = state.account.address || '';
		}
	}

	/* ----------------------------------------------------------------- Ordner */

	function loadFolders() {
		request('folders.php')
			.then(function (data) {
				data.folders.forEach(function (folder) {
					var link = document.querySelector('[data-folder="' + folder.key + '"]');
					if (!link) {
						return;
					}
					var badge = link.querySelector('.badge');
					if (badge) {
						badge.textContent = folder.unseen > 0 ? folder.unseen : folder.messages;
						badge.classList.toggle('badge-danger', folder.unseen > 0);
						badge.classList.toggle('text-gray', folder.unseen === 0);
					}
					link.dataset.label = folder.label;
					link.dataset.total = folder.messages;
				});
			})
			.catch(function (error) {
				showBanner('Ordner konnten nicht geladen werden: ' + error.message, 'danger');
			});
	}

	/* ------------------------------------------------------------ Nachrichten */

	function loadMessages() {
		renderPlaceholder('Nachrichten werden geladen ...');

		var query = 'messages.php?folder=' + encodeURIComponent(state.folder) + '&page=' + state.page;
		if (state.search) {
			query += '&search=' + encodeURIComponent(state.search);
		}

		request(query)
			.then(function (data) {
				state.messages = data.messages;
				state.selection = [];
				renderList(data);
			})
			.catch(function (error) {
				if (error.status === 401) {
					showLogin();
					return;
				}
				renderPlaceholder('Nachrichten konnten nicht geladen werden: ' + escapeHtml(error.message));
			});
	}

	function renderPlaceholder(text) {
		el.list.innerHTML = '<div class="list-group-item p-5 text-center text-gray">' + text + '</div>';
	}

	function renderList(data) {
		var active = document.querySelector('[data-folder="' + state.folder + '"]');
		if (el.title) {
			el.title.textContent = (active && active.dataset.label) || 'Posteingang';
		}
		if (el.total) {
			el.total.textContent = data.total + (data.total === 1 ? ' E-Mail' : ' E-Mails');
		}
		if (el.unread) {
			el.unread.textContent = data.unseen + ' ungelesen';
		}

		if (!data.messages.length) {
			renderPlaceholder(state.search ? 'Keine Treffer.' : 'Dieser Ordner ist leer.');
			return;
		}

		el.list.innerHTML = '';
		data.messages.forEach(function (message) {
			el.list.appendChild(renderItem(message));
		});
	}

	function renderItem(message) {
		var item = document.createElement('div');
		item.className = 'list-group-item border-bottom p-3';
		item.dataset.uid = message.uid;

		var initials = (message.name || message.address || '?')
			.replace(/[^\wÀ-ÿ ]/g, ' ')
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map(function (part) { return part.charAt(0).toUpperCase(); })
			.join('') || '?';

		item.innerHTML =
			'<div class="d-flex align-items-center mb-2">' +
			'<div class="form-check form-check-md d-flex align-items-center flex-shrink-0 me-2">' +
			'<input class="form-check-input" type="checkbox" data-select="' + message.uid + '">' +
			'</div>' +
			'<div class="d-flex align-items-center flex-wrap row-gap-2 flex-fill">' +
			'<span class="avatar ' + avatarColor(message.address) + ' avatar-rounded me-2">' +
			'<span class="avatar-title">' + escapeHtml(initials) + '</span></span>' +
			'<div class="flex-fill">' +
			'<div class="d-flex align-items-start justify-content-between">' +
			'<div class="pe-2">' +
			'<h6 class="mb-1"><a href="javascript:void(0);" data-open="' + message.uid + '">' + escapeHtml(message.name || message.address) + '</a></h6>' +
			'<span class="' + (message.seen ? '' : 'fw-bold') + '">' + escapeHtml(message.subject) + '</span>' +
			'</div>' +
			'<div class="d-flex align-items-center flex-shrink-0">' +
			'<span class="fs-12 text-gray">' +
			(message.seen ? '' : '<i class="ti ti-point-filled text-success"></i>') +
			escapeHtml(formatDate(message.date)) + '</span>' +
			'</div>' +
			'</div>' +
			'<p class="fs-13 text-gray mb-0">' + escapeHtml(message.address) + '</p>' +
			'</div></div></div>' +
			'<div class="d-flex align-items-center justify-content-between">' +
			'<div class="d-flex align-items-center">' +
			'<a href="javascript:void(0);" class="btn btn-sm bg-transparent-dark me-2" data-open="' + message.uid + '">' +
			'<i class="ti ti-mail-opened me-1"></i>Öffnen</a>' +
			'<a href="javascript:void(0);" class="btn btn-sm bg-transparent-dark" data-delete="' + message.uid + '">' +
			'<i class="ti ti-trash me-1"></i>Löschen</a>' +
			'</div>' +
			'<div class="d-flex align-items-center">' +
			'<a href="javascript:void(0);" data-star="' + message.uid + '" title="Markieren">' +
			'<i class="ti ' + (message.flagged ? 'ti-star-filled text-warning' : 'ti-star text-gray') + '"></i></a>' +
			'</div></div>';

		return item;
	}

	/* ---------------------------------------------------------- Bedienelemente */

	function bindControls() {
		el.list.addEventListener('click', function (event) {
			var open = event.target.closest('[data-open]');
			var star = event.target.closest('[data-star]');
			var remove = event.target.closest('[data-delete]');

			if (open) {
				event.preventDefault();
				openMessage(parseInt(open.dataset.open, 10));
			} else if (star) {
				event.preventDefault();
				toggleStar(parseInt(star.dataset.star, 10));
			} else if (remove) {
				event.preventDefault();
				deleteMessage(parseInt(remove.dataset.delete, 10));
			}
		});

		el.folderLinks.forEach(function (link) {
			link.addEventListener('click', function (event) {
				event.preventDefault();
				el.folderLinks.forEach(function (other) { other.classList.remove('active'); });
				link.classList.add('active');
				state.folder = link.dataset.folder;
				state.page = 1;
				loadMessages();
			});
		});

		if (el.search) {
			var timer = null;
			el.search.addEventListener('input', function () {
				clearTimeout(timer);
				timer = setTimeout(function () {
					state.search = el.search.value.trim();
					state.page = 1;
					loadMessages();
				}, 400);
			});
		}

		if (el.refresh) {
			el.refresh.addEventListener('click', function (event) {
				event.preventDefault();
				loadFolders();
				loadMessages();
			});
		}

		bindCompose();
	}

	function toggleStar(uid) {
		var message = findMessage(uid);
		if (!message) {
			return;
		}
		post('action.php', { folder: state.folder, uids: [uid], action: message.flagged ? 'unstar' : 'star' })
			.then(function () {
				message.flagged = !message.flagged;
				var icon = el.list.querySelector('[data-star="' + uid + '"] i');
				if (icon) {
					icon.className = 'ti ' + (message.flagged ? 'ti-star-filled text-warning' : 'ti-star text-gray');
				}
			});
	}

	function deleteMessage(uid) {
		if (!window.confirm('Diese Nachricht in den Papierkorb verschieben?')) {
			return;
		}
		post('action.php', { folder: state.folder, uids: [uid], action: 'delete' })
			.then(function () {
				loadFolders();
				loadMessages();
			});
	}

	function post(path, body) {
		return request(path, { method: 'POST', body: body }).catch(function (error) {
			showBanner(error.message, 'danger');
			throw error;
		});
	}

	/* -------------------------------------------------------------- Lesefenster */

	function openMessage(uid) {
		var modal = document.getElementById('mail-view-modal');
		var content = modal.querySelector('[data-role="body"]');
		content.innerHTML = '<p class="text-gray">Nachricht wird geladen ...</p>';
		modal.querySelector('[data-role="subject"]').textContent = '';
		modal.querySelector('[data-role="meta"]').textContent = '';

		var instance = bootstrap.Modal.getOrCreateInstance(modal);
		instance.show();

		request('message.php?folder=' + encodeURIComponent(state.folder) + '&uid=' + uid)
			.then(function (data) {
				var message = data.message;
				modal.querySelector('[data-role="subject"]').textContent = message.subject;
				modal.querySelector('[data-role="meta"]').textContent =
					formatAddresses(message.from) + '  ->  ' + formatAddresses(message.to) +
					'   ' + formatDate(message.date, true);

				content.innerHTML = '';

				// E-Mail-HTML kommt von aussen: in einen abgeschotteten iframe,
				// damit darin kein Skript und kein Zugriff auf die Seite moeglich ist.
				var frame = document.createElement('iframe');
				frame.setAttribute('sandbox', '');
				frame.setAttribute('referrerpolicy', 'no-referrer');
				frame.style.cssText = 'width:100%;min-height:12rem;border:0;background:#fff';
				frame.srcdoc = message.html ||
					'<pre style="font:14px/1.5 system-ui,sans-serif;white-space:pre-wrap;margin:0">' +
					escapeHtml(message.text || '(kein Inhalt)') + '</pre>';
				content.appendChild(frame);

				if (message.attachments.length) {
					var list = document.createElement('div');
					list.className = 'mt-3 pt-3 border-top d-flex flex-wrap gap-2';
					message.attachments.forEach(function (attachment) {
						var link = document.createElement('a');
						link.className = 'btn btn-sm bg-transparent-dark';
						link.target = '_blank';
						link.rel = 'noopener';
						link.href = API + 'attachment.php?folder=' + encodeURIComponent(state.folder) +
							'&uid=' + uid + '&index=' + attachment.index;
						link.innerHTML = '<i class="ti ti-paperclip me-1"></i>' +
							escapeHtml(attachment.name) + ' (' + formatSize(attachment.size) + ')';
						list.appendChild(link);
					});
					content.appendChild(list);
				}

				modal.querySelector('[data-role="reply"]').onclick = function () {
					instance.hide();
					openCompose({
						to: (message.replyTo[0] || message.from[0] || {}).address || '',
						subject: /^(re|aw):/i.test(message.subject) ? message.subject : 'Re: ' + message.subject,
						inReplyTo: message.messageId,
						quote: message.text
					});
				};

				var listed = findMessage(uid);
				if (listed && !listed.seen) {
					listed.seen = true;
					loadFolders();
				}
			})
			.catch(function (error) {
				content.innerHTML = '<div class="alert alert-danger">' + escapeHtml(error.message) + '</div>';
			});
	}

	/* ----------------------------------------------------------------- Verfassen */

	function bindCompose() {
		var form = document.getElementById('compose-form');
		if (!form) {
			return;
		}

		form.addEventListener('submit', function (event) {
			event.preventDefault();
			var status = form.querySelector('[data-role="status"]');
			var button = form.querySelector('button[type="submit"]');

			status.className = 'fs-13 me-auto text-gray';
			status.textContent = 'Wird gesendet ...';
			button.disabled = true;

			post('send.php', {
				to: form.querySelector('[data-field="to"]').value,
				cc: form.querySelector('[data-field="cc"]').value,
				subject: form.querySelector('[data-field="subject"]').value,
				text: form.querySelector('[data-field="text"]').value,
				inReplyTo: form.querySelector('[data-field="inReplyTo"]').value
			})
				.then(function (data) {
					status.className = 'fs-13 me-auto text-success';
					status.textContent = data.storedInSent
						? 'Gesendet und im Ordner "Gesendet" abgelegt.'
						: 'Gesendet.';
					form.reset();
					form.querySelector('[data-field="inReplyTo"]').value = '';
					loadFolders();
				})
				.catch(function (error) {
					status.className = 'fs-13 me-auto text-danger';
					status.textContent = error.message;
				})
				.finally(function () {
					button.disabled = false;
				});
		});
	}

	function openCompose(prefill) {
		var view = document.getElementById('compose-view');
		var form = document.getElementById('compose-form');
		if (!view || !form) {
			return;
		}
		// Das Template oeffnet das Fenster ueber die Klasse "show" plus Backdrop.
		view.classList.add('show');
		if (!document.querySelector('.modal-backdrop')) {
			document.body.insertAdjacentHTML('beforeend', '<div class="modal-backdrop fade show"></div>');
		}

		form.querySelector('[data-field="to"]').value = prefill.to || '';
		form.querySelector('[data-field="subject"]').value = prefill.subject || '';
		form.querySelector('[data-field="inReplyTo"]').value = prefill.inReplyTo || '';
		form.querySelector('[data-field="text"]').value = prefill.quote
			? '\n\n--- Ursprüngliche Nachricht ---\n' + prefill.quote.split('\n').map(function (line) {
				return '> ' + line;
			}).join('\n')
			: '';
		form.querySelector('[data-role="status"]').textContent = '';
	}

	/* ------------------------------------------------------------------ Helfer */

	function findMessage(uid) {
		return state.messages.filter(function (message) { return message.uid === uid; })[0];
	}

	function avatarColor(seed) {
		var sum = 0;
		for (var i = 0; i < (seed || '').length; i++) {
			sum += seed.charCodeAt(i);
		}
		return AVATAR_COLORS[sum % AVATAR_COLORS.length];
	}

	function formatAddresses(addresses) {
		return (addresses || []).map(function (address) {
			return address.name && address.name !== address.address
				? address.name + ' <' + address.address + '>'
				: address.address;
		}).join(', ');
	}

	function formatDate(value, long) {
		if (!value) {
			return '';
		}
		var date = new Date(value);
		if (isNaN(date.getTime())) {
			return '';
		}
		var today = new Date();
		var sameDay = date.toDateString() === today.toDateString();

		if (long) {
			return date.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
		}
		return sameDay
			? date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
			: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
	}

	function formatSize(bytes) {
		if (bytes < 1024) {
			return bytes + ' B';
		}
		if (bytes < 1024 * 1024) {
			return Math.round(bytes / 1024) + ' KB';
		}
		return (bytes / 1024 / 1024).toFixed(1) + ' MB';
	}

	function escapeHtml(value) {
		return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
		});
	}

	function showBanner(text, tone) {
		var existing = document.getElementById('mail-banner');
		if (existing) {
			existing.remove();
		}
		var banner = document.createElement('div');
		banner.id = 'mail-banner';
		banner.className = 'alert alert-' + (tone || 'warning') + ' rounded-0 mb-0 py-2 fs-13';
		banner.textContent = text;
		var wrapper = document.querySelector('.page-wrapper .content');
		if (wrapper) {
			wrapper.insertBefore(banner, wrapper.firstChild);
		}
	}
})();

/*
 * Wires the WhatsApp bridge into the SmartHR chat page.
 * Replaces the template's demo markup with live conversations.
 */
(function (window, document) {
	'use strict';

	var api = window.WAApi;
	var R = window.WARender;

	if (!api || !R) {
		console.error('[wa] wa-api.js / wa-render.js must load before wa-app.js');
		return;
	}

	/* ------------------------------------------------------------------ */
	/* state                                                               */
	/* ------------------------------------------------------------------ */

	var state = {
		status: { state: 'stopped' },
		chats: [],
		chatsById: {},
		archivedView: false,
		activeId: null,
		activeChat: null,
		messages: [],
		replyTo: null,
		loadingMore: false,
		exhausted: false,
		typingTimer: null,
		recorder: null,
		recordedChunks: [],
		filter: ''
	};

	var el = {};
	var modals = {};

	/* ------------------------------------------------------------------ */
	/* helpers                                                             */
	/* ------------------------------------------------------------------ */

	function $(sel, root) {
		return (root || document).querySelector(sel);
	}
	function $$(sel, root) {
		return Array.prototype.slice.call((root || document).querySelectorAll(sel));
	}

	/** Simplebar moves the real scroller into a wrapper - find it. */
	function scrollHost(node) {
		if (!node) return null;
		var sb = node.closest('[data-simplebar]');
		if (sb) return sb.querySelector('.simplebar-content-wrapper') || sb;
		return node.parentElement;
	}

	function scrollToBottom(smooth) {
		var host = scrollHost(el.messages);
		if (!host) return;
		host.scrollTo({ top: host.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
	}

	function toast(message, variant) {
		var box = $('#wa-toasts');
		if (!box) return;
		var node = document.createElement('div');
		node.className = 'wa-toast ' + (variant || 'info');
		node.innerHTML = '<i class="ti ' + (variant === 'error' ? 'ti-alert-triangle' : 'ti-info-circle') +
			' me-2"></i>' + R.escapeHtml(message);
		box.appendChild(node);
		setTimeout(function () {
			node.classList.add('out');
			setTimeout(function () {
				node.remove();
			}, 300);
		}, 4000);
	}

	function fail(err) {
		console.error('[wa]', err);
		toast(err && err.message ? err.message : String(err), 'error');
	}

	/* ------------------------------------------------------------------ */
	/* injected UI                                                         */
	/* ------------------------------------------------------------------ */

	var MODAL_HTML =
		'<div id="wa-toasts" class="wa-toasts"></div>' +

		'<div class="modal fade" id="wa-connect-modal" tabindex="-1" aria-hidden="true">' +
		'<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
		'<div class="modal-header"><h4 class="modal-title"><i class="ti ti-brand-whatsapp text-success me-2"></i>Connect WhatsApp</h4>' +
		'<button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
		'<div class="modal-body text-center" id="wa-connect-body"></div>' +
		'<div class="modal-footer justify-content-between">' +
		'<button class="btn btn-light" id="wa-open-settings"><i class="ti ti-settings me-1"></i>Bridge settings</button>' +
		'<div><button class="btn btn-light me-2" id="wa-restart">Restart</button>' +
		'<button class="btn btn-danger" id="wa-logout">Log out</button></div>' +
		'</div></div></div></div>' +

		'<div class="modal fade" id="wa-settings-modal" tabindex="-1" aria-hidden="true">' +
		'<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
		'<div class="modal-header"><h4 class="modal-title">Bridge settings</h4>' +
		'<button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
		'<div class="modal-body">' +
		'<div class="mb-3"><label class="form-label">Bridge URL</label>' +
		'<input type="text" class="form-control" id="wa-setting-url" placeholder="http://localhost:3001"></div>' +
		'<div class="mb-1"><label class="form-label">API token <span class="text-muted">(optional)</span></label>' +
		'<input type="password" class="form-control" id="wa-setting-token" autocomplete="off"></div>' +
		'<small class="text-muted">Must match <code>API_TOKEN</code> in the bridge <code>.env</code>.</small>' +
		'</div><div class="modal-footer justify-content-between">' +
		'<button class="btn btn-light" id="wa-reset-settings" title="Use the values from wa-config.js">' +
		'Use site default</button>' +
		'<div><button class="btn btn-light me-2" data-bs-dismiss="modal">Cancel</button>' +
		'<button class="btn btn-primary" id="wa-save-settings">Save &amp; reload</button></div>' +
		'</div></div></div></div>' +

		'<div class="modal fade" id="wa-forward-modal" tabindex="-1" aria-hidden="true">' +
		'<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
		'<div class="modal-header"><h4 class="modal-title">Forward to…</h4>' +
		'<button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
		'<div class="modal-body"><input type="text" class="form-control mb-3" id="wa-forward-search" placeholder="Search chats">' +
		'<div id="wa-forward-list" class="wa-picker-list"></div></div>' +
		'</div></div></div>' +

		'<div class="modal fade" id="wa-new-chat-modal" tabindex="-1" aria-hidden="true">' +
		'<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
		'<div class="modal-header"><h4 class="modal-title">New chat</h4>' +
		'<button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
		'<div class="modal-body">' +
		'<label class="form-label">Phone number (with country code)</label>' +
		'<div class="input-group mb-3"><span class="input-group-text">+</span>' +
		'<input type="tel" class="form-control" id="wa-new-number" placeholder="4915112345678">' +
		'<button class="btn btn-primary" id="wa-new-start">Start</button></div>' +
		'<input type="text" class="form-control mb-2" id="wa-contact-search" placeholder="…or search your contacts">' +
		'<div id="wa-contact-list" class="wa-picker-list"></div>' +
		'</div></div></div></div>' +

		'<div class="modal fade" id="wa-info-modal" tabindex="-1" aria-hidden="true">' +
		'<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">' +
		'<div class="modal-header"><h4 class="modal-title">Chat info</h4>' +
		'<button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
		'<div class="modal-body" id="wa-info-body"></div>' +
		'</div></div></div>';

	function injectUi() {
		var host = document.createElement('div');
		host.id = 'wa-injected';
		host.innerHTML = MODAL_HTML;
		document.body.appendChild(host);

		modals.connect = new bootstrap.Modal($('#wa-connect-modal'));
		modals.settings = new bootstrap.Modal($('#wa-settings-modal'));
		modals.forward = new bootstrap.Modal($('#wa-forward-modal'));
		modals.newChat = new bootstrap.Modal($('#wa-new-chat-modal'));
		modals.info = new bootstrap.Modal($('#wa-info-modal'));

		// Status pill + toolbar above the chat list.
		var titleRow = $('#chatsidebar .chat-title');
		if (titleRow && titleRow.parentElement) {
			var bar = document.createElement('div');
			bar.className = 'wa-toolbar';
			bar.innerHTML =
				'<a href="javascript:void(0);" id="wa-status-pill" class="wa-status-pill">' +
				'<span class="wa-dot"></span><span id="wa-status-text">Connecting…</span></a>' +
				'<div class="wa-toolbar-actions">' +
				'<a href="javascript:void(0);" id="wa-new-chat-btn" title="New chat"><i class="ti ti-message-plus"></i></a>' +
				'<a href="javascript:void(0);" id="wa-archived-btn" title="Archived"><i class="ti ti-box-align-right"></i></a>' +
				'<a href="javascript:void(0);" id="wa-refresh-btn" title="Refresh"><i class="ti ti-refresh"></i></a>' +
				'</div>';
			titleRow.parentElement.insertAdjacentElement('afterend', bar);
		}

		// Reply preview strip above the composer.
		var footer = $('.chat-footer');
		if (footer) {
			var reply = document.createElement('div');
			reply.className = 'wa-reply-bar d-none';
			reply.id = 'wa-reply-bar';
			reply.innerHTML =
				'<div class="wa-reply-body"><span class="wa-reply-label">Replying to</span>' +
				'<span id="wa-reply-text"></span></div>' +
				'<a href="javascript:void(0);" id="wa-reply-cancel"><i class="ti ti-x"></i></a>';
			footer.insertAdjacentElement('afterbegin', reply);
		}
	}

	/* ------------------------------------------------------------------ */
	/* connection state                                                    */
	/* ------------------------------------------------------------------ */

	var STATE_TEXT = {
		stopped: 'Bridge stopped',
		starting: 'Starting…',
		qr: 'Scan QR code',
		loading: 'Syncing…',
		authenticated: 'Authenticated',
		ready: 'Connected',
		disconnected: 'Disconnected',
		auth_failure: 'Login failed',
		error: 'Bridge error',
		offline: 'Bridge offline'
	};

	function renderStatus(status) {
		state.status = status || state.status;
		var s = state.status.state;
		var pill = $('#wa-status-pill');
		var text = $('#wa-status-text');
		if (!pill || !text) return;

		pill.className = 'wa-status-pill wa-' + s;
		text.textContent = s === 'ready' && state.status.me && state.status.me.name
			? state.status.me.name
			: STATE_TEXT[s] || s;

		if (s === 'loading' && state.status.loading && state.status.loading.percent) {
			text.textContent = 'Syncing ' + state.status.loading.percent + '%';
		}

		renderConnectBody();

		if (s === 'ready') {
			if (modals.connect) modals.connect.hide();
		} else if (s === 'qr') {
			if (modals.connect) modals.connect.show();
		}
	}

	function renderConnectBody() {
		var body = $('#wa-connect-body');
		if (!body) return;
		var s = state.status.state;

		if (s === 'qr' && state.status.qr) {
			body.innerHTML =
				'<p class="mb-3">On your phone open <strong>WhatsApp → Settings → Linked devices → Link a device</strong>, ' +
				'then point the camera at this code.</p>' +
				'<img src="' + state.status.qr + '" alt="WhatsApp QR code" class="wa-qr">' +
				'<p class="text-muted mt-3 mb-0">The code refreshes automatically.</p>';
		} else if (s === 'ready') {
			var me = state.status.me || {};
			body.innerHTML = '<div class="py-3"><i class="ti ti-circle-check text-success wa-big-icon"></i>' +
				'<h5 class="mt-2 mb-1">Connected</h5>' +
				'<p class="text-muted mb-0">' + R.escapeHtml(me.name || '') +
				(me.number ? ' &middot; +' + R.escapeHtml(me.number) : '') + '</p></div>';
		} else if (s === 'loading') {
			var pct = (state.status.loading && state.status.loading.percent) || 0;
			body.innerHTML = '<div class="py-4"><div class="spinner-border text-success mb-3"></div>' +
				'<h5>Syncing your chats…</h5>' +
				'<div class="progress mt-3"><div class="progress-bar bg-success" style="width:' + pct + '%"></div></div></div>';
		} else if (s === 'offline') {
			body.innerHTML = '<div class="py-4"><i class="ti ti-plug-connected-x text-danger wa-big-icon"></i>' +
				'<h5 class="mt-2">Bridge not reachable</h5>' +
				'<p class="text-muted">Start it with <code>npm start</code> inside <code>/server</code>, ' +
				'then check the bridge URL below.</p></div>';
		} else {
			body.innerHTML = '<div class="py-4"><div class="spinner-border text-secondary mb-3"></div>' +
				'<h5>' + R.escapeHtml(STATE_TEXT[s] || s) + '</h5>' +
				(state.status.error ? '<p class="text-danger mb-0">' + R.escapeHtml(state.status.error) + '</p>' : '') +
				'</div>';
		}
	}

	/* ------------------------------------------------------------------ */
	/* chat list                                                           */
	/* ------------------------------------------------------------------ */

	function loadChats() {
		return api
			.chats(state.archivedView)
			.then(function (data) {
				state.chats = data.chats || [];
				state.chatsById = {};
				state.chats.forEach(function (c) {
					state.chatsById[c.id] = c;
				});
				renderChatList();

				// Open the newest conversation so the page is never empty.
				if (!state.activeId && state.chats.length) openChat(state.chats[0].id);
			})
			.catch(function (err) {
				if (err.status !== 409) fail(err);
			});
	}

	function renderChatList() {
		if (!el.chatWrap) return;
		var filter = state.filter.toLowerCase();
		var list = state.chats.filter(function (c) {
			if (!filter) return true;
			var last = c.lastMessage ? c.lastMessage.body || '' : '';
			return (c.name + ' ' + c.number + ' ' + last).toLowerCase().indexOf(filter) > -1;
		});

		if (!list.length) {
			el.chatWrap.innerHTML =
				'<div class="wa-empty-list text-center text-muted py-4">' +
				(state.status.state === 'ready'
					? (filter ? 'No chats match “' + R.escapeHtml(state.filter) + '”.' : 'No conversations yet.')
					: 'Waiting for WhatsApp…') +
				'</div>';
			return;
		}

		el.chatWrap.innerHTML = list
			.map(function (c) {
				return R.chatListItem(c, api, state.activeId);
			})
			.join('');
	}

	function upsertChat(partial) {
		var existing = state.chatsById[partial.id];
		var merged = Object.assign({}, existing || {}, partial);
		state.chatsById[merged.id] = merged;

		var idx = state.chats.findIndex(function (c) {
			return c.id === merged.id;
		});
		if (idx > -1) state.chats[idx] = merged;
		else state.chats.unshift(merged);

		state.chats.sort(function (a, b) {
			if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
			return (b.timestamp || 0) - (a.timestamp || 0);
		});
		renderChatList();
	}

	/* ------------------------------------------------------------------ */
	/* conversation                                                        */
	/* ------------------------------------------------------------------ */

	function openChat(chatId) {
		state.activeId = chatId;
		state.exhausted = false;
		state.messages = [];
		setReply(null);
		renderChatList();

		el.messages.innerHTML = '<div class="wa-loading text-center text-muted py-5">' +
			'<div class="spinner-border spinner-border-sm me-2"></div>Loading conversation…</div>';

		// Mobile: the template hides the conversation pane until a chat opens.
		var middle = $('#middle');
		if (middle) middle.classList.add('show');

		return Promise.all([api.chat(chatId), api.messages(chatId, { limit: 50 })])
			.then(function (results) {
				state.activeChat = results[0];
				state.messages = results[1].messages || [];
				renderHeader();
				renderMessages();
				scrollToBottom();
				return api.chatAction(chatId, 'seen');
			})
			.then(function () {
				var chat = state.chatsById[chatId];
				if (chat) upsertChat(Object.assign({}, chat, { unreadCount: 0 }));
			})
			.catch(function (err) {
				el.messages.innerHTML = '<div class="text-center text-danger py-5">' +
					R.escapeHtml(err.message) + '</div>';
			});
	}

	function renderHeader() {
		var chat = state.activeChat;
		if (!chat || !el.header) return;

		var img = $('.user-details .avatar img', el.header);
		var name = $('.user-details h6', el.header);
		var sub = $('.user-details .last-seen', el.header);

		if (img) {
			img.alt = chat.name;
			img.onerror = function () {
				window.WAAvatarFallback(this);
			};
			img.src = api.avatarUrl(chat.id, chat.name);
		}
		if (name) name.textContent = chat.name;
		if (sub) {
			if (chat.isGroup) {
				var names = (chat.participants || []).slice(0, 4).map(function (p) {
					return p.name;
				});
				sub.textContent = (chat.participantCount || (chat.participants || []).length) + ' members' +
					(names.length ? ' · ' + names.join(', ') : '');
			} else {
				sub.textContent = '+' + chat.number + (chat.about ? ' · ' + chat.about : '');
			}
		}
	}

	function renderMessages() {
		if (!state.messages.length) {
			el.messages.innerHTML = '<div class="text-center text-muted py-5">No messages in this chat yet.</div>';
			return;
		}
		el.messages.innerHTML =
			'<div class="wa-load-more text-center py-2">' +
			'<button class="btn btn-sm btn-light" id="wa-load-more">Load earlier messages</button></div>' +
			R.messageList(state.messages, api, state.activeChat);
	}

	function appendMessage(msg) {
		var last = state.messages[state.messages.length - 1];
		var html = '';
		if (!last || R.dayLabel(last.timestamp) !== R.dayLabel(msg.timestamp)) {
			html += R.daySeparator(msg.timestamp);
		}
		html += R.message(msg, api, state.activeChat);

		state.messages.push(msg);
		var placeholder = $('.text-center', el.messages);
		if (state.messages.length === 1 && placeholder) el.messages.innerHTML = '';
		el.messages.insertAdjacentHTML('beforeend', html);
	}

	function loadMore() {
		if (state.loadingMore || state.exhausted || !state.messages.length) return;
		state.loadingMore = true;
		var oldest = state.messages[0];
		var host = scrollHost(el.messages);
		var before = host ? host.scrollHeight : 0;

		api
			.messages(state.activeId, { limit: 50, before: oldest.id })
			.then(function (data) {
				var older = data.messages || [];
				if (!older.length) {
					state.exhausted = true;
					var btn = $('#wa-load-more');
					if (btn) btn.outerHTML = '<span class="text-muted small">Beginning of conversation</span>';
					return;
				}
				state.messages = older.concat(state.messages);
				renderMessages();
				if (host) host.scrollTop = host.scrollHeight - before;
			})
			.catch(fail)
			.then(function () {
				state.loadingMore = false;
			});
	}

	/* ------------------------------------------------------------------ */
	/* composing                                                           */
	/* ------------------------------------------------------------------ */

	function setReply(msg) {
		state.replyTo = msg;
		var bar = $('#wa-reply-bar');
		if (!bar) return;
		if (!msg) {
			bar.classList.add('d-none');
			return;
		}
		bar.classList.remove('d-none');
		$('#wa-reply-text').innerHTML = R.preview(msg);
		if (el.input) el.input.focus();
	}

	function sendCurrent() {
		if (!state.activeId || !el.input) return;
		var body = el.input.value.trim();
		if (!body) return;

		var opts = {};
		if (state.replyTo) opts.quotedMessageId = state.replyTo.id;

		el.input.value = '';
		setReply(null);
		api.typing(state.activeId, 'clear');

		api
			.sendText(state.activeId, body, opts)
			.catch(function (err) {
				fail(err);
				el.input.value = body; // give the text back so nothing is lost
			});
	}

	function sendFiles(files) {
		if (!state.activeId || !files || !files.length) return;
		Array.prototype.forEach.call(files, function (file) {
			toast('Sending ' + file.name + '…');
			api
				.sendFile(state.activeId, file, {
					caption: el.input ? el.input.value.trim() : '',
					quotedMessageId: state.replyTo ? state.replyTo.id : null
				})
				.then(function () {
					if (el.input) el.input.value = '';
					setReply(null);
				})
				.catch(fail);
		});
	}

	function toggleRecording(button) {
		if (state.recorder && state.recorder.state === 'recording') {
			state.recorder.stop();
			return;
		}
		if (!navigator.mediaDevices || !window.MediaRecorder) {
			return toast('Voice recording is not supported in this browser', 'error');
		}

		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then(function (stream) {
				var recorder = new MediaRecorder(stream);
				state.recorder = recorder;
				state.recordedChunks = [];
				button.classList.add('wa-recording');

				recorder.ondataavailable = function (e) {
					if (e.data.size) state.recordedChunks.push(e.data);
				};
				recorder.onstop = function () {
					button.classList.remove('wa-recording');
					stream.getTracks().forEach(function (t) {
						t.stop();
					});
					api.typing(state.activeId, 'clear');

					var blob = new Blob(state.recordedChunks, { type: recorder.mimeType || 'audio/webm' });
					if (blob.size < 1000) return;
					var file = new File([blob], 'voice-message.' + (blob.type.indexOf('ogg') > -1 ? 'ogg' : 'webm'), {
						type: blob.type
					});
					api.sendFile(state.activeId, file, { asVoice: true }).catch(fail);
				};

				recorder.start();
				api.typing(state.activeId, 'recording');
				toast('Recording… click the mic again to send');
			})
			.catch(function () {
				toast('Microphone access was denied', 'error');
			});
	}

	function shareLocation() {
		if (!navigator.geolocation) return toast('Geolocation is not available', 'error');
		navigator.geolocation.getCurrentPosition(
			function (pos) {
				api
					.sendLocation(state.activeId, pos.coords.latitude, pos.coords.longitude, 'My location')
					.catch(fail);
			},
			function () {
				toast('Could not read your location', 'error');
			}
		);
	}

	/* ------------------------------------------------------------------ */
	/* pickers                                                             */
	/* ------------------------------------------------------------------ */

	function openForward(messageId) {
		var list = $('#wa-forward-list');
		var render = function (filter) {
			list.innerHTML = state.chats
				.filter(function (c) {
					return !filter || c.name.toLowerCase().indexOf(filter.toLowerCase()) > -1;
				})
				.map(function (c) {
					return R.contactRow({ id: c.id, name: c.name, number: c.number }, api);
				})
				.join('');
		};
		render('');
		$('#wa-forward-search').value = '';
		$('#wa-forward-search').oninput = function () {
			render(this.value);
		};
		list.onclick = function (e) {
			var row = e.target.closest('[data-chat-id]');
			if (!row) return;
			api
				.messageAction(messageId, 'forward', { chatId: row.dataset.chatId })
				.then(function () {
					modals.forward.hide();
					toast('Message forwarded');
				})
				.catch(fail);
		};
		modals.forward.show();
	}

	function openNewChat() {
		modals.newChat.show();
		var list = $('#wa-contact-list');
		list.innerHTML = '<div class="text-muted p-2">Loading contacts…</div>';
		api
			.contacts()
			.then(function (data) {
				var contacts = data.contacts || [];
				var render = function (filter) {
					var f = (filter || '').toLowerCase();
					list.innerHTML = contacts
						.filter(function (c) {
							return !f || (c.name + ' ' + c.number).toLowerCase().indexOf(f) > -1;
						})
						.slice(0, 200)
						.map(function (c) {
							return R.contactRow(c, api);
						})
						.join('') || '<div class="text-muted p-2">No matches.</div>';
				};
				render('');
				$('#wa-contact-search').oninput = function () {
					render(this.value);
				};
			})
			.catch(function (err) {
				list.innerHTML = '<div class="text-danger p-2">' + R.escapeHtml(err.message) + '</div>';
			});
	}

	function openInfo() {
		var chat = state.activeChat;
		if (!chat) return;
		var body = $('#wa-info-body');
		var html =
			'<div class="text-center mb-3">' +
			R.avatarImg(api, chat.id, chat.name, 'wa-info-avatar') +
			'<h5 class="mt-2 mb-0">' + R.escapeHtml(chat.name) + '</h5>' +
			'<p class="text-muted mb-0">' + (chat.isGroup ? 'Group' : '+' + R.escapeHtml(chat.number)) + '</p>' +
			(chat.about ? '<p class="mt-2 mb-0"><em>' + R.escapeHtml(chat.about) + '</em></p>' : '') +
			(chat.description ? '<p class="mt-2 mb-0 text-start">' + R.richText(chat.description) + '</p>' : '') +
			'</div>';

		if (chat.isGroup && chat.participants) {
			html += '<h6 class="mb-2">' + chat.participants.length + ' participants</h6>' +
				chat.participants
					.map(function (p) {
						return '<div class="d-flex align-items-center py-1">' +
							'<div class="avatar avatar-sm me-2">' + R.avatarImg(api, p.id, p.name) + '</div>' +
							'<span>' + R.escapeHtml(p.name) + '</span>' +
							(p.isSuperAdmin ? '<span class="badge bg-primary ms-2">Owner</span>' :
								p.isAdmin ? '<span class="badge bg-secondary ms-2">Admin</span>' : '') +
							'</div>';
					})
					.join('');
		}
		body.innerHTML = html;
		modals.info.show();
	}

	/* ------------------------------------------------------------------ */
	/* search                                                              */
	/* ------------------------------------------------------------------ */

	function runMessageSearch(query) {
		if (!query.trim()) return renderMessages();
		api
			.search(query, state.activeId)
			.then(function (data) {
				var results = data.messages || [];
				el.messages.innerHTML =
					'<div class="wa-search-head text-muted small px-2 py-2">' +
					results.length + ' result(s) for “' + R.escapeHtml(query) + '” ' +
					'<a href="javascript:void(0);" id="wa-search-clear" class="ms-2">clear</a></div>' +
					(results.length ? R.messageList(results, api, state.activeChat) : '');
			})
			.catch(fail);
	}

	/* ------------------------------------------------------------------ */
	/* events                                                              */
	/* ------------------------------------------------------------------ */

	function bindDom() {
		// --- sidebar ---------------------------------------------------
		el.chatWrap.addEventListener('click', function (e) {
			var action = e.target.closest('.wa-chat-action');
			if (action) {
				e.preventDefault();
				var wrap = action.closest('[data-chat-id]');
				if (!wrap) return;
				if (action.dataset.confirm && !window.confirm(action.dataset.confirm)) return;
				api
					.chatAction(wrap.dataset.chatId, action.dataset.action, {
						value: action.dataset.value === 'true'
					})
					.then(loadChats)
					.catch(fail);
				return;
			}

			var open = e.target.closest('.wa-chat-open');
			if (open) {
				e.preventDefault();
				var item = open.closest('[data-chat-id]');
				if (item) openChat(item.dataset.chatId);
			}
		});

		if (el.sidebarSearch) {
			el.sidebarSearch.addEventListener('input', function () {
				state.filter = this.value;
				renderChatList();
			});
			var form = el.sidebarSearch.closest('form');
			if (form) {
				form.addEventListener('submit', function (e) {
					e.preventDefault();
				});
			}
		}

		document.addEventListener('click', function (e) {
			if (e.target.closest('#wa-status-pill')) modals.connect.show();
			if (e.target.closest('#wa-new-chat-btn')) openNewChat();
			if (e.target.closest('#wa-refresh-btn')) loadChats().then(function () { toast('Chats refreshed'); });
			if (e.target.closest('#wa-archived-btn')) {
				state.archivedView = !state.archivedView;
				var title = $('#chatsidebar .chat-title');
				if (title) title.textContent = state.archivedView ? 'Archived' : 'All Chats';
				$('#wa-archived-btn').classList.toggle('active', state.archivedView);
				loadChats();
			}
			if (e.target.closest('#wa-open-settings')) {
				$('#wa-setting-url').value = api.settings.baseUrl;
				$('#wa-setting-token').value = api.settings.token;
				modals.settings.show();
			}
			if (e.target.closest('#wa-reset-settings')) {
				api.resetSettings();
				window.location.reload();
			}
			if (e.target.closest('#wa-save-settings')) {
				api.saveSettings({
					baseUrl: $('#wa-setting-url').value.trim(),
					token: $('#wa-setting-token').value.trim()
				});
				window.location.reload();
			}
			if (e.target.closest('#wa-restart')) {
				api.restart().then(function () { toast('Bridge restarting…'); }).catch(fail);
			}
			if (e.target.closest('#wa-logout')) {
				if (!window.confirm('Unlink this WhatsApp account? You will need to scan the QR code again.')) return;
				api.logout().then(function () { toast('Logged out'); }).catch(fail);
			}
			if (e.target.closest('#wa-new-start')) {
				var number = $('#wa-new-number').value.trim();
				if (!number) return;
				api
					.resolveNumber(number)
					.then(function (res) {
						modals.newChat.hide();
						return openChat(res.id).then(loadChats);
					})
					.catch(fail);
			}
			var pick = e.target.closest('#wa-contact-list [data-chat-id]');
			if (pick) {
				modals.newChat.hide();
				openChat(pick.dataset.chatId);
			}
			if (e.target.closest('#wa-load-more')) loadMore();
			if (e.target.closest('#wa-search-clear')) {
				var si = $('.chat-header .chat-search .form-control');
				if (si) si.value = '';
				renderMessages();
				scrollToBottom();
			}
		});

		// --- conversation ----------------------------------------------
		el.messages.addEventListener('click', function (e) {
			var reply = e.target.closest('.wa-reply');
			if (reply) {
				e.preventDefault();
				var msg = state.messages.find(function (m) {
					return m.id === reply.dataset.messageId;
				});
				if (msg) setReply(msg);
				return;
			}

			var react = e.target.closest('.wa-react');
			if (react) {
				e.preventDefault();
				api.messageAction(react.dataset.messageId, 'react', { emoji: react.dataset.emoji }).catch(fail);
				return;
			}

			var forward = e.target.closest('.wa-forward');
			if (forward) {
				e.preventDefault();
				openForward(forward.dataset.messageId);
				return;
			}

			var copy = e.target.closest('.wa-copy');
			if (copy) {
				e.preventDefault();
				var target = state.messages.find(function (m) {
					return m.id === copy.dataset.messageId;
				});
				if (target) {
					navigator.clipboard
						.writeText(target.body || target.caption || '')
						.then(function () { toast('Copied to clipboard'); })
						.catch(function () { toast('Could not copy', 'error'); });
				}
				return;
			}

			var download = e.target.closest('.wa-download');
			if (download) {
				e.preventDefault();
				window.open(api.mediaUrl(download.dataset.messageId, true), '_blank');
				return;
			}

			var act = e.target.closest('.wa-message-action');
			if (act) {
				e.preventDefault();
				if (act.dataset.confirm && !window.confirm(act.dataset.confirm)) return;
				api
					.messageAction(act.dataset.messageId, act.dataset.action, {
						value: act.dataset.value === 'true',
						everyone: act.dataset.everyone === 'true'
					})
					.then(function () {
						if (act.dataset.action === 'delete') {
							var node = act.closest('[data-message-id]');
							if (node) node.remove();
						}
					})
					.catch(fail);
				return;
			}

			var jump = e.target.closest('[data-jump-to]');
			if (jump) {
				var node = el.messages.querySelector('[data-message-id="' + jump.dataset.jumpTo + '"]');
				if (node) {
					node.scrollIntoView({ behavior: 'smooth', block: 'center' });
					node.classList.add('wa-highlight');
					setTimeout(function () {
						node.classList.remove('wa-highlight');
					}, 1600);
				}
			}
		});

		// Infinite scroll upwards for older history.
		var host = scrollHost(el.messages);
		if (host) {
			host.addEventListener('scroll', function () {
				if (host.scrollTop < 80) loadMore();
			});
		}

		// --- composer ---------------------------------------------------
		if (el.form) {
			el.form.addEventListener('submit', function (e) {
				e.preventDefault();
				sendCurrent();
			});
		}

		if (el.input) {
			el.input.addEventListener('keydown', function (e) {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
					sendCurrent();
				}
			});
			el.input.addEventListener('input', function () {
				if (!state.activeId) return;
				api.typing(state.activeId, 'typing');
				clearTimeout(state.typingTimer);
				state.typingTimer = setTimeout(function () {
					api.typing(state.activeId, 'clear');
				}, 2500);
			});
		}

		var fileInput = $('#files');
		if (fileInput) {
			fileInput.addEventListener('change', function () {
				sendFiles(this.files);
				this.value = '';
			});
		}

		var mic = $('.chat-footer .ti-microphone');
		if (mic && mic.parentElement) {
			mic.parentElement.addEventListener('click', function (e) {
				e.preventDefault();
				toggleRecording(this);
			});
		}

		// Composer emoji strip inserts characters instead of doing nothing.
		$$('.emoj-group-list-foot a').forEach(function (a) {
			a.addEventListener('click', function (e) {
				var img = this.querySelector('img');
				if (!img || !el.input) return;
				e.preventDefault();
				var map = {
					'emonji-02': '😀', 'emonji-05': '😍', 'emonji-06': '😂',
					'emonji-07': '👍', 'emonji-08': '🙏', 'emonji-03': '😢',
					'emonji-09': '🎉', 'emonji-10': '❤️'
				};
				var key = (img.getAttribute('src') || '').split('/').pop().replace('.svg', '');
				el.input.value += map[key] || '🙂';
				el.input.focus();
			});
		});

		var replyCancel = $('#wa-reply-cancel');
		if (replyCancel) {
			replyCancel.addEventListener('click', function () {
				setReply(null);
			});
		}

		// Dropdown entries in the composer's "more" menu.
		$$('.chat-footer .dropdown-item').forEach(function (item) {
			var label = item.textContent.trim().toLowerCase();
			item.addEventListener('click', function (e) {
				if (label.indexOf('location') > -1) {
					e.preventDefault();
					shareLocation();
				} else if (label.indexOf('gallery') > -1 || label.indexOf('audio') > -1 || label.indexOf('camera') > -1) {
					e.preventDefault();
					if (fileInput) fileInput.click();
				}
			});
		});

		// --- conversation header ---------------------------------------
		var headerSearch = $('.chat-header .chat-search .form-control');
		if (headerSearch) {
			var searchTimer;
			headerSearch.addEventListener('input', function () {
				var value = this.value;
				clearTimeout(searchTimer);
				searchTimer = setTimeout(function () {
					runMessageSearch(value);
				}, 350);
			});
			var hForm = headerSearch.closest('form');
			if (hForm) {
				hForm.addEventListener('submit', function (e) {
					e.preventDefault();
				});
			}
		}

		var userDetails = $('.chat-header .user-details');
		if (userDetails) {
			userDetails.style.cursor = 'pointer';
			userDetails.addEventListener('click', openInfo);
		}

		$$('.chat-header .chat-options .dropdown-item').forEach(function (item) {
			var label = item.textContent.trim().toLowerCase();
			item.addEventListener('click', function (e) {
				e.preventDefault();
				if (!state.activeId) return;
				if (label.indexOf('mute') > -1) {
					api.chatAction(state.activeId, 'mute', { value: !(state.activeChat || {}).isMuted })
						.then(loadChats).catch(fail);
				} else if (label.indexOf('clear') > -1) {
					if (!window.confirm('Clear all messages in this chat?')) return;
					api.chatAction(state.activeId, 'clear').then(function () { openChat(state.activeId); }).catch(fail);
				} else if (label.indexOf('delete') > -1) {
					if (!window.confirm('Delete this chat?')) return;
					api.chatAction(state.activeId, 'delete').then(function () {
						state.activeId = null;
						loadChats();
					}).catch(fail);
				} else if (label.indexOf('block') > -1) {
					if (!window.confirm('Block this contact?')) return;
					api.post('/contacts/' + encodeURIComponent(state.activeId) + '/block', { value: true })
						.then(function () { toast('Contact blocked'); }).catch(fail);
				}
			});
		});
	}

	function bindRealtime() {
		api.on('wa:status', function (status) {
			var wasReady = state.status.state === 'ready';
			renderStatus(status);
			if (status.state === 'ready' && !wasReady) loadChats();
		});

		api.on('wa:qr', function () {
			api.status().then(renderStatus).catch(function () {});
		});

		api.on('wa:message', function (msg) {
			// Update the sidebar preview regardless of which chat is open.
			var chat = state.chatsById[msg.chatId];
			upsertChat({
				id: msg.chatId,
				name: chat ? chat.name : (msg.authorName || msg.chatId.split('@')[0]),
				number: chat ? chat.number : msg.chatId.split('@')[0],
				isGroup: chat ? chat.isGroup : msg.chatId.indexOf('@g.us') > -1,
				timestamp: msg.timestamp,
				lastMessage: msg,
				unreadCount: msg.chatId === state.activeId || msg.fromMe ? 0 : ((chat && chat.unreadCount) || 0) + 1
			});

			if (msg.chatId !== state.activeId) return;
			if (state.messages.some(function (m) { return m.id === msg.id; })) return;

			var host = scrollHost(el.messages);
			var pinned = !host || host.scrollHeight - host.scrollTop - host.clientHeight < 150;
			appendMessage(msg);
			if (pinned) scrollToBottom(true);
			if (!msg.fromMe) api.chatAction(state.activeId, 'seen').catch(function () {});
		});

		api.on('wa:ack', function (data) {
			var msg = state.messages.find(function (m) { return m.id === data.id; });
			if (msg) msg.ack = data.ack;

			var node = el.messages.querySelector('[data-message-id="' + data.id + '"] .chat-profile-name .msg-read');
			if (node) node.outerHTML = R.ackIcon(data.ack);

			var chat = state.chatsById[data.chatId];
			if (chat && chat.lastMessage && chat.lastMessage.id === data.id) {
				chat.lastMessage.ack = data.ack;
				renderChatList();
			}
		});

		api.on('wa:reaction', function (data) {
			if (data.chatId !== state.activeId) return;
			// Reload the one message so counts stay accurate.
			api.messages(state.activeId, { limit: 50 })
				.then(function (res) {
					state.messages = res.messages || state.messages;
					var host = scrollHost(el.messages);
					var pinned = !host || host.scrollHeight - host.scrollTop - host.clientHeight < 150;
					renderMessages();
					if (pinned) scrollToBottom();
				})
				.catch(function () {});
		});

		api.on('wa:revoke', function (data) {
			var node = el.messages.querySelector('[data-message-id="' + data.id + '"] .message-content');
			if (node) node.innerHTML = '<span class="wa-revoked"><i class="ti ti-ban me-1"></i>This message was deleted</span>';
		});

		api.on('wa:message-edit', function (msg) {
			var node = el.messages.querySelector('[data-message-id="' + msg.id + '"]');
			if (node) node.outerHTML = R.message(msg, api, state.activeChat);
		});

		api.on('wa:chat-update', function () {
			loadChats();
		});
		api.on('wa:chat-removed', function () {
			loadChats();
		});

		api.on('bridge:offline', function () {
			renderStatus({ state: 'offline' });
		});
		api.on('bridge:error', function () {
			renderStatus({ state: 'offline' });
		});
	}

	/* ------------------------------------------------------------------ */
	/* boot                                                                */
	/* ------------------------------------------------------------------ */

	function init() {
		el.chatWrap = $('.chat-users-wrap');
		el.messages = $('.chat .chat-body .messages');
		el.header = $('.chat .chat-header');
		el.form = $('.chat-footer .footer-form');
		el.input = $('.chat-footer .form-wrap .form-control');
		el.sidebarSearch = $('.chat-search-header .search-wrap .form-control');

		if (!el.chatWrap || !el.messages) {
			console.warn('[wa] chat markup not found - is this chat.html?');
			return;
		}

		// Clear the template's demo data.
		el.chatWrap.innerHTML = '';
		el.messages.innerHTML = '<div class="text-center text-muted py-5">Connecting to WhatsApp…</div>';

		injectUi();
		bindDom();
		bindRealtime();

		api.connect();
		api
			.status()
			.then(function (status) {
				renderStatus(status);
				if (status.ready) return loadChats();
				if (status.state !== 'qr') modals.connect.show();
			})
			.catch(function () {
				renderStatus({ state: 'offline' });
				modals.connect.show();
			});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	window.WAApp = { state: state, openChat: openChat, reload: loadChats };
})(window, document);

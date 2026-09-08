/*
 * WhatsApp bridge client for PAM-ADMIN.
 * Talks to the Node bridge in /server over REST + socket.io.
 */
(function (window) {
	'use strict';

	var STORAGE_KEY = 'pam.wa.settings';

	// Precedence: this browser's override > wa-config.js > built-in fallback.
	var defaults = Object.assign(
		{ baseUrl: 'http://localhost:3001', token: '' },
		window.WA_CONFIG || {}
	);

	function loadSettings() {
		try {
			var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
			return Object.assign({}, defaults, saved);
		} catch (e) {
			return Object.assign({}, defaults);
		}
	}

	var settings = loadSettings();

	var WAApi = {
		settings: settings,

		saveSettings: function (next) {
			settings = Object.assign(settings, next || {});
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
			return settings;
		},

		/**
		 * Drop this browser's override and fall back to wa-config.js.
		 * Mutates in place - WAApi.settings is a public reference, so
		 * reassigning the variable would leave callers holding a stale object.
		 */
		resetSettings: function () {
			localStorage.removeItem(STORAGE_KEY);
			Object.keys(settings).forEach(function (key) {
				delete settings[key];
			});
			Object.assign(settings, defaults);
			return settings;
		},

		/** True when this browser is overriding the deployed config. */
		isOverridden: function () {
			return !!localStorage.getItem(STORAGE_KEY);
		},

		defaults: defaults,

		url: function (path) {
			return settings.baseUrl.replace(/\/+$/, '') + '/api' + path;
		},

		/** Media/avatar URLs are used directly in <img>/<a>, so the token rides along. */
		assetUrl: function (path) {
			var u = this.url(path);
			if (settings.token) u += (u.indexOf('?') === -1 ? '?' : '&') + 'token=' + encodeURIComponent(settings.token);
			return u;
		},

		headers: function (extra) {
			var h = Object.assign({}, extra || {});
			if (settings.token) h['x-wa-token'] = settings.token;
			return h;
		},

		request: function (method, path, body, isForm) {
			var opts = { method: method, headers: this.headers() };
			if (body !== undefined && body !== null) {
				if (isForm) {
					opts.body = body;
				} else {
					opts.headers['Content-Type'] = 'application/json';
					opts.body = JSON.stringify(body);
				}
			}
			return fetch(this.url(path), opts).then(function (res) {
				return res
					.json()
					.catch(function () {
						return {};
					})
					.then(function (data) {
						if (!res.ok) {
							var err = new Error(data.error || res.statusText || 'Request failed');
							err.status = res.status;
							throw err;
						}
						return data;
					});
			});
		},

		get: function (path) {
			return this.request('GET', path);
		},
		post: function (path, body) {
			return this.request('POST', path, body || {});
		},
		postForm: function (path, formData) {
			return this.request('POST', path, formData, true);
		},

		/* ---------------------------------------------------------------- */
		/* endpoints                                                         */
		/* ---------------------------------------------------------------- */

		status: function () {
			return this.get('/status');
		},
		restart: function () {
			return this.post('/session/restart');
		},
		logout: function () {
			return this.post('/session/logout');
		},

		chats: function (archived) {
			return this.get('/chats?archived=' + (archived ? '1' : '0'));
		},
		chat: function (id) {
			return this.get('/chats/' + encodeURIComponent(id));
		},
		messages: function (id, opts) {
			opts = opts || {};
			var q = '?limit=' + (opts.limit || 50);
			if (opts.before) q += '&before=' + encodeURIComponent(opts.before);
			return this.get('/chats/' + encodeURIComponent(id) + '/messages' + q);
		},
		sendText: function (id, body, opts) {
			return this.post(
				'/chats/' + encodeURIComponent(id) + '/messages',
				Object.assign({ body: body }, opts || {})
			);
		},
		sendFile: function (id, file, opts) {
			opts = opts || {};
			var fd = new FormData();
			fd.append('file', file, file.name || 'upload');
			if (opts.caption) fd.append('caption', opts.caption);
			if (opts.quotedMessageId) fd.append('quotedMessageId', opts.quotedMessageId);
			if (opts.asDocument) fd.append('asDocument', 'true');
			if (opts.asVoice) fd.append('asVoice', 'true');
			return this.postForm('/chats/' + encodeURIComponent(id) + '/media', fd);
		},
		sendLocation: function (id, lat, lng, description) {
			return this.post('/chats/' + encodeURIComponent(id) + '/location', {
				latitude: lat,
				longitude: lng,
				description: description
			});
		},
		chatAction: function (id, action, payload) {
			return this.post('/chats/' + encodeURIComponent(id) + '/' + action, payload || {});
		},
		typing: function (id, state) {
			if (this.socket && this.socket.connected) {
				this.socket.emit('wa:typing', { chatId: id, state: state });
				return Promise.resolve({ ok: true });
			}
			return this.post('/chats/' + encodeURIComponent(id) + '/typing', { state: state });
		},
		messageAction: function (id, action, payload) {
			return this.post('/messages/' + encodeURIComponent(id) + '/' + action, payload || {});
		},
		contacts: function () {
			return this.get('/contacts');
		},
		resolveNumber: function (number) {
			return this.post('/contacts/resolve', { number: number });
		},
		search: function (q, chatId) {
			var path = '/search?q=' + encodeURIComponent(q);
			if (chatId) path += '&chatId=' + encodeURIComponent(chatId);
			return this.get(path);
		},

		avatarUrl: function (id, name) {
			return this.assetUrl('/avatar/' + encodeURIComponent(id) + '?name=' + encodeURIComponent(name || ''));
		},
		mediaUrl: function (messageId, download) {
			return this.assetUrl('/media/' + encodeURIComponent(messageId) + (download ? '?download=1' : ''));
		},

		/* ---------------------------------------------------------------- */
		/* realtime                                                          */
		/* ---------------------------------------------------------------- */

		socket: null,
		_handlers: {},

		connect: function () {
			if (this.socket) return this.socket;
			if (typeof io === 'undefined') {
				console.warn('[wa] socket.io client not loaded - falling back to polling');
				this._startPolling();
				return null;
			}

			this.socket = io(settings.baseUrl, {
				auth: { token: settings.token },
				transports: ['websocket', 'polling'],
				reconnectionDelay: 1000,
				reconnectionDelayMax: 8000
			});

			var self = this;
			['wa:status', 'wa:qr', 'wa:message', 'wa:message-edit', 'wa:ack', 'wa:revoke',
				'wa:reaction', 'wa:chat-update', 'wa:chat-removed', 'wa:group-event', 'wa:connection'
			].forEach(function (evt) {
				self.socket.on(evt, function (payload) {
					self.emit(evt, payload);
				});
			});

			this.socket.on('connect', function () {
				self.emit('bridge:online');
			});
			this.socket.on('disconnect', function () {
				self.emit('bridge:offline');
			});
			this.socket.on('connect_error', function (err) {
				self.emit('bridge:error', err);
			});

			return this.socket;
		},

		/** Used when socket.io is unavailable: poll /status so the UI still reacts. */
		_startPolling: function () {
			var self = this;
			if (this._pollTimer) return;
			this._pollTimer = setInterval(function () {
				self.status()
					.then(function (s) {
						self.emit('wa:status', s);
					})
					.catch(function (err) {
						self.emit('bridge:error', err);
					});
			}, 4000);
		},

		on: function (evt, fn) {
			(this._handlers[evt] = this._handlers[evt] || []).push(fn);
			return this;
		},

		emit: function (evt, payload) {
			(this._handlers[evt] || []).forEach(function (fn) {
				try {
					fn(payload);
				} catch (e) {
					console.error('[wa] handler for ' + evt, e);
				}
			});
		}
	};

	window.WAApi = WAApi;
})(window);

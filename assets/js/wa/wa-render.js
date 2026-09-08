/*
 * Turns bridge JSON into SmartHR-flavoured markup, so real WhatsApp data
 * reuses the template's existing chat styles.
 */
(function (window) {
	'use strict';

	var REACTION_CHOICES = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

	function escapeHtml(str) {
		return String(str == null ? '' : str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	/** WhatsApp markup -> HTML. Always run on already-escaped text. */
	function formatText(escaped) {
		return escaped
			.replace(/```([\s\S]+?)```/g, '<code>$1</code>')
			.replace(/(^|\s)\*([^*\n]+)\*(?=\s|$|[.,!?])/g, '$1<strong>$2</strong>')
			.replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,!?])/g, '$1<em>$2</em>')
			.replace(/(^|\s)~([^~\n]+)~(?=\s|$|[.,!?])/g, '$1<s>$2</s>')
			.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
			.replace(/\n/g, '<br>');
	}

	function richText(raw) {
		return formatText(escapeHtml(raw));
	}

	/**
	 * Local initials avatar, used when the bridge is unreachable so the UI
	 * never shows broken images.
	 */
	function fallbackAvatar(name) {
		var label = String(name || '?');
		var initials =
			label
				.replace(/[^\p{L}\p{N} ]/gu, '')
				.split(/\s+/)
				.filter(Boolean)
				.slice(0, 2)
				.map(function (w) {
					return w[0].toUpperCase();
				})
				.join('') || '#';

		var hash = 0;
		for (var i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) % 360;

		var svg =
			'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
			'<rect width="96" height="96" rx="48" fill="hsl(' + hash + ',45%,62%)"/>' +
			'<text x="48" y="48" dy="0.36em" text-anchor="middle" fill="#fff" ' +
			'font-family="system-ui,sans-serif" font-size="38" font-weight="600">' + initials + '</text></svg>';

		return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
	}

	window.WAAvatarFallback = function (img) {
		img.onerror = null;
		img.src = fallbackAvatar(img.getAttribute('alt'));
	};

	/** <img> for a profile picture, with the local fallback wired in. */
	function avatarImg(api, id, name, extraClass) {
		return '<img src="' + api.avatarUrl(id, name) + '" class="rounded-circle' +
			(extraClass ? ' ' + extraClass : '') + '" alt="' + escapeHtml(name || '') +
			'" onerror="WAAvatarFallback(this)">';
	}

	function time(ts) {
		if (!ts) return '';
		return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function dayLabel(ts) {
		if (!ts) return '';
		var d = new Date(ts * 1000);
		var today = new Date();
		var yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);
		var same = function (a, b) {
			return a.toDateString() === b.toDateString();
		};
		if (same(d, today)) return 'Today';
		if (same(d, yesterday)) return 'Yesterday';
		return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
	}

	/** Relative-ish stamp for the sidebar. */
	function listTime(ts) {
		if (!ts) return '';
		var d = new Date(ts * 1000);
		var today = new Date();
		if (d.toDateString() === today.toDateString()) return time(ts);
		var yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);
		if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
		return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
	}

	function ackIcon(ack) {
		switch (Number(ack)) {
			case 4:
			case 3:
				return '<span class="msg-read success"><i class="ti ti-checks"></i></span>';
			case 2:
				return '<span class="msg-read"><i class="ti ti-checks"></i></span>';
			case 1:
				return '<span class="msg-read"><i class="ti ti-check"></i></span>';
			case -1:
				return '<span class="msg-read text-danger"><i class="ti ti-alert-circle"></i></span>';
			default:
				return '<span class="msg-read"><i class="ti ti-clock"></i></span>';
		}
	}

	var TYPE_LABEL = {
		image: '<i class="ti ti-photo me-1"></i>Photo',
		video: '<i class="ti ti-video me-1"></i>Video',
		audio: '<i class="ti ti-music me-1"></i>Audio',
		ptt: '<i class="ti ti-microphone me-1"></i>Voice message',
		document: '<i class="ti ti-file me-1"></i>Document',
		sticker: '<i class="ti ti-sticker me-1"></i>Sticker',
		location: '<i class="ti ti-map-pin me-1"></i>Location',
		vcard: '<i class="ti ti-user me-1"></i>Contact',
		multi_vcard: '<i class="ti ti-users me-1"></i>Contacts',
		revoked: '<i class="ti ti-ban me-1"></i>Message deleted',
		call_log: '<i class="ti ti-phone me-1"></i>Call',
		e2e_notification: '<i class="ti ti-lock me-1"></i>Security code changed',
		gp2: '<i class="ti ti-users me-1"></i>Group update'
	};

	/** Drop WhatsApp's formatting markers for single-line previews. */
	function plain(text) {
		return String(text || '')
			.replace(/```([\s\S]+?)```/g, '$1')
			.replace(/(^|\s)\*([^*\n]+)\*/g, '$1$2')
			.replace(/(^|\s)_([^_\n]+)_/g, '$1$2')
			.replace(/(^|\s)~([^~\n]+)~/g, '$1$2')
			.replace(/\s+/g, ' ');
	}

	/** One-line summary used in the sidebar and in quotes. */
	function preview(msg) {
		if (!msg) return '<span class="text-muted">No messages yet</span>';
		var body = plain(msg.body || msg.caption || '').trim();
		if (msg.type === 'chat' && body) return escapeHtml(body);
		var label = TYPE_LABEL[msg.type];
		if (label) return label + (body ? ' &middot; ' + escapeHtml(body) : '');
		return escapeHtml(body) || '<span class="text-muted">Message</span>';
	}

	function bytes(n) {
		if (!n) return '';
		var units = ['B', 'KB', 'MB', 'GB'];
		var i = 0;
		while (n >= 1024 && i < units.length - 1) {
			n /= 1024;
			i++;
		}
		return (i === 0 ? n : n.toFixed(1)) + ' ' + units[i];
	}

	function duration(secs) {
		secs = Number(secs) || 0;
		var m = Math.floor(secs / 60);
		var s = Math.floor(secs % 60);
		return m + ':' + (s < 10 ? '0' : '') + s;
	}

	/* ------------------------------------------------------------------ */
	/* sidebar                                                             */
	/* ------------------------------------------------------------------ */

	function chatListItem(chat, api, activeId) {
		var unread = chat.unreadCount > 0;
		var last = chat.lastMessage;

		var meta = '';
		if (last && last.fromMe) meta = ackIcon(last.ack);
		else if (unread) meta = '<span class="badge bg-success rounded-pill">' + chat.unreadCount + '</span>';
		else if (chat.pinned) meta = '<i class="ti ti-pin"></i>';

		return (
			'<div class="chat-list" data-chat-id="' + escapeHtml(chat.id) + '">' +
			'<a href="javascript:void(0);" class="chat-user-list wa-chat-open' + (chat.id === activeId ? ' active' : '') + '">' +
			'<div class="avatar avatar-lg me-2">' + avatarImg(api, chat.id, chat.name) + '</div>' +
			'<div class="chat-user-info">' +
			'<div class="chat-user-msg">' +
			'<h6>' + escapeHtml(chat.name) +
			(chat.isGroup ? ' <i class="ti ti-users fs-12 text-muted"></i>' : '') +
			(chat.isMuted ? ' <i class="ti ti-volume-off fs-12 text-muted"></i>' : '') +
			'</h6>' +
			'<p class="wa-chat-preview' + (unread ? ' fw-semibold text-dark' : '') + '">' +
			(last && last.fromMe ? 'You: ' : '') + preview(last) +
			'</p>' +
			'</div>' +
			'<div class="chat-user-time">' +
			'<span class="time">' + listTime(chat.timestamp) + '</span>' +
			'<div class="chat-pin">' + meta + '</div>' +
			'</div>' +
			'</div>' +
			'</a>' +
			chatDropdown(chat) +
			'</div>'
		);
	}

	function chatDropdown(chat) {
		return (
			'<div class="chat-dropdown">' +
			'<a href="javascript:void(0);" data-bs-toggle="dropdown"><i class="ti ti-dots-vertical"></i></a>' +
			'<ul class="dropdown-menu dropdown-menu-end p-3">' +
			'<li><a class="dropdown-item wa-chat-action" data-action="archive" data-value="' + (!chat.archived) + '" href="javascript:void(0);">' +
			'<i class="ti ti-box-align-right me-2"></i>' + (chat.archived ? 'Unarchive' : 'Archive') + ' Chat</a></li>' +
			'<li><a class="dropdown-item wa-chat-action" data-action="pin" data-value="' + (!chat.pinned) + '" href="javascript:void(0);">' +
			'<i class="ti ti-pinned me-2"></i>' + (chat.pinned ? 'Unpin' : 'Pin') + ' Chat</a></li>' +
			'<li><a class="dropdown-item wa-chat-action" data-action="mute" data-value="' + (!chat.isMuted) + '" href="javascript:void(0);">' +
			'<i class="ti ti-volume-off me-2"></i>' + (chat.isMuted ? 'Unmute' : 'Mute') + '</a></li>' +
			'<li><a class="dropdown-item wa-chat-action" data-action="unread" href="javascript:void(0);">' +
			'<i class="ti ti-check me-2"></i>Mark as Unread</a></li>' +
			'<li><a class="dropdown-item wa-chat-action" data-action="clear" data-confirm="Clear all messages in this chat?" href="javascript:void(0);">' +
			'<i class="ti ti-clear-all me-2"></i>Clear Messages</a></li>' +
			'<li><a class="dropdown-item text-danger wa-chat-action" data-action="delete" data-confirm="Delete this chat?" href="javascript:void(0);">' +
			'<i class="ti ti-trash me-2"></i>Delete</a></li>' +
			'</ul>' +
			'</div>'
		);
	}

	/* ------------------------------------------------------------------ */
	/* message bodies                                                      */
	/* ------------------------------------------------------------------ */

	function mediaBlock(msg, api) {
		var src = api.mediaUrl(msg.id);
		var dl = api.mediaUrl(msg.id, true);
		var caption = msg.caption || msg.body || '';
		var captionHtml = caption ? '<div class="wa-caption mt-2">' + richText(caption) + '</div>' : '';

		switch (msg.type) {
			case 'image':
				return '<div class="wa-media"><a href="' + src + '" target="_blank" rel="noopener">' +
					'<img src="' + src + '" class="wa-media-img" alt="Photo" loading="lazy"></a></div>' + captionHtml;

			case 'sticker':
				return '<div class="wa-media"><img src="' + src + '" class="wa-sticker" alt="Sticker" loading="lazy"></div>';

			case 'video':
				return '<div class="wa-media"><video src="' + src + '" class="wa-media-img" controls preload="metadata"></video></div>' + captionHtml;

			case 'ptt':
			case 'audio':
				return '<div class="wa-audio">' +
					'<audio src="' + src + '" controls preload="none"></audio>' +
					(msg.duration ? '<span class="wa-audio-time">' + duration(msg.duration) + '</span>' : '') +
					'</div>' + captionHtml;

			default:
				return '<a class="wa-file" href="' + dl + '" target="_blank" rel="noopener">' +
					'<span class="wa-file-icon"><i class="ti ti-file-text"></i></span>' +
					'<span class="wa-file-meta">' +
					'<span class="wa-file-name">' + escapeHtml(msg.filename || 'Document') + '</span>' +
					'<span class="wa-file-size">' + (bytes(msg.filesize) || 'Download') + '</span>' +
					'</span></a>' + captionHtml;
		}
	}

	function bodyHtml(msg, api) {
		if (msg.type === 'revoked' || msg.deleted) {
			return '<span class="wa-revoked"><i class="ti ti-ban me-1"></i>This message was deleted</span>';
		}

		if (msg.location) {
			var l = msg.location;
			return '<a class="wa-file" target="_blank" rel="noopener" ' +
				'href="https://www.google.com/maps/search/?api=1&query=' + l.latitude + ',' + l.longitude + '">' +
				'<span class="wa-file-icon"><i class="ti ti-map-pin"></i></span>' +
				'<span class="wa-file-meta"><span class="wa-file-name">' +
				escapeHtml(l.description || 'Shared location') + '</span>' +
				'<span class="wa-file-size">' + l.latitude.toFixed(5) + ', ' + l.longitude.toFixed(5) + '</span>' +
				'</span></a>';
		}

		if (msg.vCards && msg.vCards.length) {
			var names = msg.vCards.map(function (v) {
				var m = /FN:(.*)/.exec(v);
				return m ? m[1].trim() : 'Contact';
			});
			return '<div class="wa-file"><span class="wa-file-icon"><i class="ti ti-user"></i></span>' +
				'<span class="wa-file-meta"><span class="wa-file-name">' + escapeHtml(names.join(', ')) + '</span>' +
				'<span class="wa-file-size">Shared contact</span></span></div>';
		}

		if (msg.hasMedia) return mediaBlock(msg, api);

		var text = msg.body || '';
		if (!text) return '<span class="text-muted">' + (TYPE_LABEL[msg.type] || 'Unsupported message') + '</span>';
		return richText(text);
	}

	function quoteBlock(msg) {
		if (!msg.quoted) return '';
		var q = msg.quoted;
		var label = q.fromMe ? 'You' : 'Reply';
		return '<div class="wa-quote" data-jump-to="' + escapeHtml(q.id) + '">' +
			'<span class="wa-quote-author">' + escapeHtml(label) + '</span>' +
			'<span class="wa-quote-body">' + preview(q) + '</span>' +
			'</div>';
	}

	function reactionsBlock(msg) {
		if (!msg.reactions || !msg.reactions.length) return '';
		return '<div class="wa-reactions">' +
			msg.reactions.map(function (r) {
				return '<span class="wa-reaction">' + escapeHtml(r.emoji) +
					(r.count > 1 ? '<b>' + r.count + '</b>' : '') + '</span>';
			}).join('') +
			'</div>';
	}

	function emojiPicker(msgId) {
		return '<div class="emoj-group">' +
			'<ul><li class="emoj-action"><a href="javascript:void(0);"><i class="ti ti-mood-smile"></i></a>' +
			'<div class="emoj-group-list"><ul>' +
			REACTION_CHOICES.map(function (e) {
				return '<li><a href="javascript:void(0);" class="wa-react" data-message-id="' +
					escapeHtml(msgId) + '" data-emoji="' + e + '">' + e + '</a></li>';
			}).join('') +
			'</ul></div></li>' +
			'<li><a href="javascript:void(0);" class="wa-reply" data-message-id="' + escapeHtml(msgId) + '">' +
			'<i class="ti ti-arrow-forward-up"></i></a></li>' +
			'</ul></div>';
	}

	function messageDropdown(msg) {
		var id = escapeHtml(msg.id);
		var items = [
			'<li><a class="dropdown-item wa-reply" data-message-id="' + id + '" href="javascript:void(0);"><i class="ti ti-arrow-back-up me-2"></i>Reply</a></li>',
			'<li><a class="dropdown-item wa-forward" data-message-id="' + id + '" href="javascript:void(0);"><i class="ti ti-arrow-forward-up me-2"></i>Forward</a></li>',
			'<li><a class="dropdown-item wa-copy" data-message-id="' + id + '" href="javascript:void(0);"><i class="ti ti-copy me-2"></i>Copy</a></li>',
			'<li><a class="dropdown-item wa-message-action" data-action="star" data-value="' + (!msg.isStarred) + '" data-message-id="' + id + '" href="javascript:void(0);">' +
			'<i class="ti ti-star me-2"></i>' + (msg.isStarred ? 'Unstar' : 'Star') + '</a></li>'
		];
		if (msg.hasMedia) {
			items.push('<li><a class="dropdown-item wa-download" data-message-id="' + id + '" href="javascript:void(0);"><i class="ti ti-download me-2"></i>Download</a></li>');
		}
		if (msg.fromMe) {
			items.push('<li><a class="dropdown-item wa-message-action" data-action="delete" data-everyone="true" data-message-id="' + id + '" data-confirm="Delete this message for everyone?" href="javascript:void(0);"><i class="ti ti-trash me-2"></i>Delete for everyone</a></li>');
		}
		items.push('<li><a class="dropdown-item text-danger wa-message-action" data-action="delete" data-message-id="' + id + '" data-confirm="Delete this message for you?" href="javascript:void(0);"><i class="ti ti-trash me-2"></i>Delete for me</a></li>');

		return '<div class="chat-actions">' +
			'<a href="javascript:void(0);" data-bs-toggle="dropdown"><i class="ti ti-dots-vertical"></i></a>' +
			'<ul class="dropdown-menu dropdown-menu-end p-3">' + items.join('') + '</ul>' +
			'</div>';
	}

	/** One `.chats` block per message. */
	function message(msg, api, chat) {
		var mine = msg.fromMe;
		var senderId = mine ? (msg.to || '') : (msg.author || msg.from || '');
		var senderName = mine ? 'You' : (msg.authorName || (chat && !chat.isGroup ? chat.name : '') || (senderId.split('@')[0]));

		var content =
			'<div class="chat-content">' +
			'<div class="chat-info">' +
			(mine ? messageDropdown(msg) : '') +
			'<div class="message-content' + (msg.type === 'sticker' ? ' wa-bare' : '') + '">' +
			quoteBlock(msg) +
			(msg.isForwarded ? '<div class="wa-forwarded"><i class="ti ti-arrow-forward-up me-1"></i>Forwarded</div>' : '') +
			bodyHtml(msg, api) +
			reactionsBlock(msg) +
			emojiPicker(msg.id) +
			'</div>' +
			(mine ? '' : messageDropdown(msg)) +
			'</div>' +
			'<div class="chat-profile-name' + (mine ? ' text-end' : '') + '">' +
			'<h6>' + escapeHtml(senderName) +
			'<i class="ti ti-circle-filled fs-7 mx-2"></i>' +
			'<span class="chat-time">' + time(msg.timestamp) + '</span>' +
			(msg.isEdited ? '<span class="chat-time ms-1">(edited)</span>' : '') +
			(msg.isStarred ? '<i class="ti ti-star-filled text-warning ms-1 fs-12"></i>' : '') +
			(mine ? ackIcon(msg.ack) : '') +
			'</h6>' +
			'</div>' +
			'</div>';

		var avatarBlock = '<div class="chat-avatar">' +
			avatarImg(api, mine ? 'me' : senderId, senderName, mine ? 'dreams_chat' : '') + '</div>';

		return '<div class="chats' + (mine ? ' chats-right' : '') + '" data-message-id="' + escapeHtml(msg.id) +
			'" data-timestamp="' + (msg.timestamp || 0) + '">' +
			(mine ? content + avatarBlock : avatarBlock + content) +
			'</div>';
	}

	function daySeparator(ts) {
		return '<div class="chat-line"><span class="chat-date">' + escapeHtml(dayLabel(ts)) + '</span></div>';
	}

	/** Full message list with day separators. */
	function messageList(messages, api, chat) {
		var html = '';
		var lastDay = null;
		messages.forEach(function (msg) {
			var day = dayLabel(msg.timestamp);
			if (day !== lastDay) {
				html += daySeparator(msg.timestamp);
				lastDay = day;
			}
			html += message(msg, api, chat);
		});
		return html;
	}

	function contactRow(contact, api) {
		return '<a href="javascript:void(0);" class="wa-contact-row d-flex align-items-center p-2 rounded" ' +
			'data-chat-id="' + escapeHtml(contact.id) + '">' +
			'<div class="avatar avatar-md me-2">' + avatarImg(api, contact.id, contact.name) + '</div>' +
			'<div class="overflow-hidden"><h6 class="mb-0 text-truncate">' + escapeHtml(contact.name) + '</h6>' +
			'<small class="text-muted">+' + escapeHtml(contact.number) + '</small></div></a>';
	}

	window.WARender = {
		escapeHtml: escapeHtml,
		plain: plain,
		avatarImg: avatarImg,
		fallbackAvatar: fallbackAvatar,
		richText: richText,
		time: time,
		listTime: listTime,
		dayLabel: dayLabel,
		daySeparator: daySeparator,
		ackIcon: ackIcon,
		preview: preview,
		bytes: bytes,
		duration: duration,
		chatListItem: chatListItem,
		message: message,
		messageList: messageList,
		contactRow: contactRow
	};
})(window);

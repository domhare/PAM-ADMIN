'use strict';

/**
 * Turns whatsapp-web.js model objects into plain JSON the browser can use.
 * Everything the UI needs must be flattened here — the raw objects carry
 * circular references back to the puppeteer client and cannot be sent over
 * the wire.
 */

const ACK = {
	'-1': 'error',
	0: 'pending',
	1: 'sent',
	2: 'delivered',
	3: 'read',
	4: 'played'
};

/** Best-effort display name for a chat or contact. */
function displayName(entity, fallback) {
	if (!entity) return fallback || '';
	return (
		entity.name ||
		entity.pushname ||
		entity.verifiedName ||
		entity.shortName ||
		entity.formattedName ||
		(entity.number ? '+' + entity.number : '') ||
		fallback ||
		''
	);
}

/** The digits part of a wid, e.g. "4915112345678@c.us" -> "4915112345678". */
function numberOf(id) {
	if (!id) return '';
	const raw = typeof id === 'string' ? id : id._serialized || '';
	return raw.split('@')[0].split(':')[0];
}

function serializeContact(contact) {
	if (!contact) return null;
	const id = contact.id ? contact.id._serialized : contact._serialized;
	return {
		id,
		number: contact.number || numberOf(id),
		name: displayName(contact, numberOf(id)),
		pushname: contact.pushname || null,
		shortName: contact.shortName || null,
		isMe: !!contact.isMe,
		isGroup: !!contact.isGroup,
		isUser: !!contact.isUser,
		isBusiness: !!contact.isBusiness,
		isEnterprise: !!contact.isEnterprise,
		isMyContact: !!contact.isMyContact,
		isWAContact: !!contact.isWAContact,
		isBlocked: !!contact.isBlocked
	};
}

function serializeChat(chat) {
	if (!chat) return null;
	const id = chat.id._serialized;
	const last = chat.lastMessage;

	return {
		id,
		number: numberOf(id),
		name: displayName(chat, numberOf(id)),
		isGroup: !!chat.isGroup,
		isReadOnly: !!chat.isReadOnly,
		unreadCount: chat.unreadCount || 0,
		timestamp: chat.timestamp || (last ? last.timestamp : 0) || 0,
		archived: !!chat.archived,
		pinned: !!chat.pinned,
		isMuted: !!chat.isMuted,
		muteExpiration: chat.muteExpiration || 0,
		participantCount: chat.isGroup && chat.participants ? chat.participants.length : 0,
		lastMessage: last
			? {
					id: last.id ? last.id._serialized : null,
					body: last.body || '',
					type: last.type,
					fromMe: !!last.fromMe,
					hasMedia: !!last.hasMedia,
					timestamp: last.timestamp,
					ack: last.ack,
					ackLabel: ACK[String(last.ack)] || 'pending',
					author: last.author || null
			  }
			: null
	};
}

/**
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} [extra] resolved async bits (quoted message, author name, ...)
 */
function serializeMessage(msg, extra = {}) {
	if (!msg) return null;
	const data = msg._data || {};
	const id = msg.id._serialized;

	return {
		id,
		chatId: msg.fromMe ? msg.to : msg.from,
		body: msg.body || '',
		type: msg.type,
		subtype: data.subtype || null,
		timestamp: msg.timestamp,
		fromMe: !!msg.fromMe,
		from: msg.from,
		to: msg.to,
		author: msg.author || null,
		authorName: extra.authorName || data.notifyName || null,
		hasMedia: !!msg.hasMedia,
		mediaUrl: msg.hasMedia ? '/api/media/' + encodeURIComponent(id) : null,
		mimetype: data.mimetype || null,
		filename: data.filename || (data.caption ? null : null),
		filesize: data.size || null,
		caption: data.caption || null,
		duration: msg.duration || data.duration || null,
		isVoice: msg.type === 'ptt',
		isGif: !!msg.isGif,
		isForwarded: !!msg.isForwarded,
		forwardingScore: msg.forwardingScore || 0,
		isStarred: !!msg.isStarred,
		isStatus: !!msg.isStatus,
		isEdited: !!data.isEdited,
		ack: msg.ack,
		ackLabel: ACK[String(msg.ack)] || 'pending',
		mentionedIds: (msg.mentionedIds || []).map((m) => (typeof m === 'string' ? m : m._serialized)),
		links: (msg.links || []).map((l) => (typeof l === 'string' ? l : l.link)),
		location: msg.location
			? {
					latitude: msg.location.latitude,
					longitude: msg.location.longitude,
					description: msg.location.description || null
			  }
			: null,
		vCards: msg.vCards || [],
		reactions: extra.reactions || [],
		quoted: extra.quoted || null,
		deleted: !!extra.deleted
	};
}

module.exports = { ACK, serializeChat, serializeMessage, serializeContact, displayName, numberOf };

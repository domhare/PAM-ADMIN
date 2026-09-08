'use strict';

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const QRCode = require('qrcode');
const mime = require('mime-types');
const { Client, LocalAuth, MessageMedia, Location } = require('whatsapp-web.js');

const config = require('./config');
const { ACK, serializeChat, serializeMessage, serializeContact, displayName } = require('./serialize');

/**
 * Wraps the whatsapp-web.js client with:
 *  - a state machine the frontend can render (qr / loading / ready / ...)
 *  - a normalised event stream (everything already serialized)
 *  - on-disk caches for media and profile pictures
 */
class WhatsAppBridge extends EventEmitter {
	constructor() {
		super();
		this.client = null;
		this.state = 'stopped';
		this.qr = null;
		this.qrDataUrl = null;
		this.me = null;
		this.lastError = null;
		this.loading = { percent: 0, message: '' };
		/** @type {Map<string,string|null>} contactId -> cached avatar file */
		this.avatarMemo = new Map();
		this.starting = false;
	}

	/* ------------------------------------------------------------------ */
	/* lifecycle                                                           */
	/* ------------------------------------------------------------------ */

	async start() {
		if (this.client || this.starting) return;
		this.starting = true;
		this.setState('starting');

		this.client = new Client({
			authStrategy: new LocalAuth({ dataPath: config.sessionPath }),
			puppeteer: {
				headless: config.headless,
				args: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-dev-shm-usage',
					'--disable-gpu'
				]
			}
		});

		this.wireEvents();

		try {
			await this.client.initialize();
		} catch (err) {
			this.lastError = err.message;
			this.setState('error');
			console.error('[wa] initialize failed:', err);
		} finally {
			this.starting = false;
		}
	}

	async stop() {
		const client = this.client;
		this.client = null;
		this.me = null;
		this.qr = null;
		this.qrDataUrl = null;
		if (client) {
			try {
				await client.destroy();
			} catch (_) {
				/* already gone */
			}
		}
		this.setState('stopped');
	}

	/** Unlink the phone and wipe the stored session so the next start shows a QR. */
	async logout() {
		if (this.client) {
			try {
				await this.client.logout();
			} catch (_) {
				/* ignore */
			}
		}
		await this.stop();
		fs.rmSync(config.sessionPath, { recursive: true, force: true });
		fs.mkdirSync(config.sessionPath, { recursive: true });
		this.avatarMemo.clear();
	}

	async restart() {
		await this.stop();
		await this.start();
	}

	setState(state) {
		this.state = state;
		this.emit('state', this.status());
	}

	status() {
		return {
			state: this.state,
			ready: this.state === 'ready',
			qr: this.qrDataUrl,
			me: this.me,
			loading: this.loading,
			error: this.lastError
		};
	}

	/** Throws a 409 when a route is hit before the phone is linked. */
	require() {
		if (this.state !== 'ready' || !this.client) {
			const err = new Error('WhatsApp is not connected (state: ' + this.state + ')');
			err.status = 409;
			throw err;
		}
		return this.client;
	}

	/* ------------------------------------------------------------------ */
	/* events                                                              */
	/* ------------------------------------------------------------------ */

	wireEvents() {
		const c = this.client;

		c.on('qr', async (qr) => {
			this.qr = qr;
			this.qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 320 });
			this.setState('qr');
			this.emit('qr', { dataUrl: this.qrDataUrl });
		});

		c.on('loading_screen', (percent, message) => {
			this.loading = { percent: Number(percent) || 0, message: message || '' };
			this.setState('loading');
		});

		c.on('authenticated', () => {
			this.qr = null;
			this.qrDataUrl = null;
			this.setState('authenticated');
		});

		c.on('auth_failure', (msg) => {
			this.lastError = msg;
			this.setState('auth_failure');
		});

		c.on('ready', () => {
			const info = c.info || {};
			this.me = {
				id: info.wid ? info.wid._serialized : null,
				number: info.wid ? info.wid.user : null,
				name: info.pushname || null,
				platform: info.platform || null
			};
			this.lastError = null;
			this.setState('ready');
		});

		c.on('disconnected', async (reason) => {
			this.lastError = String(reason);
			this.setState('disconnected');
			// whatsapp-web.js leaves a dead puppeteer page behind after a
			// disconnect; tear it down so a restart gets a clean browser.
			this.client = null;
			try {
				await c.destroy();
			} catch (_) {
				/* ignore */
			}
		});

		c.on('change_state', (state) => this.emit('wa-state', { state }));

		// message_create covers both directions, so messages sent from the
		// phone or another linked device show up here too.
		c.on('message_create', async (msg) => {
			try {
				this.emit('message', await this.expandMessage(msg));
			} catch (err) {
				console.error('[wa] message_create:', err.message);
			}
		});

		c.on('message_ack', (msg, ack) => {
			this.emit('ack', {
				id: msg.id._serialized,
				chatId: msg.fromMe ? msg.to : msg.from,
				ack,
				ackLabel: ACK[String(ack)] || 'pending'
			});
		});

		c.on('message_edit', async (msg) => {
			try {
				this.emit('message-edit', await this.expandMessage(msg));
			} catch (_) {
				/* ignore */
			}
		});

		c.on('message_revoke_everyone', (after, before) => {
			const target = before || after;
			this.emit('revoke', {
				id: target.id._serialized,
				chatId: after.fromMe ? after.to : after.from
			});
		});

		c.on('message_reaction', (reaction) => {
			this.emit('reaction', {
				msgId: reaction.msgId ? reaction.msgId._serialized : null,
				chatId: reaction.id ? reaction.id.remote : null,
				senderId: reaction.senderId,
				reaction: reaction.reaction,
				timestamp: reaction.timestamp
			});
		});

		c.on('chat_archived', (chat, archived) => {
			this.emit('chat-update', { id: chat.id._serialized, archived });
		});

		c.on('chat_removed', (chat) => {
			this.emit('chat-removed', { id: chat.id._serialized });
		});

		c.on('group_join', (n) => this.emit('group-event', { type: 'join', chatId: n.chatId }));
		c.on('group_leave', (n) => this.emit('group-event', { type: 'leave', chatId: n.chatId }));
		c.on('group_update', (n) => this.emit('group-event', { type: 'update', chatId: n.chatId }));
	}

	/* ------------------------------------------------------------------ */
	/* reads                                                               */
	/* ------------------------------------------------------------------ */

	/** Resolve the async extras (quote, author, reactions) around a message. */
	async expandMessage(msg) {
		const extra = {};

		if (msg.hasQuotedMsg) {
			try {
				const quoted = await msg.getQuotedMessage();
				extra.quoted = {
					id: quoted.id._serialized,
					body: quoted.body || '',
					type: quoted.type,
					fromMe: !!quoted.fromMe,
					hasMedia: !!quoted.hasMedia,
					author: quoted.author || quoted.from
				};
			} catch (_) {
				/* the quoted message may have been deleted */
			}
		}

		if (msg.author) {
			try {
				const contact = await this.client.getContactById(msg.author);
				extra.authorName = displayName(contact, msg.author.split('@')[0]);
			} catch (_) {
				/* ignore */
			}
		}

		try {
			const reactions = await msg.getReactions();
			extra.reactions = (reactions || []).map((r) => ({
				emoji: r.aggregateEmoji || r.id,
				count: r.senders ? r.senders.length : 0,
				senders: (r.senders || []).map((s) => (typeof s === 'string' ? s : s.senderId))
			}));
		} catch (_) {
			/* getReactions is unsupported on some message types */
		}

		return serializeMessage(msg, extra);
	}

	async getChats({ archived = false, limit = config.chatLimit } = {}) {
		const client = this.require();
		const chats = await client.getChats();
		return chats
			.filter((c) => !!c.archived === !!archived)
			.sort((a, b) => {
				if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
				return (b.timestamp || 0) - (a.timestamp || 0);
			})
			.slice(0, limit)
			.map(serializeChat);
	}

	async getChat(chatId) {
		const client = this.require();
		const chat = await client.getChatById(chatId);
		const out = serializeChat(chat);

		if (chat.isGroup) {
			out.participants = await Promise.all(
				(chat.participants || []).map(async (p) => {
					const id = p.id._serialized;
					let name = id.split('@')[0];
					try {
						name = displayName(await client.getContactById(id), name);
					} catch (_) {
						/* ignore */
					}
					return { id, name, isAdmin: !!p.isAdmin, isSuperAdmin: !!p.isSuperAdmin };
				})
			);
			out.description = chat.description || null;
			out.owner = chat.owner ? chat.owner._serialized : null;
		} else {
			try {
				const contact = await chat.getContact();
				out.contact = serializeContact(contact);
				out.about = await contact.getAbout().catch(() => null);
			} catch (_) {
				/* ignore */
			}
		}
		return out;
	}

	/**
	 * Fetch a page of history. whatsapp-web.js can only fetch "the newest N",
	 * so paging back means asking for more and slicing off what we already
	 * showed - which is what `beforeId` does here.
	 */
	async getMessages(chatId, { limit = config.messagePage, beforeId = null } = {}) {
		const client = this.require();
		const chat = await client.getChatById(chatId);
		const fetchCount = beforeId ? limit * 4 : limit;
		let messages = await chat.fetchMessages({ limit: fetchCount });

		if (beforeId) {
			const idx = messages.findIndex((m) => m.id._serialized === beforeId);
			messages = idx > 0 ? messages.slice(Math.max(0, idx - limit), idx) : [];
		}

		return Promise.all(messages.map((m) => this.expandMessage(m)));
	}

	async searchMessages(query, { chatId = null, limit = 30, page = 1 } = {}) {
		const client = this.require();
		const opts = { limit, page };
		if (chatId) opts.chatId = chatId;
		const results = await client.searchMessages(query, opts);
		return Promise.all(results.map((m) => this.expandMessage(m)));
	}

	async getContacts() {
		const client = this.require();
		const contacts = await client.getContacts();
		return contacts
			.filter((c) => c.isWAContact && !c.isGroup && !c.isMe && c.id.server === 'c.us')
			.map(serializeContact)
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	/* ------------------------------------------------------------------ */
	/* media + avatars                                                     */
	/* ------------------------------------------------------------------ */

	/** Downloads (once) and returns a path on disk for a message's media. */
	async mediaFile(messageId) {
		const client = this.require();
		const safe = messageId.replace(/[^a-zA-Z0-9._-]/g, '_');
		const existing = fs.readdirSync(config.mediaCache).find((f) => f.startsWith(safe + '.'));
		if (existing) {
			const file = path.join(config.mediaCache, existing);
			return { file, mimetype: mime.lookup(file) || 'application/octet-stream' };
		}

		const msg = await client.getMessageById(messageId);
		if (!msg || !msg.hasMedia) {
			const err = new Error('Message has no media');
			err.status = 404;
			throw err;
		}

		const media = await msg.downloadMedia();
		if (!media) {
			const err = new Error('Media could not be downloaded (it may have expired on the phone)');
			err.status = 410;
			throw err;
		}

		const ext = mime.extension(media.mimetype) || 'bin';
		const file = path.join(config.mediaCache, safe + '.' + ext);
		fs.writeFileSync(file, Buffer.from(media.data, 'base64'));
		return { file, mimetype: media.mimetype, filename: media.filename };
	}

	/** Profile picture, cached on disk. Returns null when there is none. */
	async avatarFile(contactId) {
		const client = this.require();
		if (this.avatarMemo.has(contactId)) return this.avatarMemo.get(contactId);

		const safe = contactId.replace(/[^a-zA-Z0-9._-]/g, '_');
		const file = path.join(config.avatarCache, safe + '.jpg');
		if (fs.existsSync(file)) {
			this.avatarMemo.set(contactId, file);
			return file;
		}

		const url = await client.getProfilePicUrl(contactId).catch(() => null);
		if (!url) {
			this.avatarMemo.set(contactId, null);
			return null;
		}

		const res = await fetch(url);
		if (!res.ok) {
			this.avatarMemo.set(contactId, null);
			return null;
		}
		fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
		this.avatarMemo.set(contactId, file);
		return file;
	}

	/* ------------------------------------------------------------------ */
	/* writes                                                              */
	/* ------------------------------------------------------------------ */

	async sendText(chatId, body, { quotedMessageId = null, mentions = [] } = {}) {
		const client = this.require();
		const options = {};
		if (quotedMessageId) options.quotedMessageId = quotedMessageId;
		if (mentions && mentions.length) options.mentions = mentions;
		return this.expandMessage(await client.sendMessage(chatId, body, options));
	}

	async sendFile(chatId, { buffer, mimetype, filename }, opts = {}) {
		const client = this.require();
		const media = new MessageMedia(mimetype, buffer.toString('base64'), filename);
		const options = {};
		if (opts.caption) options.caption = opts.caption;
		if (opts.quotedMessageId) options.quotedMessageId = opts.quotedMessageId;
		if (opts.asDocument) options.sendMediaAsDocument = true;
		if (opts.asVoice) options.sendAudioAsVoice = true;
		if (opts.asSticker) options.sendMediaAsSticker = true;
		return this.expandMessage(await client.sendMessage(chatId, media, options));
	}

	async sendLocation(chatId, latitude, longitude, description) {
		const client = this.require();
		const loc = new Location(Number(latitude), Number(longitude), description || undefined);
		return this.expandMessage(await client.sendMessage(chatId, loc));
	}

	async setTyping(chatId, state) {
		const client = this.require();
		const chat = await client.getChatById(chatId);
		if (state === 'typing') await chat.sendStateTyping();
		else if (state === 'recording') await chat.sendStateRecording();
		else await chat.clearState();
		return { ok: true };
	}

	async chatAction(chatId, action, payload = {}) {
		const client = this.require();
		const chat = await client.getChatById(chatId);

		switch (action) {
			case 'seen':
				await chat.sendSeen();
				break;
			case 'unread':
				await chat.markUnread();
				break;
			case 'archive':
				payload.value ? await chat.archive() : await chat.unarchive();
				break;
			case 'pin':
				payload.value ? await chat.pin() : await chat.unpin();
				break;
			case 'mute': {
				if (payload.value) {
					const minutes = Number(payload.minutes || 0);
					// omitting the date mutes forever
					await chat.mute(minutes ? new Date(Date.now() + minutes * 60000) : undefined);
				} else {
					await chat.unmute();
				}
				break;
			}
			case 'clear':
				await chat.clearMessages();
				break;
			case 'delete':
				await chat.delete();
				return { id: chatId, deleted: true };
			default: {
				const err = new Error('Unknown chat action: ' + action);
				err.status = 400;
				throw err;
			}
		}
		return serializeChat(await client.getChatById(chatId).catch(() => chat));
	}

	async messageAction(messageId, action, payload = {}) {
		const client = this.require();
		const msg = await client.getMessageById(messageId);
		if (!msg) {
			const err = new Error('Message not found');
			err.status = 404;
			throw err;
		}

		switch (action) {
			case 'react':
				await msg.react(payload.emoji || '');
				break;
			case 'star':
				payload.value === false ? await msg.unstar() : await msg.star();
				break;
			case 'delete':
				await msg.delete(!!payload.everyone);
				break;
			case 'forward':
				await msg.forward(await client.getChatById(payload.chatId));
				break;
			case 'edit':
				await msg.edit(payload.body || '');
				break;
			case 'pin':
				await msg.pin(Number(payload.seconds || 604800));
				break;
			default: {
				const err = new Error('Unknown message action: ' + action);
				err.status = 400;
				throw err;
			}
		}
		return { ok: true };
	}

	async blockContact(contactId, blocked) {
		const client = this.require();
		const contact = await client.getContactById(contactId);
		blocked ? await contact.block() : await contact.unblock();
		return { ok: true, blocked: !!blocked };
	}

	/** Turn a raw phone number into a chat id we can open. */
	async resolveNumber(number) {
		const client = this.require();
		const digits = String(number).replace(/[^0-9]/g, '');
		const wid = await client.getNumberId(digits);
		if (!wid) {
			const err = new Error('That number is not on WhatsApp');
			err.status = 404;
			throw err;
		}
		return { id: wid._serialized, number: digits };
	}
}

module.exports = new WhatsAppBridge();

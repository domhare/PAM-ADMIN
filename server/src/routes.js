'use strict';

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const config = require('./config');
const wa = require('./wa-client');

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 64 * 1024 * 1024 } // WhatsApp itself caps around 64 MB
});

/** Wrap an async handler so rejections reach the error middleware. */
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const router = express.Router();

/* -------------------------------------------------------------------- */
/* session                                                               */
/* -------------------------------------------------------------------- */

router.get('/status', (req, res) => res.json(wa.status()));

router.post(
	'/session/start',
	h(async (req, res) => {
		await wa.start();
		res.json(wa.status());
	})
);

router.post(
	'/session/restart',
	h(async (req, res) => {
		await wa.restart();
		res.json(wa.status());
	})
);

router.post(
	'/session/logout',
	h(async (req, res) => {
		await wa.logout();
		res.json({ ok: true, ...wa.status() });
	})
);

/* -------------------------------------------------------------------- */
/* chats                                                                 */
/* -------------------------------------------------------------------- */

router.get(
	'/chats',
	h(async (req, res) => {
		const chats = await wa.getChats({
			archived: req.query.archived === '1' || req.query.archived === 'true',
			limit: Number(req.query.limit) || config.chatLimit
		});
		res.json({ chats });
	})
);

router.get(
	'/chats/:id',
	h(async (req, res) => res.json(await wa.getChat(req.params.id)))
);

router.get(
	'/chats/:id/messages',
	h(async (req, res) => {
		const messages = await wa.getMessages(req.params.id, {
			limit: Number(req.query.limit) || config.messagePage,
			beforeId: req.query.before || null
		});
		res.json({ messages, hasMore: messages.length > 0 });
	})
);

router.post(
	'/chats/:id/messages',
	h(async (req, res) => {
		const { body, quotedMessageId, mentions } = req.body || {};
		if (!body || !String(body).trim()) {
			return res.status(400).json({ error: 'body is required' });
		}
		res.json(await wa.sendText(req.params.id, String(body), { quotedMessageId, mentions }));
	})
);

router.post(
	'/chats/:id/media',
	upload.single('file'),
	h(async (req, res) => {
		if (!req.file) return res.status(400).json({ error: 'file is required' });
		const message = await wa.sendFile(
			req.params.id,
			{
				buffer: req.file.buffer,
				mimetype: req.file.mimetype || 'application/octet-stream',
				filename: req.file.originalname
			},
			{
				caption: req.body.caption || '',
				quotedMessageId: req.body.quotedMessageId || null,
				asDocument: req.body.asDocument === 'true',
				asVoice: req.body.asVoice === 'true',
				asSticker: req.body.asSticker === 'true'
			}
		);
		res.json(message);
	})
);

router.post(
	'/chats/:id/location',
	h(async (req, res) => {
		const { latitude, longitude, description } = req.body || {};
		res.json(await wa.sendLocation(req.params.id, latitude, longitude, description));
	})
);

router.post(
	'/chats/:id/typing',
	h(async (req, res) => res.json(await wa.setTyping(req.params.id, (req.body || {}).state)))
);

// seen | unread | archive | pin | mute | clear | delete
router.post(
	'/chats/:id/:action',
	h(async (req, res) => res.json(await wa.chatAction(req.params.id, req.params.action, req.body || {})))
);

/* -------------------------------------------------------------------- */
/* messages                                                              */
/* -------------------------------------------------------------------- */

// react | star | delete | forward | edit | pin
router.post(
	'/messages/:id/:action',
	h(async (req, res) =>
		res.json(await wa.messageAction(req.params.id, req.params.action, req.body || {}))
	)
);

/** Streams cached media. `?download=1` forces a save dialog. */
router.get(
	'/media/:id',
	h(async (req, res) => {
		const { file, mimetype, filename } = await wa.mediaFile(req.params.id);
		res.setHeader('Content-Type', mimetype || 'application/octet-stream');
		res.setHeader('Cache-Control', 'private, max-age=86400');
		if (req.query.download) {
			const name = filename || path.basename(file);
			res.setHeader('Content-Disposition', 'attachment; filename="' + name.replace(/"/g, '') + '"');
		}
		fs.createReadStream(file).pipe(res);
	})
);

/* -------------------------------------------------------------------- */
/* contacts / search                                                     */
/* -------------------------------------------------------------------- */

router.get(
	'/contacts',
	h(async (req, res) => res.json({ contacts: await wa.getContacts() }))
);

router.post(
	'/contacts/resolve',
	h(async (req, res) => res.json(await wa.resolveNumber((req.body || {}).number)))
);

router.post(
	'/contacts/:id/block',
	h(async (req, res) => res.json(await wa.blockContact(req.params.id, (req.body || {}).value !== false)))
);

/** Profile picture proxy. Falls back to a generated initials avatar. */
router.get(
	'/avatar/:id',
	h(async (req, res) => {
		let file = null;
		try {
			file = await wa.avatarFile(req.params.id);
		} catch (_) {
			/* not connected yet - fall through to the placeholder */
		}

		if (file) {
			res.setHeader('Content-Type', 'image/jpeg');
			res.setHeader('Cache-Control', 'private, max-age=3600');
			return fs.createReadStream(file).pipe(res);
		}

		const label = String(req.query.name || req.params.id.split('@')[0] || '?');
		const initials = label
			.replace(/[^\p{L}\p{N} ]/gu, '')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0].toUpperCase())
			.join('') || '#';

		// Deterministic hue so the same person keeps the same colour.
		let hash = 0;
		for (const ch of req.params.id) hash = (hash * 31 + ch.charCodeAt(0)) % 360;

		const svg =
			'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
			'<rect width="96" height="96" rx="48" fill="hsl(' + hash + ',52%,58%)"/>' +
			'<text x="48" y="48" dy="0.36em" text-anchor="middle" fill="#fff" ' +
			'font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="38" font-weight="600">' +
			initials +
			'</text></svg>';

		res.setHeader('Content-Type', 'image/svg+xml');
		res.setHeader('Cache-Control', 'private, max-age=3600');
		res.send(svg);
	})
);

router.get(
	'/search',
	h(async (req, res) => {
		const q = String(req.query.q || '').trim();
		if (!q) return res.json({ messages: [] });
		const messages = await wa.searchMessages(q, {
			chatId: req.query.chatId || null,
			limit: Number(req.query.limit) || 30,
			page: Number(req.query.page) || 1
		});
		res.json({ messages });
	})
);

module.exports = router;

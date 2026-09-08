'use strict';

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const config = require('./src/config');
const wa = require('./src/wa-client');
const routes = require('./src/routes');

const app = express();
const server = http.createServer(app);

/* -------------------------------------------------------------------- */
/* middleware                                                            */
/* -------------------------------------------------------------------- */

const corsOptions = {
	origin: config.corsOrigins.length ? config.corsOrigins : true,
	credentials: true,
	allowedHeaders: ['Content-Type', 'x-wa-token']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));

/** Optional shared-secret gate. Disabled when API_TOKEN is empty. */
function checkToken(req, res, next) {
	if (!config.apiToken) return next();
	const supplied = req.get('x-wa-token') || req.query.token;
	if (supplied === config.apiToken) return next();
	res.status(401).json({ error: 'Invalid or missing API token' });
}

app.use('/api', checkToken, routes);

app.get('/health', (req, res) => res.json({ ok: true, state: wa.state }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	const status = err.status || 500;
	if (status >= 500) console.error('[api]', err);
	res.status(status).json({ error: err.message || 'Internal error' });
});

/* -------------------------------------------------------------------- */
/* realtime                                                              */
/* -------------------------------------------------------------------- */

const io = new Server(server, { cors: corsOptions });

io.use((socket, next) => {
	if (!config.apiToken) return next();
	const supplied = socket.handshake.auth && socket.handshake.auth.token;
	if (supplied === config.apiToken) return next();
	next(new Error('Invalid or missing API token'));
});

io.on('connection', (socket) => {
	// Bring a freshly connected tab up to date immediately.
	socket.emit('wa:status', wa.status());

	socket.on('wa:typing', async ({ chatId, state } = {}) => {
		try {
			await wa.setTyping(chatId, state);
		} catch (_) {
			/* not connected - harmless */
		}
	});
});

/** Rebroadcast everything the bridge emits under a `wa:` prefix. */
const forward = {
	state: 'wa:status',
	qr: 'wa:qr',
	message: 'wa:message',
	'message-edit': 'wa:message-edit',
	ack: 'wa:ack',
	revoke: 'wa:revoke',
	reaction: 'wa:reaction',
	'chat-update': 'wa:chat-update',
	'chat-removed': 'wa:chat-removed',
	'group-event': 'wa:group-event',
	'wa-state': 'wa:connection'
};

for (const [source, target] of Object.entries(forward)) {
	wa.on(source, (payload) => io.emit(target, payload));
}

/* -------------------------------------------------------------------- */
/* boot                                                                  */
/* -------------------------------------------------------------------- */

server.listen(config.port, () => {
	console.log('');
	console.log('  PAM-ADMIN WhatsApp bridge');
	console.log('  ─────────────────────────');
	console.log('  API      http://localhost:' + config.port + '/api');
	console.log('  Origins  ' + (config.corsOrigins.join(', ') || '(any)'));
	console.log('  Token    ' + (config.apiToken ? 'required' : 'disabled'));
	console.log('  Session  ' + config.sessionPath);
	console.log('');
	console.log('  Starting WhatsApp… open chat.html and scan the QR code.');
	console.log('');

	wa.start().catch((err) => console.error('[wa] start failed:', err));
});

const shutdown = async (signal) => {
	console.log('\n[' + signal + '] shutting down…');
	try {
		await wa.stop();
	} catch (_) {
		/* ignore */
	}
	server.close(() => process.exit(0));
	setTimeout(() => process.exit(0), 5000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

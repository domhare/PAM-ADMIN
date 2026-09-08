'use strict';

const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bool = (v, fallback) => {
	if (v === undefined || v === '') return fallback;
	return String(v).toLowerCase() !== 'false' && String(v) !== '0';
};

const resolve = (p, fallback) => path.resolve(__dirname, '..', p || fallback);

const config = {
	port: Number(process.env.PORT || 3001),
	corsOrigins: (process.env.CORS_ORIGINS || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean),
	apiToken: (process.env.API_TOKEN || '').trim(),
	sessionPath: resolve(process.env.SESSION_PATH, './.session'),
	cachePath: resolve(process.env.CACHE_PATH, './.cache'),
	headless: bool(process.env.HEADLESS, true),
	chatLimit: Number(process.env.CHAT_LIMIT || 100),
	messagePage: Number(process.env.MESSAGE_PAGE || 50)
};

config.mediaCache = path.join(config.cachePath, 'media');
config.avatarCache = path.join(config.cachePath, 'avatars');

for (const dir of [config.sessionPath, config.cachePath, config.mediaCache, config.avatarCache]) {
	fs.mkdirSync(dir, { recursive: true });
}

module.exports = config;

/*
 * WhatsApp bridge connection settings.
 *
 * Edit this file once and upload it with the rest of the site - every visitor
 * then points at the right bridge without touching the settings dialog.
 *
 * A user who changes the values in the in-page "Bridge settings" dialog
 * overrides this file for their own browser until they hit "Use site default".
 */
window.WA_CONFIG = {
	/**
	 * Where the Node bridge is reachable from the *visitor's* browser.
	 *
	 *   local testing   http://localhost:3001
	 *   your own server https://wa.example.com
	 *
	 * When chat.html is served over HTTPS this must be HTTPS too - browsers
	 * block plain-HTTP requests from an HTTPS page.
	 */
	baseUrl: 'http://localhost:3001',

	/**
	 * Must match API_TOKEN in the bridge's .env.
	 *
	 * Leave empty ONLY while the bridge is on localhost. Anything reachable
	 * from the internet must set a token - without one, whoever finds the URL
	 * controls the WhatsApp account.
	 *
	 * Note this file is public: the token stops strangers, not your own users.
	 */
	token: ''
};

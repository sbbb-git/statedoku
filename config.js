const CONFIG = {
  // Global feature flags
  ADS_ENABLED: false,                // false → no ads, no consent banner. Toggle from superadmin.
  ADSENSE_PUBLISHER_ID: 'ca-pub-XXXXXXXXXXXXXXXX',

  // Superadmin: SHA-256 hash of the admin password.
  // ⚠️ Change immediately with: node bin/set-admin-password.mjs
  // Default password: ChangeMe_Statedoku_2026
  ADMIN_HASH: '2f3ea12d2c6b09261face5c781edded84dd767e1877b6e5301c4b1531dfaddf5',

  // i18n + storage
  DEFAULT_LANG: 'en',
  SUPPORTED_LANGS: ['en', 'fr', 'es'],
  GAME_NAME: 'Statedoku',
  VERSION: '1.0.0',
  STORAGE_KEY: 'statedoku_v1',
};

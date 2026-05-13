#!/usr/bin/env node
// Set the superadmin password for Statedoku.
// Usage: node bin/set-admin-password.mjs
// The password is NEVER stored anywhere — only its SHA-256 hash is written to config.js.

import crypto from 'node:crypto';
import fs from 'node:fs';
import readline from 'node:readline';

function prompt(question, silent = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (silent) {
      // Mask password input (Node doesn't have native getpass)
      const stdin = process.stdin;
      const onData = (char) => {
        char = char.toString();
        if (char === '\n' || char === '\r' || char === '') {
          stdin.removeListener('data', onData);
        } else {
          process.stdout.write('\b \b');
        }
      };
      stdin.on('data', onData);
    }
    rl.question(question, (answer) => {
      rl.close();
      if (silent) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

(async () => {
  console.log('\n🔒  Statedoku — Set superadmin password\n');

  const pwd1 = await prompt('New password: ', true);
  if (!pwd1 || pwd1.length < 8) {
    console.error('✘ Password must be at least 8 characters.');
    process.exit(1);
  }
  const pwd2 = await prompt('Confirm:      ', true);
  if (pwd1 !== pwd2) {
    console.error('✘ Passwords do not match.');
    process.exit(1);
  }

  const hash = sha256(pwd1);
  const configPath = new URL('../config.js', import.meta.url);
  let config = fs.readFileSync(configPath, 'utf8');
  config = config.replace(
    /ADMIN_HASH:\s*'[a-f0-9]+'/,
    `ADMIN_HASH: '${hash}'`
  );
  fs.writeFileSync(configPath, config);

  console.log('\n✓ Updated config.js');
  console.log('  ADMIN_HASH:', hash.slice(0, 16) + '…');
  console.log('\nNext steps:');
  console.log('  git add config.js');
  console.log('  git commit -m "Rotate admin password"');
  console.log('  git push');
  console.log('\nThen visit https://your-domain/#admin and use the new password.\n');
})();

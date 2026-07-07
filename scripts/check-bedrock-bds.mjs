#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

import { getBdsVerifierStatus } from '../lib/bedrock-bds-oracle.js';

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, value] = match;
    if (process.env[key] == null) {
      process.env[key] = unquote(value);
    }
  }
}

loadEnvLocal();

const status = getBdsVerifierStatus();
console.log(JSON.stringify(status, null, 2));

if (!status.available) {
  process.exitCode = 1;
}

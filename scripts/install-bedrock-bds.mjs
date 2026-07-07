#!/usr/bin/env node

import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

const DOWNLOAD_LINKS_URL = 'https://net-secondary.web.minecraft-services.net/api/v1.0/download/links';
const OFFICIAL_DOWNLOAD_PAGE = 'https://www.minecraft.net/en-us/download/server/bedrock';
const MINECRAFT_EULA_URL = 'https://www.minecraft.net/eula';
const MICROSOFT_PRIVACY_URL = 'https://privacy.microsoft.com/privacystatement';

const ACCEPTANCE_ENV_NAMES = ['MINECRAFT_EULA_ACCEPTED', 'ACCEPT_MINECRAFT_EULA'];

function parseArgs(argv) {
  const args = {
    force: false,
    preview: false,
    writeEnv: true,
    target: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--force') {
      args.force = true;
    } else if (arg === '--preview') {
      args.preview = true;
    } else if (arg === '--no-env') {
      args.writeEnv = false;
    } else if (arg === '--target' || arg === '-t') {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} requires a path`);
      args.target = value;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return args;
}

function hasAcceptedMinecraftTerms() {
  return ACCEPTANCE_ENV_NAMES.some(name => /^(1|true|yes)$/i.test(process.env[name] || ''));
}

function requireTermsAcceptance() {
  if (hasAcceptedMinecraftTerms()) return;

  console.error('Bedrock Dedicated Server is official Minecraft software and its download page requires agreement to Minecraft terms.');
  console.error('');
  console.error(`Review the official page: ${OFFICIAL_DOWNLOAD_PAGE}`);
  console.error(`Minecraft EULA: ${MINECRAFT_EULA_URL}`);
  console.error(`Microsoft Privacy Statement: ${MICROSOFT_PRIVACY_URL}`);
  console.error('');
  console.error('After you have reviewed and accepted those terms, rerun with:');
  console.error('  PowerShell: $env:MINECRAFT_EULA_ACCEPTED="true"; npm run bds:install');
  console.error('  Bash:       MINECRAFT_EULA_ACCEPTED=true npm run bds:install');
  process.exit(1);
}

function detectDownloadType(preview) {
  if (process.platform === 'win32') {
    return preview ? 'serverBedrockPreviewWindows' : 'serverBedrockWindows';
  }

  if (process.platform === 'linux') {
    return preview ? 'serverBedrockPreviewLinux' : 'serverBedrockLinux';
  }

  throw new Error(`BDS is only distributed for Windows and Linux, not ${process.platform}`);
}

async function getDownloadUrl(downloadType) {
  if (typeof fetch !== 'function') {
    throw new Error('This installer requires Node.js 18 or newer for fetch().');
  }

  const response = await fetch(DOWNLOAD_LINKS_URL);
  if (!response.ok) {
    throw new Error(`Minecraft download link request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const links = payload?.result?.links;
  if (!Array.isArray(links)) {
    throw new Error('Minecraft download link response did not include result.links.');
  }

  const link = links.find(item => item.downloadType === downloadType)?.downloadUrl;
  if (!link) {
    throw new Error(`Minecraft download link response did not include ${downloadType}.`);
  }

  const parsed = new URL(link);
  if (parsed.hostname !== 'www.minecraft.net' || !parsed.pathname.includes('/bedrockdedicatedserver/')) {
    throw new Error(`Unexpected BDS download URL: ${link}`);
  }

  return link;
}

function versionFromUrl(url) {
  return new URL(url).pathname.match(/bedrock-server-([\d.]+)\.zip$/)?.[1] || 'unknown';
}

function defaultTarget() {
  return path.resolve(process.cwd(), '.local', 'bedrock-dedicated-server');
}

function assertSafeRemoval(target) {
  const resolved = path.resolve(target);
  const root = path.parse(resolved).root;
  if (resolved === root || resolved === os.homedir()) {
    throw new Error(`Refusing to remove unsafe target: ${resolved}`);
  }
}

function ensureEmptyTarget(target, force) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
    return;
  }

  const entries = fs.readdirSync(target);
  if (entries.length === 0) return;

  if (!force) {
    throw new Error(`${target} is not empty. Use --force to replace it or --target to choose another folder.`);
  }

  assertSafeRemoval(target);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`BDS download failed: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destination, buffer);
}

function run(command, args, label) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

function extractZip(zipPath, target) {
  if (process.platform === 'win32') {
    run('powershell', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      'Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force',
      zipPath,
      target,
    ], 'Expand-Archive');
    return;
  }

  const unzip = spawnSync('unzip', ['-q', zipPath, '-d', target], { stdio: 'inherit' });
  if (!unzip.error && unzip.status === 0) return;

  run('tar', ['-xf', zipPath, '-C', target], 'tar extraction');
}

function executableName() {
  return process.platform === 'win32' ? 'bedrock_server.exe' : 'bedrock_server';
}

function normalizeEnvPath(value) {
  return path.resolve(value).replace(/\\/g, '/');
}

function updateEnvLocal(target) {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const key = 'BEDROCK_BDS_ROOT';
  const value = normalizeEnvPath(target);
  const line = `${key}=${value}`;
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const next = new RegExp(`^${key}=.*$`, 'm').test(existing)
    ? existing.replace(new RegExp(`^${key}=.*$`, 'm'), line)
    : `${existing.replace(/\s*$/, '')}${existing.trim() ? os.EOL : ''}${line}${os.EOL}`;

  fs.writeFileSync(envPath, next);
  return envPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  requireTermsAcceptance();

  const downloadType = detectDownloadType(args.preview);
  const downloadUrl = await getDownloadUrl(downloadType);
  const version = versionFromUrl(downloadUrl);
  const target = path.resolve(args.target || defaultTarget());
  const tempZip = path.join(os.tmpdir(), `bedrock-server-${version}-${Date.now()}.zip`);

  console.log(`Downloading ${downloadType} ${version} from official Minecraft services...`);
  ensureEmptyTarget(target, args.force);
  await downloadFile(downloadUrl, tempZip);

  try {
    console.log(`Extracting BDS into ${target}...`);
    extractZip(tempZip, target);
  } finally {
    fs.rmSync(tempZip, { force: true });
  }

  const executable = path.join(target, executableName());
  if (!fs.existsSync(executable)) {
    throw new Error(`Install finished, but ${executableName()} was not found in ${target}.`);
  }

  let envPath = null;
  if (args.writeEnv) {
    envPath = updateEnvLocal(target);
  }

  console.log('');
  console.log(`Installed Bedrock Dedicated Server ${version}.`);
  console.log(`BEDROCK_BDS_ROOT=${normalizeEnvPath(target)}`);
  if (envPath) {
    console.log(`Updated ${envPath}. Restart the dev server so Next.js reloads .env.local.`);
  }
  console.log('Run npm run bds:status to confirm the verifier can see it.');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});

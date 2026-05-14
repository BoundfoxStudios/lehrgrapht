#!/usr/bin/env node
import { resolve, basename, dirname, extname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const WEBEXTENSION_PATH_PATTERN = /^word\/webextensions\/webextension\d+\.xml$/;
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(SCRIPT_DIR, '../manifest.xml');

function readManifestId() {
  const manifest = readFileSync(MANIFEST_PATH, 'utf8');
  const match = manifest.match(/<Id>([^<]+)<\/Id>/);
  if (!match) {
    throw new Error(`Could not read <Id> from ${MANIFEST_PATH}`);
  }
  return match[1].trim().toUpperCase();
}

function patchWebextensionXml(xml, referenceId) {
  let patched = xml;
  let changed = false;

  patched = patched.replace(
    /(<we:reference\b[^>]*?\bid=")([^"]*)(")/g,
    (match, prefix, current, suffix) => {
      if (current === referenceId) return match;
      changed = true;
      return `${prefix}${referenceId}${suffix}`;
    },
  );

  patched = patched.replace(
    /(<we:reference\b[^>]*?\bstore=")([^"]*)(")/g,
    (match, prefix, current, suffix) => {
      if (current === 'developer') return match;
      changed = true;
      return `${prefix}developer${suffix}`;
    },
  );

  patched = patched.replace(
    /(<we:reference\b[^>]*?\bstoreType=")([^"]*)(")/g,
    (match, prefix, current, suffix) => {
      if (current === 'Registry') return match;
      changed = true;
      return `${prefix}Registry${suffix}`;
    },
  );

  const altOpenTagRegex = /<we:alternateReferences\b[^>]*\/>/g;
  const altPairRegex =
    /<we:alternateReferences\b[^>]*>[\s\S]*?<\/we:alternateReferences>/g;

  if (altPairRegex.test(patched)) {
    patched = patched.replace(altPairRegex, '<we:alternateReferences/>');
    changed = true;
  } else if (!altOpenTagRegex.test(patched)) {
    patched = patched.replace(
      /(<\/we:reference>)/,
      '$1<we:alternateReferences/>',
    );
    changed = true;
  }

  return { xml: patched, changed };
}

function patchDocx(inputPath, outputPath, referenceId) {
  if (!existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const zip = new AdmZip(inputPath);
  const entries = zip
    .getEntries()
    .filter(entry => WEBEXTENSION_PATH_PATTERN.test(entry.entryName));

  if (entries.length === 0) {
    throw new Error(
      `No word/webextensions/webextension*.xml found in ${inputPath}`,
    );
  }

  let totalChanged = 0;
  for (const entry of entries) {
    const original = entry.getData().toString('utf8');
    const { xml, changed } = patchWebextensionXml(original, referenceId);
    if (changed) {
      zip.updateFile(entry.entryName, Buffer.from(xml, 'utf8'));
      totalChanged++;
      console.log(`  patched ${entry.entryName}`);
    } else {
      console.log(`  unchanged ${entry.entryName}`);
    }
  }

  zip.writeZip(outputPath);
  console.log(
    `\nDone. ${totalChanged}/${entries.length} entries patched. Output: ${outputPath}`,
  );
}

function buildOutputPath(inputPath, explicit) {
  if (explicit) return resolve(explicit);
  const dir = dirname(inputPath);
  const ext = extname(inputPath);
  const base = basename(inputPath, ext);
  return join(dir, `${base}.dev${ext}`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(
      `Usage: node tasks/patch-docx.mjs <input.docx> [--out <output.docx>] [--in-place] [--id <guid>]\n` +
        `\n` +
        `Patches word/webextensions/webextension*.xml inside a docx so the embedded\n` +
        `add-in references match a sideloaded dev manifest:\n` +
        `  - <we:reference id="<MANIFEST-ID UPPERCASE>" store="developer" storeType="Registry"/>\n` +
        `  - <we:alternateReferences/> (emptied)\n` +
        `\n` +
        `The id defaults to the <Id> from ../manifest.xml (uppercased). Override with --id.\n` +
        `By default writes to "<input>.dev.docx" next to the input.`,
    );
    process.exit(args.length === 0 ? 1 : 0);
  }

  const inputPath = resolve(args[0]);
  const inPlace = args.includes('--in-place');
  const outIndex = args.indexOf('--out');
  const explicitOut = outIndex >= 0 ? args[outIndex + 1] : undefined;
  const idIndex = args.indexOf('--id');
  const explicitId = idIndex >= 0 ? args[idIndex + 1] : undefined;

  if (inPlace && explicitOut) {
    throw new Error('Use either --in-place or --out, not both.');
  }

  const referenceId = (explicitId ?? readManifestId()).toUpperCase();
  const outputPath = inPlace
    ? inputPath
    : buildOutputPath(inputPath, explicitOut);

  console.log(`Patching ${inputPath}`);
  console.log(`Reference id: ${referenceId}`);
  patchDocx(inputPath, outputPath, referenceId);
}

main();

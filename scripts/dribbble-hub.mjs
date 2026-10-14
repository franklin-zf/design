import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  createInspirationBinding,
  getLibraryStatus,
  getShot,
  listShots,
  loadShotsIndex,
  searchShots,
  syncDailyShots,
  validateShotsIndex,
  verifyLibrary
} from '../packages/dribbble-hub-mcp/src/index.mjs';
import {
  ingestReference,
  retireReference,
  verifyFreshness
} from './manage-dribbble-library.mjs';

function optionValue(args, name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function print(value) {
  console.log(JSON.stringify(value, null, 2));
}

function runCli() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  if (command === 'search') {
    const query = args[1] || '';
    const limit = Number.parseInt(
      optionValue(args, '--limit') || args[2],
      10
    ) || 5;
    print(searchShots(query, { limit }));
    return;
  }
  if (command === 'get') {
    const id = args[1];
    if (!id) throw new Error('get requires a shot id');
    const shot = getShot(id);
    if (!shot) throw new Error(`shot not found: ${id}`);
    print(shot);
    return;
  }
  if (command === 'status') {
    const status = getLibraryStatus();
    print(status);
    if (!status.ready) process.exitCode = 1;
    return;
  }
  if (command === 'verify') {
    const result = verifyLibrary({
      count: Number.parseInt(optionValue(args, '--count'), 10) || 4
    });
    print(result);
    if (!result.success) process.exitCode = 1;
    return;
  }
  if (command === 'sync') {
    const count = Number.parseInt(optionValue(args, '--count'), 10) || 4;
    const result = syncDailyShots({ count });
    print(result);
    if (!result.success) process.exitCode = 1;
    return;
  }
  if (command === 'list') {
    const limit = Number.parseInt(
      optionValue(args, '--limit') || args[1],
      10
    ) || 20;
    print(listShots({ limit }));
    return;
  }
  if (command === 'binding') {
    if (!args[1]) throw new Error('binding requires an input JSON path');
    print(createInspirationBinding(
      JSON.parse(readFileSync(args[1], 'utf8'))
    ));
    return;
  }
  if (command === 'ingest') {
    if (!args[1]) throw new Error('ingest requires a record JSON path');
    print(ingestReference(
      JSON.parse(readFileSync(args[1], 'utf8'))
    ));
    return;
  }
  if (command === 'retire') {
    if (!args[1]) throw new Error('retire requires a reference id');
    print(retireReference(args[1], optionValue(args, '--reason')));
    return;
  }
  if (command === 'freshness') {
    const result = verifyFreshness({
      maxAgeDays: Number.parseInt(
        optionValue(args, '--max-age-days'),
        10
      ) || 90
    });
    print(result);
    if (!result.ready) process.exitCode = 1;
    return;
  }
  throw new Error(
    `Unknown command: ${command}. Available: search, get, list, status, verify, binding, ingest, retire, freshness, sync`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

export {
  createInspirationBinding,
  getLibraryStatus,
  getShot,
  listShots,
  loadShotsIndex,
  searchShots,
  syncDailyShots,
  validateShotsIndex,
  verifyLibrary
};

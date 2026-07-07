import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const failures = [];
const warnings = [];

async function exists(relative) {
  try {
    await fs.access(path.join(ROOT, relative));
    return true;
  } catch {
    return false;
  }
}

async function read(relative) {
  return fs.readFile(path.join(ROOT, relative), "utf8");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

const requiredFiles = [
  "src/module/commander/runtime/action-tracker.js",
  "src/module/commander/runtime/damage-service.js",
  "src/module/commander/runtime/friendship-service.js",
  "src/module/commander/runtime/hooks.js",
  "src/module/commander/runtime/roll-service.js",
  "src/module/commander/sheets/base-sheet.js",
  "src/module/commander/sheets/pokemon-sheet.js",
  "src/module/commander/sheets/trainer-sheet.js",
  "src/module/commander/templates/chat/check-card.hbs",
  "src/module/commander/templates/chat/move-card.hbs",
  "src/module/commander/templates/pokemon/bond.hbs",
  "src/module/commander/templates/pokemon/moves.hbs"
];

for (const file of requiredFiles) assert(await exists(file), `Missing required runtime file: ${file}`);

const init = await read("src/scripts/hooks/init.js");
assert(init.includes("registerCommanderRuntimeHooks"), "Commander runtime hooks are not imported into init.js.");
assert(init.includes("registerCommanderRuntimeHooks();"), "Commander runtime hooks are not registered during init.");

const pokemonSheet = await read("src/module/commander/sheets/pokemon-sheet.js");
assert(pokemonSheet.includes('bond: { template: "systems/ptu/src/module/commander/templates/pokemon/bond.hbs" }'), "Pokemon bond part is not registered.");
assert(pokemonSheet.includes("CommanderFriendshipService"), "Pokemon sheet does not expose Friendship state.");
assert(pokemonSheet.includes("Only the GM can change Friendship"), "Friendship controls are not explicitly GM restricted.");

const damage = await read("src/module/commander/runtime/damage-service.js");
assert(damage.includes("confirmResolve"), "Lethal damage does not check Friendship Resolve.");
assert(damage.includes("nextHp = 1"), "Friendship Resolve does not preserve 1 HP.");
assert(damage.includes("temporaryHp"), "Damage application does not account for temporary HP.");

const friendship = await read("src/module/commander/runtime/friendship-service.js");
assert(friendship.includes("value >= 180"), "Friendship Resolve threshold is not locked at 180.");
assert(friendship.includes("heldOnUsed"), "Friendship Resolve usage is not persisted.");
assert(friendship.includes("game.user?.isGM"), "Friendship mutation is not GM gated.");

const movesTemplate = await read("src/module/commander/templates/pokemon/moves.hbs");
assert(!movesTemplate.includes('data-action="openEmbedded"'), "Moves template still references removed openEmbedded action.");
assert(movesTemplate.includes('data-action="openDocument"'), "Moves template does not use openDocument action.");

const baseSheet = await read("src/module/commander/sheets/base-sheet.js");
assert(baseSheet.includes("function resolveApplication"), "Sheet actions do not use the hardened application resolver.");
assert(baseSheet.includes("parts[tab] ?"), "Tab changes do not guard missing sheet parts.");

const hooks = await read("src/module/commander/runtime/hooks.js");
assert(hooks.includes('Hooks.on("renderChatMessageHTML"'), "V14 chat render hook is missing.");
warn(hooks.includes('Hooks.on("renderChatMessage"'), "Legacy chat render compatibility hook is missing.");

const system = JSON.parse(await read("system.json"));
warn(Number(system.compatibility?.verified ?? 0) >= 14, "system.json is not yet verified for Foundry V14.");
warn(Number(system.compatibility?.minimum ?? 0) >= 14, "system.json still permits pre-V14 installation.");

console.log(`Commander runtime audit: ${failures.length} failure(s), ${warnings.length} warning(s).`);
for (const message of warnings) console.warn(`WARNING: ${message}`);
for (const message of failures) console.error(`FAILURE: ${message}`);

if (failures.length) process.exitCode = 1;

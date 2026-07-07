import { CommanderHooks } from "./module/commander/hooks.js";
import { PtuHooks } from "./scripts/hooks/index.js";

CommanderHooks.listen();
PtuHooks.listen();

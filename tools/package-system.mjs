import { createWriteStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "dist", "pokemon-foundry-tt.zip");
const validation = spawnSync(process.execPath, [path.join(root, "tools", "validate-system.mjs")], { stdio: "inherit" });
if (validation.status !== 0) process.exit(validation.status ?? 1);

const zipCheck = spawnSync("zip", ["-v"], { stdio: "ignore" });
if (zipCheck.status !== 0) {
  console.error("The 'zip' command is required to create a Foundry install archive.");
  process.exit(1);
}

await import("node:fs/promises").then(({ mkdir, rm }) => Promise.all([
  mkdir(path.dirname(output), { recursive: true }),
  rm(output, { force: true })
]));

const include = ["css", "images", "packs", "src", "static", "system.json", "template.json", "README.md"];
const args = ["-q", "-0", "-r", output, ...include];
const result = spawnSync("zip", args, { cwd: root, stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
const size = (await stat(output)).size;
console.log(`Created ${path.relative(root, output)} (${(size / 1024 / 1024).toFixed(1)} MiB)`);

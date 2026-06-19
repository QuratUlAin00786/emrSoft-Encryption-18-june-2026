import { access, mkdir, lstat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sdkDir = resolve(rootDir, "encryption-sdk");
const averoxDir = resolve(rootDir, "node_modules", "@averox");
const linkPath = resolve(averoxDir, "curaemrencryption-crypto-sdk");

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await pathExists(sdkDir))) {
    throw new Error(`encryption-sdk folder not found at ${sdkDir}`);
  }

  if (!(await pathExists(resolve(sdkDir, "dist", "esm", "index.js")))) {
    throw new Error(
      "encryption-sdk is not built. Run: npm run build:encryption-sdk",
    );
  }

  await mkdir(averoxDir, { recursive: true });

  const shimPackageJson = resolve(linkPath, "package.json");
  const shimIndexJs = resolve(linkPath, "index.js");
  const shimIndexContents =
    'export * from "../../../encryption-sdk/dist/esm/index.js";\n';
  const shimPackageContents = JSON.stringify(
    {
      name: "@averox/curaemrencryption-crypto-sdk",
      version: "2.0.0",
      type: "module",
      main: "./index.js",
      module: "./index.js",
      types: "../../../encryption-sdk/dist/types/index.d.ts",
      exports: {
        ".": {
          types: "../../../encryption-sdk/dist/types/index.d.ts",
          import: "./index.js",
          default: "./index.js",
        },
      },
    },
    null,
    2,
  ) + "\n";

  if (await pathExists(linkPath)) {
    const stats = await lstat(linkPath);
    if (stats.isSymbolicLink()) {
      return;
    }
    if (stats.isDirectory()) {
      if (
        (await pathExists(shimIndexJs)) &&
        (await pathExists(shimPackageJson))
      ) {
        return;
      }
    } else {
      throw new Error(`Unexpected file at ${linkPath}; remove it and re-run setup`);
    }
  } else {
    await mkdir(linkPath, { recursive: true });
  }

  const { writeFile } = await import("node:fs/promises");
  await writeFile(shimIndexJs, shimIndexContents, "utf8");
  await writeFile(shimPackageJson, shimPackageContents, "utf8");
  console.log(`[ensure-encryption-sdk-link] Created shim package at ${linkPath}`);
}

main().catch((error) => {
  console.error("[ensure-encryption-sdk-link]", error.message || error);
  process.exit(1);
});

import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import process from "node:process";
import { join, resolve } from "node:path";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const temporaryDirectory = mkdtempSync(
  join(tmpdir(), "pfx-password-core-consumer-"),
);

let tarballPath;

try {
  const packOutput = execFileSync(
    npmCommand,
    ["pack", "--silent"],
    { encoding: "utf8" },
  );

  const filename = packOutput
    .trim()
    .split(/\r?\n/u)
    .filter(Boolean)
    .at(-1);

  if (filename === undefined) {
    throw new Error("npm pack did not return a tarball filename.");
  }

  tarballPath = resolve(filename);

  writeFileSync(
    join(temporaryDirectory, "package.json"),
    JSON.stringify(
      {
        name: "pfx-password-core-consumer-smoke",
        private: true,
        type: "module",
      },
      null,
      2,
    ),
  );

  execFileSync(
    npmCommand,
    [
      "install",
      tarballPath,
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
    ],
    {
      cwd: temporaryDirectory,
      stdio: "inherit",
    },
  );

  const smokeFile = join(temporaryDirectory, "smoke.mjs");

  writeFileSync(
    smokeFile,
    `import {
  analyzePasswordGenerationEntropy,
  generatePassword,
} from "pfx-password-core";

const options = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
};

const password = generatePassword(options);
const entropy = analyzePasswordGenerationEntropy(options);

if ([...password].length !== 20) {
  throw new Error("Installed package returned an invalid password length.");
}

if (!(entropy.combinations > 0n) || !(entropy.bits > 0)) {
  throw new Error("Installed package returned invalid entropy metadata.");
}
`,
  );

  execFileSync(process.execPath, [smokeFile], {
    cwd: temporaryDirectory,
    stdio: "inherit",
  });
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });

  if (tarballPath !== undefined) {
    rmSync(tarballPath, { force: true });
  }
}

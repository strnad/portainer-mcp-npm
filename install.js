#!/usr/bin/env node

const { execFileSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const VERSION = "v0.6.1";
const REPO = "strnad/portainer-mcp";
const BINARY_NAME = "portainer-mcp";
const INSTALL_DIR = __dirname;

// SHA256 checksums of release tarballs
const CHECKSUMS = {
  "portainer-mcp-v0.6.1-darwin-arm64.tar.gz":
    "c649b6809ae2d7875b633423fab292ed0bafcc57a91e6f8eaf1248fbadc22cdb",
  "portainer-mcp-v0.6.1-linux-amd64.tar.gz":
    "7a9410d8782b72194dc0e29e7dc3b8f7778297c52f7808d86d18e1b6ec5532b8",
  "portainer-mcp-v0.6.1-linux-arm64.tar.gz":
    "67e885367e1cbc151fddddc8abde2c1704bfad677d72a918e9328d68793a53f7",
};

function getPlatform() {
  const platform = process.platform;
  const arch = process.arch;

  const platformMap = { linux: "linux", darwin: "darwin" };
  const archMap = { x64: "amd64", arm64: "arm64" };

  const os = platformMap[platform];
  const cpu = archMap[arch];

  if (!os || !cpu) {
    console.error(
      `Unsupported platform: ${platform}/${arch}. Supported: linux/darwin x64/arm64`,
    );
    process.exit(1);
  }

  return { os, cpu };
}

function download(url) {
  const client = url.startsWith("https") ? https : http;
  return new Promise((resolve, reject) => {
    client
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return download(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

function verifySha256(data, expected) {
  const actual = crypto.createHash("sha256").update(data).digest("hex");
  if (actual !== expected) {
    throw new Error(
      `SHA256 mismatch!\n  Expected: ${expected}\n  Got:      ${actual}\nThe downloaded file may have been tampered with.`,
    );
  }
}

async function main() {
  const { os, cpu } = getPlatform();
  const tarName = `portainer-mcp-${VERSION}-${os}-${cpu}.tar.gz`;
  const url = `https://github.com/${REPO}/releases/download/${VERSION}/${tarName}`;
  const expectedHash = CHECKSUMS[tarName];

  if (!expectedHash) {
    console.error(`No checksum found for ${tarName}`);
    process.exit(1);
  }

  const binPath = path.join(INSTALL_DIR, BINARY_NAME);

  if (fs.existsSync(binPath)) {
    console.log(`${BINARY_NAME} already exists, skipping download`);
    return;
  }

  console.log(`Downloading ${tarName}...`);

  const tarPath = path.join(INSTALL_DIR, tarName);

  try {
    const data = await download(url);

    console.log("Verifying SHA256 checksum...");
    verifySha256(data, expectedHash);
    console.log("Checksum OK");

    fs.writeFileSync(tarPath, data);
    execFileSync("tar", ["-xzf", tarPath, "-C", INSTALL_DIR]);
    fs.unlinkSync(tarPath);
    fs.chmodSync(binPath, 0o755);
    console.log(`Installed ${BINARY_NAME} to ${binPath}`);
  } catch (err) {
    console.error(`Failed to install: ${err.message}`);
    process.exit(1);
  }
}

main();

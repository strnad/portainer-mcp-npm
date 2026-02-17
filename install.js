#!/usr/bin/env node

const { execFileSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const VERSION = "v0.7.0";
const REPO = "strnad/portainer-mcp";
const BINARY_NAME = "portainer-mcp";
const INSTALL_DIR = __dirname;

// SHA256 checksums of release tarballs
const CHECKSUMS = {
  "portainer-mcp-v0.7.0-darwin-arm64.tar.gz":
    "834537ad2294ec92489fb17c6f667b8948b8a46e54a1dfef266ba4f6eb168c0b",
  "portainer-mcp-v0.7.0-linux-amd64.tar.gz":
    "06befc318f7cfa366dded143d4822e37b3307ef949f97c7fe0e9920a5a8f6201",
  "portainer-mcp-v0.7.0-linux-arm64.tar.gz":
    "e259086cf54516805a9af8e32694e781d62cfbab5139ddb0bb244c6d8dfcc5df",
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

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");

function filePath(fileName) {
  return path.join(dataDir, fileName);
}

function readJson(fileName, fallback = []) {
  try {
    const fullPath = filePath(fileName);
    if (!fs.existsSync(fullPath)) {
      return fallback;
    }

    const raw = fs.readFileSync(fullPath, "utf-8").trim();
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to read ${fileName}:`, error.message);
    return fallback;
  }
}

function writeJson(fileName, value) {
  try {
    const fullPath = filePath(fileName);
    fs.writeFileSync(fullPath, JSON.stringify(value, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error(`Failed to write ${fileName}:`, error.message);
    return false;
  }
}

module.exports = {
  readJson,
  writeJson,
};

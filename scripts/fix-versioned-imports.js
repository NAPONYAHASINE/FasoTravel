#!/usr/bin/env node
/**
 * Fix version-specific imports in Societe app
 * Usage: node fix-versioned-imports.js
 */

const fs = require('fs');
const path = require('path');

const replacements = require('./import-replacements.js');

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (!filepath.includes('node_modules')) {
        walkDir(filepath, callback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filepath);
    }
  });
}

const srcDir = path.join(__dirname, '../societe/src');
let filesModified = 0;
let totalReplacements = 0;

console.log('🔧 Fixing version-specific imports in Societe...\n');

walkDir(srcDir, (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  const originalContent = content;
  let replacementCount = 0;

  // Apply all replacements
  replacements.forEach(([oldStr, newStr]) => {
    if (content.includes(oldStr)) {
      content = content.replaceAll(oldStr, newStr);
      replacementCount++;
    }
  });

  if (content !== originalContent) {
    filesModified++;
    totalReplacements += replacementCount;
    fs.writeFileSync(filepath, content, 'utf8');
    const relPath = path.relative(srcDir, filepath);
    console.log(`  ✓ ${relPath} (+${replacementCount})`);
  }
});

console.log(`\n✅ Done! Fixed ${totalReplacements} import(s) in ${filesModified} file(s)\n`);

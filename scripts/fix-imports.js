#!/usr/bin/env node
// Fix version-specific imports in Societe app
// This removes @version from imports like: "@radix-ui/react-slot@1.1.2" -> "@radix-ui/react-slot"

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const srcDir = path.join(__dirname, '../societe/src');

// Find all TypeScript/TSX files
const files = glob.sync(`${srcDir}/**/*.{ts,tsx}`, { 
  ignore: `${srcDir}/**/node_modules/**` 
});

let filesModified = 0;
let replacementsCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // Fix version-specific imports like "@radix-ui/react-slot@1.1.2"
  content = content.replace(
    /from\s+["'](@[^"']+)@[\d.]+["']/g,
    'from "$1"'
  );
  
  // Fix version-specific imports for packages without @scope like "class-variance-authority@0.7.1"
  content = content.replace(
    /from\s+["']([a-z-]+)@[\d.]+["']/g,
    'from "$1"'
  );
  
  if (content !== originalContent) {
    filesModified++;
    const changes = (originalContent.match(/@[\d.]+["']/g) || []).length;
    replacementsCount += changes;
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ Fixed: ${path.relative(__dirname, file)} (${changes} replacements)`);
  }
});

console.log(`\nSummary: Fixed ${replacementsCount} import(s) in ${filesModified} file(s)`);

#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const versionType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('Invalid version type. Use: patch, minor, or major');
  process.exit(1);
}

const packagePath = path.join(__dirname, '../package.json');
const modulePath = path.join(__dirname, '../module.json');
const changelogPath = path.join(__dirname, '../CHANGELOG.md');

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const moduleJson = JSON.parse(fs.readFileSync(modulePath, 'utf8'));

const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

let newVersion;
switch (versionType) {
  case 'major': newVersion = `${major + 1}.0.0`; break;
  case 'minor': newVersion = `${major}.${minor + 1}.0`; break;
  case 'patch': newVersion = `${major}.${minor}.${patch + 1}`; break;
}

console.log(`Bumping version from ${currentVersion} to ${newVersion}`);

packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

moduleJson.version = newVersion;
moduleJson.download = `https://github.com/jesshmusic/dormanlakely-legendary-actions/releases/download/v${newVersion}/module.zip`;
fs.writeFileSync(modulePath, JSON.stringify(moduleJson, null, 2) + '\n');

function getGitLog(fromTag) {
  try {
    const command = fromTag
      ? `git log ${fromTag}..HEAD --pretty=format:"%s" --no-merges`
      : `git log --pretty=format:"%s" --no-merges -20`;
    return execSync(command, { encoding: 'utf8' })
      .split('\n')
      .filter(line => line.trim());
  } catch (error) {
    console.warn('Could not get git log:', error.message);
    return [];
  }
}

function getLastTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function categorizeCommits(commits) {
  const categories = { features: [], fixes: [], changes: [], other: [] };
  commits.forEach(commit => {
    const lower = commit.toLowerCase();
    if (lower.startsWith('feat:') || lower.startsWith('feature:')) {
      categories.features.push(commit.replace(/^(feat|feature):\s*/i, ''));
    } else if (lower.startsWith('fix:')) {
      categories.fixes.push(commit.replace(/^fix:\s*/i, ''));
    } else if (lower.startsWith('chore:') || lower.startsWith('refactor:') || lower.startsWith('docs:')) {
      categories.changes.push(commit.replace(/^(chore|refactor|docs):\s*/i, ''));
    } else if (!lower.startsWith('build:') && !lower.startsWith('ci:')) {
      categories.other.push(commit);
    }
  });
  return categories;
}

const lastTag = getLastTag();
const commits = getGitLog(lastTag);
const categories = categorizeCommits(commits);

let changelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';

const date = new Date().toISOString().split('T')[0];
let newEntry = `## [${newVersion}] - ${date}\n\n`;

if (categories.features.length > 0) {
  newEntry += `### Added\n`;
  categories.features.forEach(c => { newEntry += `- ${c}\n`; });
  newEntry += '\n';
}
if (categories.fixes.length > 0) {
  newEntry += `### Fixed\n`;
  categories.fixes.forEach(c => { newEntry += `- ${c}\n`; });
  newEntry += '\n';
}
if (categories.changes.length > 0) {
  newEntry += `### Changed\n`;
  categories.changes.forEach(c => { newEntry += `- ${c}\n`; });
  newEntry += '\n';
}
if (categories.other.length > 0) {
  newEntry += `### Other\n`;
  categories.other.forEach(c => { newEntry += `- ${c}\n`; });
  newEntry += '\n';
}

if (!changelog.startsWith('# Changelog')) {
  changelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n' + changelog;
}

const lines = changelog.split('\n');
const headerEndIndex = lines.findIndex((line, i) => i > 0 && line.startsWith('## '));
if (headerEndIndex > 0) {
  lines.splice(headerEndIndex, 0, newEntry);
} else {
  lines.push('\n' + newEntry);
}

fs.writeFileSync(changelogPath, lines.join('\n'));

console.log('✓ Updated package.json');
console.log('✓ Updated module.json');
console.log('✓ Updated CHANGELOG.md');
console.log(`\nNew version: ${newVersion}`);
console.log('\nNext steps:');
console.log('1. Review the changes');
console.log(`2. git add -A && git commit -m "chore: bump version to ${newVersion}"`);
console.log('3. Push and open a PR to main');

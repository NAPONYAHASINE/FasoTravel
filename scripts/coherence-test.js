#!/usr/bin/env node

/**
 * 🎯 TEST DE COHÉRENCE - Mobile & Societe
 * 
 * Vérifie que les deux apps utilisent les mêmes:
 * - Types User
 * - Fonction isDevelopment
 * - Clés localStorage
 * 
 * Run: node scripts/coherence-test.js
 */

const fs = require('fs');
const path = require('path');

const TESTS = [];
let PASSED = 0;
let FAILED = 0;

function test(name, fn) {
  try {
    fn();
    PASSED++;
    console.log(`✅ ${name}`);
    TESTS.push({ name, status: 'PASS' });
  } catch (e) {
    FAILED++;
    console.log(`❌ ${name}: ${e.message}`);
    TESTS.push({ name, status: 'FAIL', error: e.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log('\n🔍 COHERENCE TEST - Mobile & Societe\n');

// ============================================
// TEST 1: Storage Keys sont identiques
// ============================================
test('Storage keys: STORAGE_AUTH_TOKEN exists in both', () => {
  const mobileStorage = fs.readFileSync(
    path.join(__dirname, '../Mobile/src/shared/constants/storage.ts'),
    'utf8'
  );
  const societeStorage = fs.readFileSync(
    path.join(__dirname, '../societe/src/shared/constants/storage.ts'),
    'utf8'
  );

  assert(
    mobileStorage.includes("export const STORAGE_AUTH_TOKEN = 'auth_token'"),
    'Mobile missing STORAGE_AUTH_TOKEN'
  );
  assert(
    societeStorage.includes("export const STORAGE_AUTH_TOKEN = 'auth_token'"),
    'Societe missing STORAGE_AUTH_TOKEN'
  );
});

test('Storage keys: STORAGE_CURRENT_USER is auth_user in both', () => {
  const mobileStorage = fs.readFileSync(
    path.join(__dirname, '../Mobile/src/shared/constants/storage.ts'),
    'utf8'
  );
  const societeStorage = fs.readFileSync(
    path.join(__dirname, '../societe/src/shared/constants/storage.ts'),
    'utf8'
  );

  assert(
    mobileStorage.includes("export const STORAGE_CURRENT_USER = 'auth_user'"),
    'Mobile STORAGE_CURRENT_USER not auth_user'
  );
  assert(
    societeStorage.includes("export const STORAGE_CURRENT_USER = 'auth_user'"),
    'Societe STORAGE_CURRENT_USER not auth_user'
  );
});

// ============================================
// TEST 2: isDevelopment est unifié
// ============================================
test('Deployment: isDevelopment function exists in both', () => {
  const mobileDeployment = fs.readFileSync(
    path.join(__dirname, '../Mobile/src/shared/config/deployment.ts'),
    'utf8'
  );
  const societeDeployment = fs.readFileSync(
    path.join(__dirname, '../societe/src/shared/config/deployment.ts'),
    'utf8'
  );

  assert(
    mobileDeployment.includes('export const isDevelopment'),
    'Mobile missing isDevelopment'
  );
  assert(
    societeDeployment.includes('export const isDevelopment'),
    'Societe missing isDevelopment'
  );
});

test('Deployment: isLocalMode is alias for isDevelopment in both', () => {
  const mobileDeployment = fs.readFileSync(
    path.join(__dirname, '../Mobile/src/shared/config/deployment.ts'),
    'utf8'
  );
  const societeDeployment = fs.readFileSync(
    path.join(__dirname, '../societe/src/shared/config/deployment.ts'),
    'utf8'
  );

  assert(
    mobileDeployment.includes('export const isLocalMode') && mobileDeployment.includes('isDevelopment()'),
    'Mobile isLocalMode incorrect'
  );
  assert(
    societeDeployment.includes('export const isLocalMode') && societeDeployment.includes('isDevelopment()'),
    'Societe isLocalMode incorrect'
  );
});

// ============================================
// TEST 3: Common Types existent
// ============================================
test('Types: BaseUser interface exists in both', () => {
  const mobileTypes = fs.readFileSync(
    path.join(__dirname, '../Mobile/src/shared/types/common.ts'),
    'utf8'
  );
  const societeTypes = fs.readFileSync(
    path.join(__dirname, '../societe/src/shared/types/common.ts'),
    'utf8'
  );

  assert(
    mobileTypes.includes('export interface BaseUser'),
    'Mobile missing BaseUser'
  );
  assert(
    societeTypes.includes('export interface BaseUser'),
    'Societe missing BaseUser'
  );
});

test('Types: PassengerUser exists in both', () => {
  const mobileTypes = fs.readFileSync(
    path.join(__dirname, '../Mobile/src/shared/types/common.ts'),
    'utf8'
  );
  const societeTypes = fs.readFileSync(
    path.join(__dirname, '../societe/src/shared/types/common.ts'),
    'utf8'
  );

  assert(
    mobileTypes.includes('export interface PassengerUser'),
    'Mobile missing PassengerUser'
  );
  assert(
    societeTypes.includes('export interface PassengerUser'),
    'Societe missing PassengerUser'
  );
});

test('Types: OperatorUser exists in both', () => {
  const mobileTypes = fs.readFileSync(
    path.join(__dirname, '../Mobile/src/shared/types/common.ts'),
    'utf8'
  );
  const societeTypes = fs.readFileSync(
    path.join(__dirname, '../societe/src/shared/types/common.ts'),
    'utf8'
  );

  assert(
    mobileTypes.includes('export interface OperatorUser'),
    'Mobile missing OperatorUser'
  );
  assert(
    societeTypes.includes('export interface OperatorUser'),
    'Societe missing OperatorUser'
  );
});

// ============================================
// TEST 4: Auth Services utilisent les imports communs
// ============================================
test('Auth Service Mobile: uses shared imports', () => {
  const mobileAuth = fs.readFileSync(
    path.join(__dirname, '../Mobile/src/services/api/auth.service.ts'),
    'utf8'
  );

  assert(
    mobileAuth.includes("from '../../shared/config/deployment'"),
    'Mobile auth not importing shared deployment'
  );
  assert(
    mobileAuth.includes("from '../../shared/constants/storage'"),
    'Mobile auth not importing shared storage'
  );
  assert(
    mobileAuth.includes("from '../../shared/types/common'"),
    'Mobile auth not importing shared types'
  );
});

test('Auth Service Societe: uses shared imports', () => {
  const societeAuth = fs.readFileSync(
    path.join(__dirname, '../societe/src/services/api/auth.service.ts'),
    'utf8'
  );

  assert(
    societeAuth.includes("from '../../shared/constants/storage'"),
    'Societe auth not importing shared storage'
  );
  assert(
    societeAuth.includes("from '../../shared/types/common'"),
    'Societe auth not importing shared types'
  );
});

// ============================================
// RESULTS
// ============================================
console.log('\n' + '='.repeat(60));
console.log(`📊 RÉSULTATS: ${PASSED} ✅ | ${FAILED} ❌`);
console.log('='.repeat(60));

if (FAILED === 0) {
  console.log('\n🎉 TOUS LES TESTS PASSENT! Cohérence garantie!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${FAILED} tests échoués!\n`);
  process.exit(1);
}

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  clearSignInReturnPath,
  rememberSignInReturnPath,
  safeSignInReturnPath,
  signInReturnPath,
} from '../../app/javascript/lib/sign-in-return-path.js'

function browserStorage() {
  const items = new Map()
  return {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: key => items.delete(key),
  }
}

const productLocation = { pathname: '/artist/products/synth', search: '?variant=blue', hash: '#details' }
const productPath = '/artist/products/synth?variant=blue#details'
const loginLocation = { pathname: '/users/sign_in', search: '', hash: '' }

test('returns to the original purchase link from the cart dialog or a protected route', () => {
  assert.equal(signInReturnPath({ ...loginLocation, state: { from: productLocation } }, browserStorage()), productPath)
  assert.equal(signInReturnPath({ ...loginLocation, state: { from: productPath } }, browserStorage()), productPath)
})

test('keeps the last visited link through full navigation and reloading the login form', () => {
  const storage = browserStorage()
  rememberSignInReturnPath(productLocation, storage)
  rememberSignInReturnPath(loginLocation, storage)
  rememberSignInReturnPath({ pathname: '/forgot-password' }, storage)
  rememberSignInReturnPath({ pathname: '/users/sign_up' }, storage)
  assert.equal(signInReturnPath(loginLocation, storage), productPath)
})

test('uses an explicit return link ahead of the last visited page', () => {
  const storage = browserStorage()
  rememberSignInReturnPath('/store', storage)
  assert.equal(signInReturnPath({ ...loginLocation, search: `?return_to=${encodeURIComponent(productPath)}` }, storage), productPath)
  assert.equal(signInReturnPath({ ...loginLocation, state: { from: productLocation } }, storage), productPath)
})

test('rejects external destinations and authentication pages', () => {
  for (const value of [
    'https://example.com', '//example.com', '/\\example.com', '/\t/example.com',
    'javascript:alert(1)', '/users/sign_in', '/users/sign_in.json', '/users/sign_up',
    '/users/auth/google_oauth2', '/users/password/edit?token=secret', '/forgot-password',
    '/store/../users/sign_in', '', null, undefined,
  ]) {
    assert.equal(safeSignInReturnPath(value), null, String(value))
  }
})

test('falls back to home when sign-in has no origin and clears consumed links', () => {
  const storage = browserStorage()
  assert.equal(signInReturnPath(loginLocation, storage), '/')
  rememberSignInReturnPath(productLocation, storage)
  clearSignInReturnPath(storage)
  assert.equal(signInReturnPath(loginLocation, storage), '/')
})

test('keeps router redirects working when browser storage is unavailable', () => {
  const storage = {
    getItem() { throw new Error('Storage blocked') },
    setItem() { throw new Error('Storage blocked') },
    removeItem() { throw new Error('Storage blocked') },
  }
  assert.doesNotThrow(() => rememberSignInReturnPath(productLocation, storage))
  assert.doesNotThrow(() => clearSignInReturnPath(storage))
  assert.equal(signInReturnPath({ ...loginLocation, state: { from: productLocation } }, storage), productPath)
  assert.equal(signInReturnPath(loginLocation, storage), '/')
})

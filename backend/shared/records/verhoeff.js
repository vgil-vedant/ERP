'use strict';

/**
 * Verhoeff, the check-digit scheme of the 12-digit Aadhaar number.
 * Shared by the ERP (to validate a number typed into a search) and the
 * department backends (to issue and validate numbers on their forms).
 */

const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
const INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function verhoeffValid(digits) {
  let c = 0;
  const a = String(digits).split('').reverse().map(Number);
  for (let i = 0; i < a.length; i += 1) c = D[c][P[i % 8][a[i]]];
  return c === 0;
}

function verhoeffDigit(digits) {
  let c = 0;
  const a = String(digits).split('').reverse().map(Number);
  for (let i = 0; i < a.length; i += 1) c = D[c][P[(i + 1) % 8][a[i]]];
  return INV[c];
}

/** A well-formed Aadhaar number: 12 digits, not starting 0 or 1, valid check digit. */
const isAadhaar = (v) => /^[2-9]\d{11}$/.test(String(v || '')) && verhoeffValid(v);

module.exports = { verhoeffValid, verhoeffDigit, isAadhaar };

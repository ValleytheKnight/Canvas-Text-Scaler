import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findFittingFontSize } from '../src/fit-font-size.ts';

void test('returns the candidate size unchanged when there is no overflow', () => {
	const result = findFittingFontSize(24, 10, () => false);
	assert.equal(result, 24);
});

void test('returns the floor when even the minimum size overflows', () => {
	const result = findFittingFontSize(24, 10, () => true);
	assert.equal(result, 10);
});

void test('binary-searches down to a size just below the overflow threshold', () => {
	const overflowsAbove = (fontSizePx: number) => fontSizePx > 16;
	const result = findFittingFontSize(24, 10, overflowsAbove, 10);
	assert.ok(result <= 16);
	assert.ok(result > 15.9);
});

void test('never returns a size below the floor', () => {
	const overflowsAbove = (fontSizePx: number) => fontSizePx > 5;
	const result = findFittingFontSize(24, 10, overflowsAbove, 10);
	assert.equal(result, 10);
});

void test('never returns a size above the candidate', () => {
	const result = findFittingFontSize(24, 10, (fontSizePx) => fontSizePx > 30);
	assert.equal(result, 24);
});

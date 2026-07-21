import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFontSizePx } from '../src/scale.ts';
import type { CanvasCardTextScaleSettings } from '../src/types.ts';

const settings: CanvasCardTextScaleSettings = {
	enabled: true,
	baseFontPx: 16,
	baseWidth: 260,
	baseHeight: 200,
	minFontPx: 10,
	maxFontPx: 72,
	sensitivity: 1,
};

void test('computeFontSizePx returns the base font size at the base card size', () => {
	assert.equal(computeFontSizePx(260, 200, settings), 16);
});

void test('computeFontSizePx scales up when the card is larger', () => {
	const result = computeFontSizePx(520, 400, settings);
	assert.equal(result, 32);
});

void test('computeFontSizePx scales down when the card is smaller', () => {
	const lowFloor: CanvasCardTextScaleSettings = { ...settings, minFontPx: 1 };
	const result = computeFontSizePx(130, 100, lowFloor);
	assert.equal(result, 8);
});

void test('computeFontSizePx clamps to minFontPx on a tiny card', () => {
	const result = computeFontSizePx(1, 1, settings);
	assert.equal(result, settings.minFontPx);
});

void test('computeFontSizePx clamps to maxFontPx on a huge card', () => {
	const result = computeFontSizePx(5000, 5000, settings);
	assert.equal(result, settings.maxFontPx);
});

void test('computeFontSizePx falls back to baseFontPx on zero-size input', () => {
	assert.equal(computeFontSizePx(0, 0, settings), settings.baseFontPx);
});

void test('computeFontSizePx applies the sensitivity multiplier', () => {
	const doubled: CanvasCardTextScaleSettings = { ...settings, sensitivity: 2 };
	assert.equal(computeFontSizePx(260, 200, doubled), 32);
});

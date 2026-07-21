export interface CanvasCardTextScaleSettings {
	enabled: boolean;
	baseFontPx: number;
	baseWidth: number;
	baseHeight: number;
	minFontPx: number;
	maxFontPx: number;
	sensitivity: number;
}

export const DEFAULT_SETTINGS: CanvasCardTextScaleSettings = {
	enabled: true,
	baseFontPx: 16,
	baseWidth: 260,
	baseHeight: 200,
	minFontPx: 10,
	maxFontPx: 72,
	sensitivity: 1,
};

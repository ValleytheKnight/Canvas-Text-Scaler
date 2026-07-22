export interface CanvasTextScalerSettings {
	enabled: boolean;
	baseFontPx: number;
	baseWidth: number;
	baseHeight: number;
	minFontPx: number;
	maxFontPx: number;
	sensitivity: number;
	respectExternalFontSize: boolean;
	shrinkToFit: boolean;
}

export const DEFAULT_SETTINGS: CanvasTextScalerSettings = {
	enabled: true,
	baseFontPx: 16,
	baseWidth: 260,
	baseHeight: 200,
	minFontPx: 10,
	maxFontPx: 72,
	sensitivity: 1,
	respectExternalFontSize: false,
	shrinkToFit: true,
};

import type { CanvasTextScalerSettings } from './types.ts';

export function computeFontSizePx(width: number, height: number, settings: CanvasTextScalerSettings): number {
	if (width <= 0 || height <= 0 || settings.baseWidth <= 0 || settings.baseHeight <= 0) {
		return settings.baseFontPx;
	}
	const areaRatio = (width * height) / (settings.baseWidth * settings.baseHeight);
	const raw = settings.baseFontPx * Math.sqrt(areaRatio) * settings.sensitivity;
	return Math.min(settings.maxFontPx, Math.max(settings.minFontPx, raw));
}

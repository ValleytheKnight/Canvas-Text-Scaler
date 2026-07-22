/**
 * Proportional scaling alone can never resolve overflow: font size and box
 * size grow at the same rate, so the number of lines that fit never
 * changes no matter how big the card gets. This binary-searches downward
 * from the proportionally-computed size to the largest size that doesn't
 * overflow, per the caller's own overflow check, so enlarging a card can
 * actually fit more text. Cards that already fit are untouched: the first
 * check returns immediately, so normal scaling continues exactly as
 * before once there's no overflow to correct.
 */
export function findFittingFontSize(
	candidateFontSizePx: number,
	minFontSizePx: number,
	overflows: (fontSizePx: number) => boolean,
	iterations = 6,
): number {
	if (!overflows(candidateFontSizePx)) return candidateFontSizePx;
	if (overflows(minFontSizePx)) return minFontSizePx;

	let lo = minFontSizePx;
	let hi = candidateFontSizePx;
	for (let i = 0; i < iterations; i++) {
		const mid = (lo + hi) / 2;
		if (overflows(mid)) {
			hi = mid;
		} else {
			lo = mid;
		}
	}
	return lo;
}

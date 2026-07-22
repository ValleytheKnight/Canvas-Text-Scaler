const TEXT_CONTAINER_SELECTOR = '.markdown-preview-view, .markdown-embed-content';

export function findTextContainer(canvasNodeEl: Element): Element | null {
	return canvasNodeEl.querySelector(TEXT_CONTAINER_SELECTOR);
}

export function applyFontSizePx(canvasNodeEl: Element, fontSizePx: number): void {
	const container = findTextContainer(canvasNodeEl);
	if (!container) return;
	const value = `${fontSizePx}px`;
	(container as HTMLElement).style.setProperty('font-size', value, 'important');
	container.querySelectorAll('*').forEach((el) => {
		(el as HTMLElement).style.setProperty('font-size', value, 'important');
	});
}

export function getNaturalFontSizePx(canvasNodeEl: Element): number | null {
	const container = findTextContainer(canvasNodeEl);
	if (!container) return null;
	const parsed = Number.parseFloat(getComputedStyle(container).fontSize);
	return Number.isFinite(parsed) ? parsed : null;
}

const OVERFLOW_TOLERANCE_PX = 1;

/**
 * findTextContainer's combined selector matches the first element in
 * document order, which for a file/embed-style card is the outer
 * .markdown-embed-content wrapper, not the nested .markdown-preview-view
 * that's actually clipped and scrollable. Font-size application doesn't
 * care (it cascades to every descendant via querySelectorAll('*')), but
 * overflow detection does: the outer wrapper is sized to fill the card, so
 * its own scrollHeight never exceeds it. Look for the nested preview view
 * specifically first, and only fall back to the general container when
 * there isn't one (a plain text-type card with no embed wrapper at all).
 */
function findScrollableElement(canvasNodeEl: Element): Element | null {
	return canvasNodeEl.querySelector('.markdown-preview-view') ?? findTextContainer(canvasNodeEl);
}

/**
 * Compares the actually-clipped element's natural (unclamped) content
 * height against the card's own known height, already known precisely
 * from the ResizeObserver.
 */
export function overflowsVertically(canvasNodeEl: Element, cardHeightPx: number): boolean {
	const scrollable = findScrollableElement(canvasNodeEl);
	if (!scrollable) return false;
	return scrollable.scrollHeight > cardHeightPx + OVERFLOW_TOLERANCE_PX;
}

export function clearFontSize(canvasNodeEl: Element): void {
	const container = findTextContainer(canvasNodeEl);
	if (!container) return;
	(container as HTMLElement).style.removeProperty('font-size');
	container.querySelectorAll('*').forEach((el) => {
		(el as HTMLElement).style.removeProperty('font-size');
	});
}

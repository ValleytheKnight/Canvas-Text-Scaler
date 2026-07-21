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

export function clearFontSize(canvasNodeEl: Element): void {
	const container = findTextContainer(canvasNodeEl);
	if (!container) return;
	(container as HTMLElement).style.removeProperty('font-size');
	container.querySelectorAll('*').forEach((el) => {
		(el as HTMLElement).style.removeProperty('font-size');
	});
}

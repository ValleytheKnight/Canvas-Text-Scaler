import { Plugin, PluginSettingTab, Setting, App } from 'obsidian';
import { computeFontSizePx } from './scale.ts';
import { applyFontSizePx, clearFontSize, getNaturalFontSizePx, overflowsVertically } from './apply-font-size.ts';
import { findFittingFontSize } from './fit-font-size.ts';
import { DEFAULT_SETTINGS, type CanvasTextScalerSettings } from './types.ts';

const CANVAS_NODE_SELECTOR = '.canvas-node';
const EXTERNAL_OVERRIDE_TOLERANCE_PX = 0.5;

export default class CanvasTextScalerPlugin extends Plugin {
	settings: CanvasTextScalerSettings = DEFAULT_SETTINGS;
	private resizeObservers = new WeakMap<Element, ResizeObserver>();
	private naturalFontSizes = new WeakMap<Element, number | null>();
	private mutationObserver: MutationObserver | null = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new CanvasTextScalerSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			this.scanForCanvasNodes(document.body);
			this.startWatchingForNewNodes();
		});
	}

	onunload() {
		this.mutationObserver?.disconnect();
		this.mutationObserver = null;
		document.querySelectorAll(CANVAS_NODE_SELECTOR).forEach((node) => {
			this.resizeObservers.get(node)?.disconnect();
			clearFontSize(node);
		});
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<CanvasTextScalerSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private startWatchingForNewNodes() {
		this.mutationObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				mutation.addedNodes.forEach((added) => {
					if (!added.instanceOf(Element)) return;
					this.scanForCanvasNodes(added);
				});
				mutation.removedNodes.forEach((removed) => {
					if (!removed.instanceOf(Element)) return;
					this.stopWatchingRemoved(removed);
				});
			}
		});
		this.mutationObserver.observe(document.body, { childList: true, subtree: true });
	}

	private scanForCanvasNodes(root: Element) {
		if (root.matches?.(CANVAS_NODE_SELECTOR)) {
			this.attachToNode(root);
		}
		root.querySelectorAll?.(CANVAS_NODE_SELECTOR).forEach((node) => this.attachToNode(node));
	}

	private stopWatchingRemoved(root: Element) {
		if (root.matches?.(CANVAS_NODE_SELECTOR)) {
			this.resizeObservers.get(root)?.disconnect();
			this.resizeObservers.delete(root);
		}
		root.querySelectorAll?.(CANVAS_NODE_SELECTOR).forEach((node) => {
			this.resizeObservers.get(node)?.disconnect();
			this.resizeObservers.delete(node);
		});
	}

	private attachToNode(node: Element) {
		if (this.resizeObservers.has(node)) return;
		this.naturalFontSizes.set(node, getNaturalFontSizePx(node));
		const observer = new ResizeObserver((entries) => {
			if (!this.settings.enabled) return;
			if (this.settings.respectExternalFontSize && this.hasExternalFontSizeOverride(node)) {
				clearFontSize(node);
				return;
			}
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				const fontSizePx = computeFontSizePx(width, height, this.settings);
				applyFontSizePx(node, fontSizePx);

				if (this.settings.shrinkToFit && overflowsVertically(node, height)) {
					const fitted = findFittingFontSize(fontSizePx, this.settings.minFontPx, (candidatePx) => {
						applyFontSizePx(node, candidatePx);
						return overflowsVertically(node, height);
					});
					applyFontSizePx(node, fitted);
				}
			}
		});
		observer.observe(node);
		this.resizeObservers.set(node, observer);
	}

	private hasExternalFontSizeOverride(node: Element): boolean {
		const natural = this.naturalFontSizes.get(node) ?? null;
		if (natural === null) return false;
		return Math.abs(natural - this.settings.baseFontPx) > EXTERNAL_OVERRIDE_TOLERANCE_PX;
	}
}

class CanvasTextScalerSettingTab extends PluginSettingTab {
	plugin: CanvasTextScalerPlugin;

	constructor(app: App, plugin: CanvasTextScalerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('p', {
			text: 'Canvas card text grows and shrinks with the card as you resize it, instead of staying fixed.',
		});

		new Setting(containerEl).setName('Enabled').addToggle((toggle) =>
			toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
				this.plugin.settings.enabled = value;
				await this.plugin.saveSettings();
			}),
		);

		new Setting(containerEl)
			.setName('Base font size (px)')
			.setDesc('The font size a card renders at when it matches the base width/height below.')
			.addText((text) =>
				text.setValue(String(this.plugin.settings.baseFontPx)).onChange(async (value) => {
					const parsed = Number(value);
					if (Number.isFinite(parsed) && parsed > 0) {
						this.plugin.settings.baseFontPx = parsed;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Base width (px)')
			.setDesc('Reference card width the base font size is calibrated against.')
			.addText((text) =>
				text.setValue(String(this.plugin.settings.baseWidth)).onChange(async (value) => {
					const parsed = Number(value);
					if (Number.isFinite(parsed) && parsed > 0) {
						this.plugin.settings.baseWidth = parsed;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Base height (px)')
			.setDesc('Reference card height the base font size is calibrated against.')
			.addText((text) =>
				text.setValue(String(this.plugin.settings.baseHeight)).onChange(async (value) => {
					const parsed = Number(value);
					if (Number.isFinite(parsed) && parsed > 0) {
						this.plugin.settings.baseHeight = parsed;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Minimum font size (px)')
			.addText((text) =>
				text.setValue(String(this.plugin.settings.minFontPx)).onChange(async (value) => {
					const parsed = Number(value);
					if (Number.isFinite(parsed) && parsed > 0) {
						this.plugin.settings.minFontPx = parsed;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Maximum font size (px)')
			.addText((text) =>
				text.setValue(String(this.plugin.settings.maxFontPx)).onChange(async (value) => {
					const parsed = Number(value);
					if (Number.isFinite(parsed) && parsed > 0) {
						this.plugin.settings.maxFontPx = parsed;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Sensitivity')
			.setDesc('Multiplier on the computed scale. 1 = proportional to area, higher exaggerates the effect.')
			.addText((text) =>
				text.setValue(String(this.plugin.settings.sensitivity)).onChange(async (value) => {
					const parsed = Number(value);
					if (Number.isFinite(parsed) && parsed > 0) {
						this.plugin.settings.sensitivity = parsed;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Respect existing font-size CSS')
			.setDesc(
				'If a theme or snippet already sets a custom font-size on canvas card text, leave that card alone instead of overriding it.',
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.respectExternalFontSize).onChange(async (value) => {
					this.plugin.settings.respectExternalFontSize = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Shrink to fit')
			.setDesc(
				'If text still overflows and scrolls after scaling, shrink it further instead, down to the minimum font size. Only affects cards that would otherwise overflow, everything else scales exactly as before.',
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.shrinkToFit).onChange(async (value) => {
					this.plugin.settings.shrinkToFit = value;
					await this.plugin.saveSettings();
				}),
			);
	}
}

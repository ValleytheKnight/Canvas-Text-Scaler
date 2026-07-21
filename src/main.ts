import { Plugin, PluginSettingTab, Setting, App } from 'obsidian';
import { computeFontSizePx } from './scale.ts';
import { applyFontSizePx, clearFontSize } from './apply-font-size.ts';
import { DEFAULT_SETTINGS, type CanvasCardTextScaleSettings } from './types.ts';

const CANVAS_NODE_SELECTOR = '.canvas-node';

export default class CanvasCardTextScalePlugin extends Plugin {
	settings: CanvasCardTextScaleSettings = DEFAULT_SETTINGS;
	private resizeObservers = new WeakMap<Element, ResizeObserver>();
	private mutationObserver: MutationObserver | null = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new CanvasCardTextScaleSettingTab(this.app, this));

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
		const data = (await this.loadData()) as Partial<CanvasCardTextScaleSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private startWatchingForNewNodes() {
		this.mutationObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				mutation.addedNodes.forEach((added) => {
					if (!(added instanceof Element)) return;
					this.scanForCanvasNodes(added);
				});
				mutation.removedNodes.forEach((removed) => {
					if (!(removed instanceof Element)) return;
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
		const observer = new ResizeObserver((entries) => {
			if (!this.settings.enabled) return;
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				const fontSizePx = computeFontSizePx(width, height, this.settings);
				applyFontSizePx(node, fontSizePx);
			}
		});
		observer.observe(node);
		this.resizeObservers.set(node, observer);
	}
}

class CanvasCardTextScaleSettingTab extends PluginSettingTab {
	plugin: CanvasCardTextScalePlugin;

	constructor(app: App, plugin: CanvasCardTextScalePlugin) {
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
	}
}

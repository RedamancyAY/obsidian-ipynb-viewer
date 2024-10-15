import { App, Editor, MarkdownView, Menu, MenuItem, Modal, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFolder, WorkspaceLeaf } from 'obsidian';


import { JupyterAbstractPath } from "./utils/jupyter-path";
import { EmbeddedJupyterView } from './utils/ipynb-view';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class IpynbViewer extends Plugin {
	settings: MyPluginSettings;

	private onFileContextMenu = this.onFileContextMenuOpened.bind(this);


	async onload() {
		await this.loadSettings();
		this.app.workspace.on('file-menu', this.onFileContextMenu);


		this.registerView("my-jupyter-view", (leaf) => new EmbeddedJupyterView(leaf, this));
		this.registerExtensions(["ipynb"], "my-jupyter-view");
		this.addCommand({
			id: "jupyter-create-notebook",
			name: "Create new Jupyter notebook",
			callback: (async () => {
				await this.createJupyterNotebook(JupyterAbstractPath.fromRelative("/", true, this.app.vault));
			}).bind(this)
		});
	}

	onunload() {
		this.app.workspace.off('file-menu', this.onFileContextMenu);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	private getDefaultNotebookFilename(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		const seconds = String(now.getSeconds()).padStart(2, '0');
		return `Jupyter Notebook ${year}-${month}-${day}-${hours}-${minutes}-${seconds}.ipynb`;
	}
	private async createJupyterNotebook(folder: JupyterAbstractPath) {
		// Check that the notebook is being created inside of the Obsidian vault
		if (!folder.inVault()) {
			throw new Error("Creating a new notebook can only be done within the vault.");
		}

		// Append the filename to the folder name
		const file = folder.append(this.getDefaultNotebookFilename(), false);

		// Check that the file does not already exist to avoid overwriting it
		if (await this.app.vault.adapter.exists(file.getRelativePath() as string)) {
			new Notice(`The file "${file.getRelativePath() as string}" already exists, creation was aborted to avoid overwriting it. Please try again.`);
		}

		// Create a Jupyter notebook with the minimum amount of content
		await this.app.vault.adapter.write(
			file.getRelativePath() as string,
			`{"cells": [],"metadata": {"kernelspec": {"display_name": "","name": ""},"language_info": {"name": ""}},"nbformat": 4,"nbformat_minor": 5}`
		);

		const leaf = this.app.workspace.getLeaf('tab');
		leaf.openFile(this.app.vault.getFileByPath(file.getRelativePath() as string) as TFile);
	}
	public onFileContextMenuOpened(menu: Menu, file: TAbstractFile, _source: string, _leaf?: WorkspaceLeaf) {
		// Only propose to create a Jupyter Notebook in folders
		if (file instanceof TFolder) {
			menu.addItem((item: MenuItem) => {
				item
					.setTitle("New Jupyter notebook")
					.setIcon("jupyter-logo")
					.setSection("action-primary")
					.onClick(async (_event: MouseEvent | KeyboardEvent) => {
						await this.createJupyterNotebook(JupyterAbstractPath.fromRelative(file.path, true, this.app.vault));
					});
			});
		}
	}
}



import { ButtonComponent, FileView, ItemView, TFile, WorkspaceLeaf, sanitizeHTMLToDom } from "obsidian";
import IpynbViewer  from "../main";
import { exec, execSync } from "child_process";
import { join } from "path";
import { parse } from 'node-html-parser';
import { promises as fs } from 'fs';


export const JUPYTER_VIEW_TYPE = "my-jupyter-view";

export class EmbeddedJupyterView extends FileView {

	private openedFile: TFile | null = null;

	private messageContainerEl: HTMLElement | null = null;
	private messageHeaderEl: HTMLElement | null = null;
	private messageTextEl: HTMLElement | null = null;
	private webviewEl: HTMLElement | null = null;
	cacheFilePath: any;
	htmlParser: any;
	mainView: HTMLElement;

	cur_path: any;


	constructor(leaf: WorkspaceLeaf, private readonly plugin: IpynbViewer) {
		super(leaf);
	}

	getViewType(): string {
		return JUPYTER_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.openedFile?.name ?? "New Jupyter tab";
	}

	getIcon(): string {
		return "none";
	}

	private displayMessage(header: string, text: string, button: null = null): void {

		// Clear the content of the view, only display the message
		this.contentEl.empty();

		this.messageContainerEl = this.contentEl.createDiv();
		this.messageContainerEl.addClass("jupyter-message-container");
		this.messageHeaderEl = this.messageContainerEl.createEl("h2");
		this.messageHeaderEl.addClass("jupyter-message-header");
		this.messageHeaderEl.setText(header);
		this.messageTextEl = this.messageContainerEl.createEl("p");
		this.messageTextEl.addClass("jupyter-message-text");
		this.messageTextEl.setText(text);

	}

	async onLoadFile(file: TFile) {

		this.openedFile = file;
		// Make sure the file is a Jupyter Notebook (.ipynb)
		if (file.extension === "ipynb") {
			const filePath = this.app.vault.adapter.basePath + '/' + file.path;
			console.log(filePath)

			try {
				const htmlContent = await this.convertIpynbToHTML(filePath, file);

				// Use the HTML content in your Obsidian view

				let viewContainer = this.containerEl.children[1];
				const content = viewContainer.createDiv();
				// viewContainer.empty();
				let root = parse(htmlContent);
				content.innerHTML = root.toString();
				// viewContainer.outerHTML = htmlContent.outerHTML;
			} catch (error) {
				console.error("Error displaying HTML content in view", error);
			}
		}
	}



	protected async onOpen() {
	}

	protected async onClose() {

	}

	async convertIpynbToHTML(ipynbPath: string, file: TFile): Promise<string> {

		const cacheFolder = this.app.vault.adapter.basePath + "/.obsidian/cache/";

		console.log(file)
		// Cache file path where the HTML will be saved
		this.cacheFilePath = join(cacheFolder, `${file.basename}.html`);
		console.log(this.cacheFilePath)
		const read_html_path = "/.obsidian/cache/" + file.basename + ".html";
		console.log(read_html_path)

		try {
			// Run nbconvert to convert the notebook to HTML
			await execSync(`/Users/ay/SoftwareData/anaconda/anaconda3/envs/torch/bin/python -m jupyter nbconvert --to html "${ipynbPath}" --output "${this.cacheFilePath}" --template lab`);
			let htmlContent = await this.app.vault.adapter.read(read_html_path);
			return htmlContent
		} catch (error) {
			console.error(`Failed to convert notebook: ${error}`);
			throw error;
		}
	}
}

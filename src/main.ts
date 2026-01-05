import {
  App,
  Editor,
  FuzzySuggestModal,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  Setting,
  TFile,
  TFolder,
} from "obsidian";

import { SettingTab, RandomPickerPluginSettings, DEFAULT_SETTINGS } from "./settings";
import { RandomSource, RandomPickTemplate } from "./template";

export default class RandomPickerPlugin extends Plugin {
  settings: RandomPickerPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "insert-random-pick",
      name: "Insert random pick",
      editorCheckCallback: (
        checking: boolean,
        editor: Editor,
        _view: MarkdownView
      ) => {
        const markdownView =
          this.app.workspace.getActiveViewOfType(MarkdownView);

        if (markdownView) {
          if (!checking) {
            new RandomSourceSelectorModal(
              this.app,
              this.settings.templates,
              (template) =>
                this.insertRandomPickFromSource(
                  editor,
                  template
                )
            ).open();
          }

          return true;
        }

        return false;
      },
    });

    this.addCommand({
      id: "insert-random-pick-with-preview",
      name: "Insert random pick with preview",
      editorCheckCallback: (
        checking: boolean,
        editor: Editor,
        _view: MarkdownView
      ) => {
        const markdownView =
          this.app.workspace.getActiveViewOfType(MarkdownView);

        if (markdownView) {
          if (!checking) {
            new RandomSourceSelectorModal(
              this.app,
              this.settings.templates,
              (template) =>
                this.showPreviewModal(editor, template)
            ).open();
          }

          return true;
        }

        return false;
      },
    });

    this.addSettingTab(new SettingTab(this.app, this));
  }

  onunload() { }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.settings.templates = this.settings.templates.map(
      (t) => new RandomPickTemplate(t.name, t.template)
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  editorInsertText(editor: Editor, text: string) {
    editor.replaceRange(text, editor.getCursor());

    // Move cursor to the end of the inserted text
    const newCursorPosition =
      editor.posToOffset(editor.getCursor()) + text.length;
    editor.setCursor(editor.offsetToPos(newCursorPosition));
  }

  innerGetRandomSources(parent: TFolder, sources: Map<string, RandomSource>, parentName: string = "") {
    parent.children.forEach((file) => {
      let sourceName = file.name;

      if (file instanceof TFile) {
        sourceName = file.basename;
      }

      sources.set(`${parentName}${sourceName}`, new RandomSource(this.app, file));

      if (file instanceof TFolder) {
        this.innerGetRandomSources(file, sources, `${parentName}${sourceName}/`);
      }
    })
  }

  getRandomSources(): Map<string, RandomSource> {
    const randomSources: Map<string, RandomSource> = new Map();
    const randomNotesFolder = this.app.vault.getFolderByPath(this.settings.dataFolder);

    if (!randomNotesFolder) {
      new Notice(`Random Picker: Lists folder not found at path "${this.settings.dataFolder}"`);
      return randomSources;
    }

    this.innerGetRandomSources(randomNotesFolder, randomSources);
    console.debug("Random Picker: Loaded random sources:", randomSources);
    return randomSources;
  }

  showPreviewModal(editor: Editor, template: RandomPickTemplate) {
    new RandomPickPreviewModal(
      this.app,
      template,
      this.getRandomSources(),
      (text) => this.editorInsertText(editor, text)
    ).open();
  }

  insertRandomPickFromSource(editor: Editor, template: RandomPickTemplate) {
    template
      .generate(this.getRandomSources())
      .then((value) => this.editorInsertText(editor, value), () => { });
  }
}

class RandomPickPreviewModal extends Modal {
  template: RandomPickTemplate;
  sources: Map<string, RandomSource>;
  onSubmit: (result: string) => void;

  constructor(
    app: App,
    template: RandomPickTemplate,
    sources: Map<string, RandomSource>,
    onSubmit: (result: string) => void
  ) {
    super(app);
    this.template = template;
    this.sources = sources;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h1", {
      text: `Random Pick - ${this.template.name}`,
    });

    const previewEl = contentEl.createEl("textarea", {
      attr: {
        readonly: 'true',
      },
      cls: 'error-text'
    });
    previewEl.setCssProps({
      width: '100%',
      height: '150px',
      resize: 'vertical'
    });

    this.template
      .generate(this.sources)
      .then((text) => previewEl.setText(text), () => { });

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText("Regenerate").onClick(() => {
          this.template
            .generate(this.sources)
            .then((text) => previewEl.setText(text), () => { });
        })
      )
      .addButton((btn) =>
        btn
          .setButtonText("Insert")
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(previewEl.getText());
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class RandomSourceSelectorModal extends FuzzySuggestModal<RandomPickTemplate> {
  callback: (item: RandomPickTemplate) => void;
  templates: RandomPickTemplate[];
  randomLists: Map<string, string[]>;

  constructor(
    app: App,
    templates: RandomPickTemplate[],
    callback: (item: RandomPickTemplate) => void
  ) {
    super(app);
    this.callback = callback;
    this.templates = templates;
  }

  getItems(): RandomPickTemplate[] {
    return this.templates;
  }

  getItemText(item: RandomPickTemplate): string {
    return item.name;
  }

  onChooseItem(
    item: RandomPickTemplate,
    _evt: MouseEvent | KeyboardEvent
  ): void {
    this.callback(item);
  }
}



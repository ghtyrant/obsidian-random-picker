import {
  App,
  PluginSettingTab,
  Setting,
  TFolder,
  AbstractInputSuggest,
} from "obsidian";

import RandomPickerPlugin from "./main";
import { RandomPickTemplate } from "./template";

function fitTextAreaToContent(textArea: HTMLTextAreaElement): void {
  textArea.style.height = "";
  textArea.style.height = textArea.scrollHeight + "px";
}

export interface RandomPickerPluginSettings {
  dataFolder: string;
  templates: RandomPickTemplate[];
}

export const DEFAULT_SETTINGS: RandomPickerPluginSettings = {
  dataFolder: "Random",
  templates: [],
};

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
  constructor(public app: App, public inputEl: HTMLInputElement) {
    super(app, inputEl);
  }

  getSuggestions(inputStr: string): TFolder[] {
    const abstractFiles = this.app.vault.getAllLoadedFiles();
    const folders: TFolder[] = [];
    const lowerCaseInputStr = inputStr.toLowerCase();

    abstractFiles.forEach(folder => {
      if (
        folder instanceof TFolder &&
        folder.path.toLowerCase().contains(lowerCaseInputStr)
      ) {
        folders.push(folder);
      }
    });

    return folders;
  }

  renderSuggestion(file: TFolder, el: HTMLElement): void {
    el.setText(file.path);
  }

  selectSuggestion(value: TFolder, ev: MouseEvent | KeyboardEvent): void {
    this.setValue(value.path);
    this.inputEl.trigger("input");
    this.close();
  }
}

export class SettingTab extends PluginSettingTab {
  plugin: RandomPickerPlugin;
  templatesEl: HTMLElement;

  constructor(app: App, plugin: RandomPickerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  displayTemplate(template: RandomPickTemplate): void {
    this.templatesEl.createEl("small", { text: "Name" });
    const nameSetting = new Setting(this.templatesEl)
      .setClass("random-picker-template-setting")
      .addText((text) => {
        text.setValue(template.name).onChange(async (value) => {
          template.name = value;
          await this.plugin.saveSettings();
        });
        text.setPlaceholder("Unique name");

        text.inputEl.addClass("random-picker-full");
      });

    nameSetting.infoEl.remove();

    this.templatesEl.createEl("small", { text: "Template" });
    const templateSetting = new Setting(this.templatesEl)
      .setClass("random-picker-template-setting")
      .addTextArea(text => {
        text.setValue(template.template).onChange(async (value) => {
          // Automatically resize the textarea to fit its content when changed
          fitTextAreaToContent(text.inputEl);
          template.template = value;
          await this.plugin.saveSettings();
        });


        text.setPlaceholder(
          "e.g. Random Name ${Names} ${Surenames}"
        );
        text.inputEl.addClass("random-picker-full");

        fitTextAreaToContent(text.inputEl);
      });

    templateSetting.infoEl.remove();

    const deleteButton = new Setting(this.templatesEl)
      .setClass("random-picker-template-setting")
      .addButton((btn) =>
        btn
          .setButtonText("Delete")
          .setWarning()
          .onClick(() => {
            this.plugin.settings.templates.remove(template);
            this.templatesEl.empty();
            this.displayTemplates();
          })
      );

    deleteButton.infoEl.remove();

    this.templatesEl.createEl("hr", {
      cls: "random-picker-template-separator",
    });

  }

  displayTemplates(): void {
    this.plugin.settings.templates.forEach((template) => {
      this.displayTemplate(template);
    });
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setHeading()
      .setName("Data folder")
      .setDesc(
        "The folder containing your data files for random selection."
      )
      .addSearch(cb => {
        cb.setValue(this.plugin.settings.dataFolder)
          .setPlaceholder("e.g. My Folder/Subfolder")
          .onChange(async (value) => {
            // Make sure the folder name does not end with a slash
            if (value.endsWith("/")) {
              value = value.slice(0, -1);
            }

            this.plugin.settings.dataFolder = value;
            await this.plugin.saveSettings();
          });

        new FolderSuggest(this.plugin.app, cb.inputEl);
      });

    // Templates List
    new Setting(containerEl).setName("Templates").setHeading();
    const longDoc = document.createDocumentFragment();
    longDoc.createDiv({
      text: "Create templates for generating random texts.",
    });
    longDoc.createDiv({
      text: "Use ${Filename} to insert a random line from that file. You can use the same file more than once.",
    });
    longDoc.createDiv({
      text: "e.g.: \"Random Name ${Names} ${Surenames}\" will pick a random line from the 'Names' file and another from the 'Surenames' file in your data folder.",
    });
    new Setting(containerEl)
      .setDesc(longDoc)
      .setClass("random-picker-template-setting");
    new Setting(containerEl).addButton((btn) =>
      btn
        .setButtonText("Add new template")
        .setCta()
        .onClick(() => {
          this.plugin.settings.templates.push(
            new RandomPickTemplate("", "")
          );
          this.templatesEl.empty();
          this.displayTemplates();
        })
    );

    this.templatesEl = containerEl.createDiv();
    this.displayTemplates();
  }
}

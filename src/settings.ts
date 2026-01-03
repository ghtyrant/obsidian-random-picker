import {
  App,
  PluginSettingTab,
  Setting,
  TFile,
} from "obsidian";

import RandomPickerPlugin from "./main";
import { RandomPickTemplate } from "./template";

export interface RandomPickerPluginSettings {
  listsFolder: string;
  templates: RandomPickTemplate[];
}

export const DEFAULT_SETTINGS: RandomPickerPluginSettings = {
  listsFolder: "Random/",
  templates: [],
};

export class SettingTab extends PluginSettingTab {
  plugin: RandomPickerPlugin;
  warnText: HTMLElement;
  templatesEl: HTMLElement;

  constructor(app: App, plugin: RandomPickerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  updateWarnText(value: string) {
    const folder = this.app.vault.getAbstractFileByPath(value);
    let message = "";

    if (folder == null) {
      message = "Folder does not exist!";
    }

    if (folder instanceof TFile) {
      message = "Please specify a path to a folder!";
    }

    this.warnText.setText(message);
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
        text.setPlaceholder("Unique Name");

        text.inputEl.addClass("random-picker-full");
      });

    nameSetting.infoEl.remove();

    this.templatesEl.createEl("small", { text: "Template" });
    const templateSetting = new Setting(this.templatesEl)
      .setClass("random-picker-template-setting")
      .addTextArea((text) => {
        text.setValue(template.template).onChange(async (value) => {
          template.template = value;
          await this.plugin.saveSettings();
        });
        text.setPlaceholder(
          "e.g. Random Name ${Names} ${Surenames}"
        );
        text.inputEl.addClass("random-picker-full");
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

    containerEl.createEl("h1", { text: "Random Picker Settings" });
    new Setting(containerEl)
      .setHeading()
      .setName("Data Folder")
      .setDesc(
        "The plugin will read all files in the folder and allows you to choose from which one to pick a random line."
      )
      .addSearch((cb) => {
        cb.setValue(this.plugin.settings.listsFolder)
          .setPlaceholder("e.g. My Folder/Subfolder")
          .onChange(async (value) => {
            // Make sure the folder name does not end with a slash
            if (value.endsWith("/")) {
              value = value.slice(0, -1);
            }

            this.updateWarnText(value);
            this.plugin.settings.listsFolder = value;
            await this.plugin.saveSettings();
          });
      });

    this.warnText = containerEl.createEl("small", {
      text: "",
      cls: "random-picker-warn",
    });

    this.updateWarnText(this.plugin.settings.listsFolder);

    // Templates List
    containerEl.createEl("h2", { text: "Templates" });
    const longDoc = document.createDocumentFragment();
    longDoc.createDiv({
      text: "Create templates for generating random texts.",
    });
    longDoc.createDiv({
      text: "Use ${Filename} to insert a random line from that file. You can use the same file more than once.",
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

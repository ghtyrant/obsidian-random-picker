import {
  App,
  Notice,
  TFile,
  TFolder,
  TAbstractFile
} from "obsidian";

export class RandomSource {
  file: TAbstractFile;
  app: App;

  constructor(app: App, file: TAbstractFile) {
    this.app = app;
    this.file = file;
  }

  name(): string {
    return this.file.name;
  }

  async getRandomPickFromFile(file: TFile): Promise<string> {
    return this.app.vault.cachedRead(file).then((text) => {
      const items = text.split("\n").filter((l) => l.trim().length > 0);
      const item = items[Math.floor(Math.random() * items.length)]?.trim();
      return item ?? "";
    });
  }


  async getRandomPick(): Promise<string> {
    if (this.file instanceof TFile) {
      return this.getRandomPickFromFile(this.file);
    } else if (this.file instanceof TFolder) {
      const files = this.file.children.filter((f) => f instanceof TFile) as TFile[];

      if (files.length === 0) {
        return "";
      }

      const randomFile =
        files[Math.floor(Math.random() * files.length)];

      return this.getRandomPickFromFile(randomFile!);
    } else {
      throw new Error("RandomSource must be a TFile or TFolder");
    }
  }
}

export class RandomPickTemplate {
  name: string;
  template: string;

  constructor(name: string, template: string) {
    this.name = name;
    this.template = template;
  }

  async generate(sources: Map<string, RandomSource>): Promise<string> {
    let output = "";
    let variableEnd = -1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const nextVariable = this.template.indexOf("${", variableEnd);

      // No more variables found
      if (nextVariable == -1) {
        output += this.template.slice(variableEnd + 1);
        break;
      }

      output += this.template.slice(variableEnd + 1, nextVariable);

      variableEnd = this.template.indexOf("}", nextVariable);

      if (variableEnd == -1) {
        new Notice(
          `[Random Picker] Error: Malformed template '${this.name}'!`
        );
        break;
      }

      const varName = this.template.slice(nextVariable + 2, variableEnd);

      if (sources.has(varName)) {
        output += await sources.get(varName)?.getRandomPick();
      } else {
        new Notice(
          `[Random Picker] Error in '${this.name}': ${varName} not found!`
        );
      }
    }

    return output;
  }
}



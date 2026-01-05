import {
  App,
  Notice,
  TFile,
  TFolder,
  TAbstractFile
} from "obsidian";

function getSourceBaseName(sourceName: string): string {
  const parts = sourceName.split("/");
  return parts[0]!;
}

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

  root(): string {
    return this.file.path;
  }

  async getRandomPickFromFile(file: TFile, used: string[]): Promise<string> {
    return this.app.vault.cachedRead(file).then((text) => {
      // Remove all empty and ignored lines
      const items = text.split("\n").filter((l) => l.trim().length > 0 && !used.includes(l.trim()));

      if (items.length === 0) {
        return "";
      }

      const randomLineIndex = Math.floor(Math.random() * items.length);
      const item = items[randomLineIndex]?.trim();
      return item ?? "";
    });
  }


  async getRandomPick(used: string[]): Promise<string> {
    if (this.file instanceof TFile) {
      return this.getRandomPickFromFile(this.file, used);
    } else if (this.file instanceof TFolder) {
      const files = this.file.children.filter((f) => f instanceof TFile);

      if (files.length === 0) {
        return "";
      }

      const randomFile =
        files[Math.floor(Math.random() * files.length)];

      return this.getRandomPickFromFile(randomFile!, used);
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
    let sourceUsed: Map<string, string[]> = new Map();

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

      const sourceName = this.template.slice(nextVariable + 2, variableEnd);

      // We use the base name of the source to track already used items
      // So if we have `${SourceA/File1} and `${SourceA}` in the same template,
      // items used from `SourceA/File1` are also considered used for `${SourceA}`
      const sourceBaseName = getSourceBaseName(sourceName);

      if (sources.has(sourceName)) {
        if (!sourceUsed.has(sourceBaseName)) {
          sourceUsed.set(sourceBaseName, []);
        }

        const randomPick = await sources.get(sourceName)?.getRandomPick(sourceUsed.get(sourceBaseName)!);
        sourceUsed.get(sourceBaseName)!.push(randomPick!);

        output += randomPick;
      } else {
        new Notice(
          `[Random Picker] Error in template '${this.name}': ${sourceName} not found!`
        );
      }
    }

    return output;
  }
}


# Obsidian Random Picker Plugin

Easily generate random text snippets in your notes using customizable templates and data sources.
Use it to quickly create random names, items, or any other text-based content.

![Template](./img/template.png)
![Preview](./img/preview.png)

## How to Use

1. **Install the plugin** from the Obsidian community plugins browser.
2. **Configure the plugin** in the settings tab.
   - **Data Folder**: Set the path to the folder where you will store your random lists.
   - **Templates**: Manage your templates.
3. **Use the commands** to insert random text into your notes.
   - `Insert random pick`: Choose a template and directly insert the generated text.
   - `Insert random pick with preview`: Choose a template and view a preview of the generated text, with the possibility to regenerate.

## Templates

Templates are the core of this plugin. They allow you to define the structure
of the output and how the random data is used. Templates are written in a
simple template language that allows you to include random data from your
sources.

### Example

Let's say you have a folder called `Lists` in your vault, and inside that
folder, you have a note called `Names` with the following content:

```
- John
- Jane
- Peter
- Mary
```

Configure the plugin to use the `Lists` folder as your data folder. Then you
can create a template like this:

```
Hello, my name is ${Names}!
```

Open the command palette and execute `Insert random pick`. Select the template
that you just created. The plugin will insert your template with a random name
into the current note. For example, the output could be:

```
Hello, my name is John!
```

### Grouping and Multiple Picks

You can also create more complex templates that use multiple picks and groupings.
Create a subfolder in your data folder called `Wines`, and inside that folder, create two notes: `Red` and `White`.
- `Red`:
```
- Merlot
- Cabernet Sauvignon
- Pinot Noir
```

- `White`:
```
- Chardonnay
- Sauvignon Blanc
- Riesling
```

Now, create a template like this:

```I would like a glass of ${Wines}.```

When you run the command, the plugin will randomly choose between the `Red` and
`White` lists and then pick a random wine from the selected list.

You can also still directly reference specific lists:

```I would like a glass of ${Wines/Red} and a glass of ${Wines/White}.```

**Note:** This will only work one level deep. You cannot nest group picks
within other group picks.

You can also specify the same list multiple times:

```I would like a glass of ${Wines} and a glass of ${Wines}.```

The plugin will make sure that picks are unique within a single template, so if
you use the same list multiple times in a template, it will not pick the same
item.

You can use these features to e.g. 

- Create lists of items for role-playing games, one with trash items and one
with valuable items, and then create a template
that randomly picks from either list to generate loot.
- Create a list of first names and a list of last names, and then create a
template that randomly combines them to generate character names.


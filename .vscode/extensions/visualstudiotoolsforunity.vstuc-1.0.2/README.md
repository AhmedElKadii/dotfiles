# Unity for Visual Studio Code

The Unity extension provides C# developers with a lightweight and streamlined [Unity][Unity] development experience on Visual Studio Code. It builds on top of the rich C# capabilities provided by the [C# Dev Kit][CSDevKitExtension] and [C#][CSharpExtension] extensions. This extension integrates natively with Visual Studio Code and includes multiple productivity features including:

* A Unity debugger to debug your Unity editor and your Unity players.
* Unity specific C# analyzers and refactorings.
* Code coloration for Unity file formats (.asmdef, .shader, .uss, .uxml).

![Unity and Visual Studio Code working together](https://devblogs.microsoft.com/visualstudio/wp-content/uploads/sites/4/2023/08/word-image-244229-1.png)

## Getting Started

The Unity extension for Visual Studio Code depends on the `Visual Studio Editor` Unity Package to generate project files that the [C# Dev Kit][CSDevKitExtension] and [C#][CSharpExtension] extensions will rely on to provide code navigation and code completion.

At the moment, the Unity extension for Visual Studio Code requires a version of the `Visual Studio Editor` Unity Package that is not installed by default. To use this extension you will need to manually update the `Visual Studio Editor` package in **all the Unity projects** you want to use this extension with. Note: the `Visual Studio Code Editor` package is a legacy package from Unity that is not maintained anymore.

![Unity Package Manager](https://devblogs.microsoft.com/visualstudio/wp-content/uploads/sites/4/2023/08/word-image-244229-4.png)

### Unity 2019 and Unity 2020

* Open Unity's Package Manager (Window / Package Manager).
* **Remove** the deprecated `Visual Studio Code Editor` package (this is an older package that is not supported with this extension).
* **Update** the `Visual Studio Editor` package to at least 2.0.20.

### Unity 2021

* Open Unity's Package Manager (Window / Package Manager).
* **Update** the `Visual Studio Editor` package to at least 2.0.20.

### Unity 2022 and Unity 2023

* Open Unity's Package Manager (Window / Package Manager).
* **Unlock** the `Visual Studio Editor` package.
* Go to the `Version History` tab of the `Visual Studio Editor` package.
* **Update** the `Visual Studio Editor` package to at least 2.0.20.

When you've updated the `Visual Studio Editor` package, in Unity's preferences, set Visual Studio Code as Unity's External C# editor. The dialog must now read `Visual Studio Editor v2.0.20 enabled`. Then press **Regenerate project files**.

![Unity External Tools](https://devblogs.microsoft.com/visualstudio/wp-content/uploads/sites/4/2023/08/word-image-244229-5.png)

Double-click on a C# script, and your Unity project will open in Visual Studio Code.

## Commands

The Unity extension for Visual Studio code adds those commands to Visual Studio Code's Command Palette:

* `Attach Unity Debugger`: this command will list the Unity Editor and Players that you can attach the Unity debugger to.
* `Unity API Reference`: this command will open the Unity documentation for the code construct that is currently selected.

## Attaching the Unity debugger to a Unity player

By default, your Unity project will be setup with a debugger configuration to attach the Unity debugger to the Unity Editor instance opened on the project.

If you want to debug a Unity Player, the easiest way is to use the `Attach Unity Debugger` command.

Alternatively, you can modify the `.vscode/launch.json` file in your project and add a new debugger configuration for a IP endPoint you know of:

```json
    {
        "name": "Attach to Xbox",
        "type": "vstuc",
        "request": "attach",
        "endPoint": "127.0.0.1:56321"
    }
```

## Requirements

* [Unity][Unity] 2019 LTS or greater.
* Activated [C# Dev Kit][CSDevKitExtension] extension in Visual Studio Code.
* .NET 8 SDK or greater, the C# Dev Kit will install it if required.
* `Visual Studio Editor` Unity package 2.0.20 or greater.

## Found a bug?
To file a new issue, go to Visual Studio Code's Help > Report Issue. In the popup UI, make sure to select "An extension" from the dropdown for “File on” and select “Unity” for the extension dropdown. Submitting this form will automatically generate a new issue on GitHub.

Alternatively, you can file an issue directly on the [GitHub Repo](https://github.com/microsoft/vscode-dotnettools).

[CSharpExtension]: https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp
[CSDevKitExtension]: https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit
[Unity]: https://www.unity.com

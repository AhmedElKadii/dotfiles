# Change Log

## v1.0.2 - May 27, 2024

- Add [`USP0022`](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/USP0022.md), Unity objects should not use if null coalescing.
- Fix stack overflow with unusable sockets.
- Fix project name issue with Switch players.
- Fix module name queries with unloaded assemblies.
- Fix issue when detaching without prior effective connection.
- Refine editor and player detection.
- Warn about the usage of the deprecated `Unity.unity-debug` extension.

## v1.0.1 - April 2, 2024

- Move to .NET 8.
- Improve [`UNT0024`](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/UNT0024.md), to support `Unity.Mathematics.floatX` types.
- Improve exception logging.

## v1.0.0 - March 12, 2024

- Initial Stable Release.
- Fix trivia handling with [`UNT0021`](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/UNT0021.md), when using messages without modifiers.
- Fix batch provider for all diagnostics.
- Fix nullable value type display.

## v0.9.4 - January 10, 2024

- [Add support for language configurations (line/block comment, folding, indent, ...) for UnityShader, UnityUSS and UnityUXML files.](https://github.com/microsoft/vscode-dotnettools/issues/702).
- Add more logging to Unity output channel.
- Fix [`UNT0034`](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/UNT0034.md) and [`UNT0035`](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/UNT0035.md) with ambiguous overloads.

## v0.9.3 - November 11, 2023

- Add logging to Unity output channel.
- Add support for `TransformAccess` with [`UNT0022`](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/UNT0022.md) and [`UNT0032`](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/UNT0032.md).
- Add [`UNT0036`](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/UNT0036.md), Inefficient method to get position and rotation.
- Add [`UNT0037`](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/UNT0036.md), Inefficient method to get localPosition and localRotation.
- Fix [`USP0008`](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/USP0008.md) with partial types.

## v0.9.2 - October 10, 2023

- Monitor `asmdef` files as well when `Refresh Asset Database` feature is enabled.
- Properly close UDP messenger port.

## v0.9.1 - September 20, 2023

- Support for Unity 2019 and Unity 2020.
- [Refresh Asset Database and regenerate project files when adding/moving/deleting files.](https://github.com/microsoft/vscode-dotnettools/issues/530).
- Warn if the Unity Package in the Unity project doesn't support the Visual Studio Code integration.
- Improve support for consts when evaluating.
- Optimize Log Points in the debugger.
- Fix namespace lookup to walk the namespace hierarchy.
- Add [`USP0021`](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/USP0021.md), Prefer reference equality.

## v0.9.0 - August 3, 2023

Initial Preview Release.

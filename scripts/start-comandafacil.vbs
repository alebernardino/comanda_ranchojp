Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & """" & CreateObject("Scripting.FileSystemObject").GetAbsolutePathName("scripts\\start-comandafacil.bat") & """" & Chr(34), 0
Set WshShell = Nothing

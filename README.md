"# survival-dinosaur" 
cmd
rmdir /s /q "C:\Programing\Game\KhungLong\client_v2\native\target" 2>nul
rmdir /s /q "%TEMP%\glb_fix" 2>nul
rmdir /s /q "%USERPROFILE%\.cargo\registry\cache" 2>nul
rmdir /s /q "%USERPROFILE%\.cargo\registry\src" 2>nul
rmdir /s /q "%USERPROFILE%\.cargo\git" 2>nul
rmdir /s /q "C:\Programing\Game\KhungLong\public\models\dino\_raw_backup" 2>nul
rmdir /s /q "C:\Programing\Game\KhungLong\public\models\env\_raw_backup" 2>nul
npm cache clean --force
go clean -cache
dir C:\ | findstr "bytes free"
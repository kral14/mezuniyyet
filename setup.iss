; --- Mezuniyyet Sistemi Inno Setup Skripti (Pascal Script ilə Gücləndirilmiş) ---

[Setup]
AppId={{F0A3E5C1-5B2E-4D8C-B2A9-1E3A8F7B6C0D}}
AppName=Məzuniyyət İdarəetmə Sistemi
AppVersion=4.1
AppPublisher=Sizin Adınız
DefaultDirName={autopf}\Mezuniyyet Idarəetmə Sistemi
PrivilegesRequired=lowest
LanguageDetectionMethod=uilanguage
OutputBaseFilename=MezuniyyetSistemi_Setup_v4.1
Compression=lzma
SolidCompression=yes
WizardStyle=modern
DisableProgramGroupPage=yes

; CloseApplications direktivi artıq lazım deyil, çünki bu işi [Code] bölməsi görür.
; Bu, "Uygulamalar kapatılsın mı?" pəncərəsinin də qarşısını alacaq.

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "dist\MezuniyyetSistemi.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\Məzuniyyət İdarəetmə Sistemi"; Filename: "{app}\MezuniyyetSistemi.exe"
Name: "{autodesktop}\Məzuniyyət İdarəetmə Sistemi"; Filename: "{app}\MezuniyyetSistemi.exe"; Tasks: desktopicon

[Run]
; Quraşdırma uğurla bitdikdən sonra proqramı işə salır.
Filename: "{app}\MezuniyyetSistemi.exe"; Description: "{cm:LaunchProgram,Məzuniyyət İdarəetmə Sistemi}"; Flags: nowait postinstall shellexec


; --- ƏN VACİB HİSSƏ: PASCAL SCRIPT ---
[Code]
// Bu funksiya, fayllar kopyalanmağa başlamazdan bir an əvvəl işə düşür.
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  // 'taskkill' əmri ilə arxada işləyən köhnə proqramı məcburi dayandırırıq.
  // Prosesin olub-olmamasının fərqi yoxdur, əmr hər halda icra olunacaq.
  Log('Attempting to terminate MezuniyyetSistemi.exe...');
  Exec(ExpandConstant('{cmd}'), '/c taskkill /f /im MezuniyyetSistemi.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  
  // Windows-a fayl kilidini buraxması üçün 1 saniyə vaxt veririk.
  Sleep(1000);
  
  // Boş string qaytarmaq quraşdırmanın davam etməsi deməkdir.
  Result := '';
end;
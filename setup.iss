[Setup]
; --- ƏSAS DƏYİŞİKLİKLƏR ---
; Proqramın inzibatçı hüquqları istəməsinin qarşısını alır
PrivilegesRequired=lowest
; Proqramı qorunan "Program Files" əvəzinə istifadəçinin şəxsi qovluğuna quraşdırır
DefaultDirName={userappdata}\MezuniyyetSistemi

AppName=Mezuniyyet Idareetme Sistemi
AppVersion=3.7
DefaultGroupName=Mezuniyyet Sistemi
OutputBaseFilename=Mezuniyyet-v3.7-setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; DİQQƏT: Bu fayl yollarının düzgün olduğundan əmin olun
Source: "C:\Users\nesib\Desktop\mezuniyyet proqram versiyalar\mezuniyyet - Kopya\dist\Mezuniyyet.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\nesib\Desktop\mezuniyyet proqram versiyalar\mezuniyyet - Kopya\config.json"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Mezuniyyet Sistemi"; Filename: "{app}\Mezuniyyet.exe"
Name: "{autodesktop}\Mezuniyyet Sistemi"; Filename: "{app}\Mezuniyyet.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\Mezuniyyet.exe"; Description: "{cm:LaunchProgram,Mezuniyyet Sistemi}"; Flags: nowait postinstall skipifsilent
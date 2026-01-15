import subprocess
import os
import re
import sys

# Configuration
# Script is in root, but we focus on the API subfolder
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
API_DIR = os.path.join(ROOT_DIR, "rust-sistemi", "new-api")
CARGO_TOML_PATH = os.path.join(API_DIR, "Cargo.toml")
REMOTE_URL = "https://github.com/kral14/mezuniyyet-newapi.git"

def run_command(cmd, cwd=None, description="Running command", exit_on_fail=True):
    """Run a command and return success status"""
    print(f"\n⚙️  {description}...")
    try:
        # Use shell=True for windows command compatibility
        result = subprocess.run(
            cmd,
            cwd=cwd,
            shell=True,
            capture_output=False, 
            text=True
        )
        if result.returncode != 0:
            print(f"❌ XƏTA: '{description}' uğursuz oldu.")
            if exit_on_fail:
                sys.exit(1)
            return False
        return True
    except Exception as e:
        print(f"❌ XƏTA: {e}")
        if exit_on_fail:
            sys.exit(1)
        return False

def get_current_version():
    """Reads the version from Cargo.toml"""
    try:
        with open(CARGO_TOML_PATH, "r", encoding="utf-8") as f:
            content = f.read()
            match = re.search(r'^version\s*=\s*"(\d+\.\d+\.\d+)"', content, re.MULTILINE)
            if match:
                return match.group(1)
    except Exception as e:
        print(f"⚠️ Versiya oxuna bilmədi: {e}")
    return None

def update_cargo_toml(new_version):
    """Updates Cargo.toml with the new version"""
    try:
        with open(CARGO_TOML_PATH, "r", encoding="utf-8") as f:
            content = f.read()
        
        new_content = re.sub(
            r'^version\s*=\s*"\d+\.\d+\.\d+"',
            f'version = "{new_version}"',
            content,
            flags=re.MULTILINE
        )
        
        with open(CARGO_TOML_PATH, "w", encoding="utf-8") as f:
            f.write(new_content)
        return True
    except Exception as e:
        print(f"❌ Fayl yazıla bilmədi: {e}")
        return False

def init_git_if_needed():
    """Ensures the API folder is a git repo and has remote set"""
    git_dir = os.path.join(API_DIR, ".git")
    if not os.path.exists(git_dir):
        print("� Git repo yaradılır...")
        run_command("git init", cwd=API_DIR, description="Git Init")
        run_command(f"git remote add origin {REMOTE_URL}", cwd=API_DIR, description="Remote əlavə edilir", exit_on_fail=False)
    
    # Ensure remote URL is correct
    run_command(f"git remote set-url origin {REMOTE_URL}", cwd=API_DIR, description="Remote URL yoxlanılır", exit_on_fail=False)

def main():
    print("=" * 60)
    print("   🚀 API Auto-Deploy & Versioning Script (Direct Mode)")
    print("   Target: rust-sistemi/new-api")
    print("=" * 60)

    # 1. Verify Build (Cargo Check)
    print("\n🛠️  Kod yoxlanılır (cargo check)...")
    run_command("cargo check", cwd=API_DIR, description="Kompilyasiya yoxlanılır")

    # 2. Version Management
    current_ver = get_current_version()
    if not current_ver:
        print("❌ Cargo.toml-da versiya tapılmadı!")
        sys.exit(1)
        
    major, minor, patch = map(int, current_ver.split('.'))
    new_ver = f"{major}.{minor}.{patch + 1}"
    
    print(f"📌 Cari Versiya: {current_ver}")
    print(f"🔼 Yeni Versiya: {new_ver}")

    if update_cargo_toml(new_ver):
        print("✅ Cargo.toml yeniləndi.")
    else:
        sys.exit(1)

    # 3. Git Operations
    init_git_if_needed()
    
    run_command("git add .", cwd=API_DIR, description="Dəyişikliklər stage edilir")
    
    # Check if there are changes to commit
    status = subprocess.run("git status --porcelain", cwd=API_DIR, shell=True, capture_output=True, text=True)
    if status.stdout.strip():
        run_command(f'git commit -m "deploy: version {new_ver}"', cwd=API_DIR, description="Commit edilir")
    else:
        print("ℹ️  Commit ediləcək başqa dəyişiklik yoxdur (sadəcə versiya dəyişdi).")

    # 4. Push
    print(f"\n🚀 {REMOTE_URL}-a göndərilir...")
    run_command("git push -u origin main", cwd=API_DIR, description="GitHub-a Push edilir")

    print(f"\n✅ UĞURLA TAMAMLANDI! (Versiya: {new_ver})")

if __name__ == "__main__":
    main()
    print("\nÇıxmaq üçün Enter basın...") 
    input()

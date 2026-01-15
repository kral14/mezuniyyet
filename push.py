
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Git Push Script
Bu script bütün dəyişiklikləri commit edir və push edir
"""

import subprocess
import sys
from datetime import datetime

def run_command(command, description, show_output=True):
    """Git əmrini icra edir"""
    if show_output:
        print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True, encoding='utf-8')
        if show_output and result.stdout:
            print(result.stdout)
        return True, result.stdout if result.stdout else ""
    except subprocess.CalledProcessError as e:
        if show_output:
            # print(f"❌ Xəta: {e}") # Xəta mesajını gizlət, yoxsa istifadəçi çaşbaş qalır
            if e.stderr:
                print(e.stderr)
            elif e.stdout: # Bəzən xəta mesajı stdout-da olur (məsələn git commit boş olanda)
                print(e.stdout)
        
        # Həm stdout, həm də stderr qaytar ki, yoxlaya bilək
        output = (e.stdout if e.stdout else "") + (e.stderr if e.stderr else "")
        return False, output

def check_git_config():
    """Git user config yoxlanır və lazım olsa təyin edilir"""
    # Email yoxla
    success, email = run_command("git config user.email", "Email yoxlanılır", show_output=False)
    if not success or not email.strip():
        print("\n⚠️ Git email təyin edilməyib!")
        email = input("Email daxil edin: ").strip()
        if email:
            run_command(f'git config user.email "{email}"', f"Email təyin edilir: {email}")
        else:
            print("❌ Email təyin edilmədi! Commit edilə bilməz.")
            return False
    
    # Name yoxla
    success, name = run_command("git config user.name", "Ad yoxlanılır", show_output=False)
    if not success or not name.strip():
        print("\n⚠️ Git ad təyin edilməyib!")
        name = input("Ad daxil edin: ").strip()
        if name:
            run_command(f'git config user.name "{name}"', f"Ad təyin edilir: {name}")
        else:
            print("❌ Ad təyin edilmədi! Commit edilə bilməz.")
            return False
    
    return True

def main():
    print("=" * 50)
    print("🚀 Unified Git Push Script (Root + API)")
    print("=" * 50)
    
    # Git config yoxla
    if not check_git_config():
        print("\n❌ Git config təyin edilmədi! Script dayandırılır.")
        sys.exit(1)
    
    # Git status
    print("\n📋 Git status yoxlanılır...")
    run_command("git status", "Status yoxlanılır")
    
    # Git add
    success, _ = run_command("git add .", "Bütün dəyişikliklər əlavə edilir (API daxil)")
    if not success:
        print("❌ Dəyişikliklər əlavə edilə bilmədi!")
        sys.exit(1)
    
    # Commit mesajı
    print("\n💬 Commit mesajını daxil edin:")
    print("(Boş buraxsanız, avtomatik mesaj istifadə olunacaq)")
    commit_message = input("> ").strip()
    
    if not commit_message:
        commit_message = f"Unified Update: Kod və API yeniləmələri - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    # Git commit
    success, error = run_command(f'git commit -m "{commit_message}"', "Commit edilir")
    if not success:
        if "nothing to commit" in error or "working tree clean" in error or "no changes added to commit" in error:
            print("ℹ️ Commit ediləcək heç nə yoxdur.")
        else:
            print("❌ Commit edilə bilmədi!")
            sys.exit(1)
    
    # Git push
    # Git push
    success, error = run_command("git push", "GitHub-a göndərilir (Push)")
    if not success:
        if "has no upstream branch" in error or "set-upstream" in error:
            print("\n⚠️ Upstream branch təyin edilməyib. Avtomatik təyin edilir...")
            
            # Cari branch adını al
            _, branch_name = run_command("git branch --show-current", "Branch adı alınır", show_output=False)
            branch_name = branch_name.strip()
            
            if branch_name:
                success_up, _ = run_command(f"git push --set-upstream origin {branch_name}", f"Upstream təyin edilir və push olunur ({branch_name})")
                if success_up:
                    print(f"✅ Branch '{branch_name}' upstream olaraq təyin edildi və push olundu.")
                else:
                    print("❌ Upstream təyin edilə bilmədi!")
                    sys.exit(1)
            else:
                print("❌ Branch adı alına bilmədi!")
                sys.exit(1)
        else:
            print("❌ Push edilə bilmədi!")
            sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✅ Tamamlandı! Hər şey (API daxil) push edildi.")
    print("=" * 50)
    
    input("\nDavam etmək üçün Enter düyməsini basın...")

if __name__ == "__main__":
    main()


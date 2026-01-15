import os
import sys
import subprocess

def install_pillow():
    try:
        import PIL
        print("✅ Pillow artıq yüklənib.")
    except ImportError:
        print("📦 Pillow yüklənir...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])

def main():
    install_pillow()
    from PIL import Image

    # Konfiqurasiya
    # Generated AI Image
    source_image_path = r"C:/Users/nesib/.gemini/antigravity/brain/b82372d8-7b6f-42e4-b9dd-98b8ebe999a8/vacation_app_icon_1767706450809.png"
    target_dir = r"c:\Users\nesib\Desktop\v7.11\rust-sistemi\src-tauri\icons"
    
    if not os.path.exists(source_image_path):
        print(f"❌ Şəkil tapılmadı: {source_image_path}")
        return

    if not os.path.exists(target_dir):
        print(f"❌ İkon qovluğu tapılmadı: {target_dir}")
        return

    print(f"🖼️ Şəkil emal edilir: {source_image_path}")
    
    try:
        img = Image.open(source_image_path)
        img = img.convert("RGBA") # Şəffaflığı qorumaq üçün
        
        # 1. 32x32.png
        img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(target_dir, "32x32.png"))
        print("✅ 32x32.png yaradıldı")

        # 2. 128x128.png
        img.resize((128, 128), Image.Resampling.LANCZOS).save(os.path.join(target_dir, "128x128.png"))
        print("✅ 128x128.png yaradıldı")

        # 3. 128x128@2x.png (256x256)
        img.resize((256, 256), Image.Resampling.LANCZOS).save(os.path.join(target_dir, "128x128@2x.png"))
        print("✅ 128x128@2x.png yaradıldı")

        # 4. icon.ico (includes 16, 32, 48, 64, 128, 256)
        icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        img.save(os.path.join(target_dir, "icon.ico"), sizes=icon_sizes)
        print("✅ icon.ico yaradıldı")
        
        print("\n✨ Bütün ikonlar yeniləndi!")
        
    except Exception as e:
        print(f"❌ Xəta baş verdi: {e}")

if __name__ == "__main__":
    main()

import bcrypt

# Yeni şifrəni buraya yazın (məsələn: 'yeni_sifre_123')
yeni_sifre = b'yeni_sifre_123'

# Həmin şifrə üçün hash yaradın
hashed_sifre = bcrypt.hashpw(yeni_sifre, bcrypt.gensalt())

# Nəticəni çap edin (bu nəticəni kopyalayıb növbəti addımda istifadə edəcəksiniz)
print(f"Yeni hash dəyəri: {hashed_sifre.decode('utf-8')}")
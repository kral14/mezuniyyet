# Avtomatlaşdırılmış Test Skripti

Bu qovluqda `test_delivery.py` skripti yerləşir. Bu skript "WhatsApp Delivery Status" (Çatdırılma Statusu) məntiqini yoxlayır.

## Nələri Yoxlayır?
1.  **Ssenari A (Instant Delivery):** Hər iki tərəf Online olduqda, mesaj göndərilən kimi `MESSAGE_DELIVERED` siqnalının gəlməsini.
2.  **Ssenari B (Offline Sync):** Biri Offline olduqda mesajın "çatdırılmadı" kimi qalmasını, sonra Online olan kimi avtomatik "çatdırıldı" (2 boz xətt) olmasını.

## Necə İşlətmək Lazımdır?

1.  CMD və ya Terminalı açın.
2.  Layihənin əsas qovluğuna gedin.
3.  Aşağıdakı əmri yazın:

```bash
python tests/test_delivery.py
```

Skript avtomatik olaraq:
- `sender` və `recipient` adlı test istifadəçiləri yaradacaq.
- Mesajlaşıb statusları yoxlayacaq.
- Nəticəni ekrana yazacaq.

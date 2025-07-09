import webview
import os
import sys

# Bu sinif JavaScript-dən gələn məlumatları qəbul edir.
class Api:
    def on_date_selected(self, date_str):
        print(f"HTML Təqvimdən tarix seçildi: {date_str}")
        
        # Tarix seçildikdən sonra təqvim pəncərəsini bağlayırıq.
        if webview.active_window():
             webview.active_window().destroy()


if __name__ == '__main__':
    # Tkinter pəncərəsi və düymə artıq yoxdur.
    # Proqram başlayanda birbaşa təqvim pəncərəsini yaradırıq.
    
    html_file = os.path.join(os.path.dirname(__file__), 'calendar.html')
    api = Api()

    # Birbaşa təqvim pəncərəsini yaradırıq
    webview.create_window(
        'İnteraktiv Təqvim',
        url=html_file,
        js_api=api,
        width=400,
        height=480,
        resizable=False
    )
    
    # pywebview proqramını başladırıq
    webview.start()

    print("Təqvim proqramı bağlandı.")
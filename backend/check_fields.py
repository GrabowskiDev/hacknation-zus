# check_fields.py
from pypdf import PdfReader

reader = PdfReader("EWYP.pdf") # Twój plik
fields = reader.get_fields()

if fields:
    print("--- Pola w formularzu ---")
    for key, value in fields.items():
        print(f"Nazwa pola: {key}, Typ: {value.get('/FT')}")
else:
    print("Nie znaleziono pól formularza.")
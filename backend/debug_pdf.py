# debug_pdf.py
from main import fill_ewyp_pdf, CaseState, Witness

# Tworzymy przykładowy stan sprawy (mock)
mock_state = CaseState(
    first_name="Jan",
    last_name="Testowy",
    pesel="12345678901",
    date_of_birth="01-01-1980",
    address_home="ul. Debugowa 1/2, 00-001 Warszawa",
    business_address="ul. Firmowa 10, 00-002 Kraków",
    nip="1112223344",
    accident_date="01-01-2023",
    accident_time="12:00",
    accident_place="Biuro",
    injury_type="Złamanie",
    accident_description="Testowy opis wypadku...",
    first_aid_info="Szpital Miejski",
    equipment_info="Drabina",
    proceedings_info="Policja",
    witnesses=[
        Witness(first_name="Anna", last_name="Świadek", address="ul. Polna 1")
    ]
)

print("Uruchamiam generator...")
try:
    # Wywołujemy funkcję
    pdf_stream = fill_ewyp_pdf(mock_state, template_path="EWYP.pdf")
    
    # Zapisujemy wynik na dysk, żebyś mógł go otworzyć
    with open("DEBUG_OUTPUT.pdf", "wb") as f:
        f.write(pdf_stream.getbuffer())
        
    print("\nSUKCES! Plik zapisano jako DEBUG_OUTPUT.pdf")
except Exception as e:
    print(f"\nBŁĄD KRYTYCZNY: {e}")
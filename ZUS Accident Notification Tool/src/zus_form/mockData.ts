import type { FormInterface } from "./Interfaces";

export const mockFormData: FormInterface = {
  sections: [
    {
      title: "Dane Poszkodowanego",
      fields: [
        {
          name: "fullName",
          label: "Imię i Nazwisko",
          inputType: "text",
          currentValue: "Jan Kowalski",
          formatPlaceholder: "np. Jan Kowalski",
          validationRule: (value: any) => value.length > 0,
        },
        {
          name: "pesel",
          label: "PESEL",
          inputType: "text",
          currentValue: "85010112345",
          formatPlaceholder: "11 cyfr",
          validationRule: (value: any) => /^\d{11}$/.test(value),
        },
        {
          name: "address",
          label: "Adres zamieszkania",
          inputType: "text",
          currentValue: "ul. Przykładowa 1, 00-001 Warszawa",
          formatPlaceholder: "Ulica, numer domu, kod pocztowy, miasto",
          validationRule: (value: any) => value.length > 5,
        },
      ],
    },
    {
      title: "Szczegóły Wypadku",
      fields: [
        {
          name: "accidentDate",
          label: "Data wypadku",
          inputType: "date",
          currentValue: "2023-10-25",
          formatPlaceholder: "RRRR-MM-DD",
          validationRule: (value: any) => true,
        },
        {
          name: "accidentTime",
          label: "Godzina wypadku",
          inputType: "time",
          currentValue: "14:30",
          formatPlaceholder: "GG:MM",
          validationRule: (value: any) => true,
        },
        {
          name: "location",
          label: "Miejsce zdarzenia",
          inputType: "text",
          currentValue: "Biuro, sala konferencyjna nr 3",
          formatPlaceholder: "np. Hala produkcyjna, Biuro",
          validationRule: (value: any) => value.length > 0,
        },
      ],
    },
    {
      title: "Opis Zdarzenia",
      fields: [
        {
          name: "description",
          label: "Opis okoliczności",
          inputType: "textarea",
          currentValue:
            "Podczas wstawania z krzesła potknąłem się o kabel zasilający laptopa i upadłem na lewe kolano.",
          formatPlaceholder: "Szczegółowy opis przebiegu zdarzenia",
          validationRule: (value: any) => value.length > 20,
        },
        {
          name: "witnesses",
          label: "Świadkowie",
          inputType: "text",
          currentValue: "Anna Nowak",
          formatPlaceholder: "Imiona i nazwiska świadków",
          validationRule: (value: any) => true,
        },
      ],
    },
  ],
};

export default mockFormData;

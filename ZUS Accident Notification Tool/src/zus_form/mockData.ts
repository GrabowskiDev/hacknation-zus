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
          regex: /^.+$/,
        },
        {
          name: "pesel",
          label: "PESEL",
          inputType: "text",
          currentValue: "85010112345",
          formatPlaceholder: "11 cyfr",
          regex: /^\d{11}$/,
        },
        {
          name: "address",
          label: "Adres zamieszkania",
          inputType: "text",
          currentValue: "ul. Przykładowa 1, 00-001 Warszawa",
          formatPlaceholder: "Ulica, numer domu, kod pocztowy, miasto",
          regex: /^.{6,}$/,
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
          regex: /.*/,
        },
        {
          name: "accidentTime",
          label: "Godzina wypadku",
          inputType: "time",
          currentValue: "14:30",
          formatPlaceholder: "GG:MM",
          regex: /.*/,
        },
        {
          name: "location",
          label: "Miejsce zdarzenia",
          inputType: "text",
          currentValue: "Biuro, sala konferencyjna nr 3",
          formatPlaceholder: "np. Hala produkcyjna, Biuro",
          regex: /^.+$/,
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
          regex: /^.{21,}$/,
        },
        {
          name: "witnesses",
          label: "Świadkowie",
          inputType: "text",
          currentValue: "Anna Nowak",
          formatPlaceholder: "Imiona i nazwiska świadków",
          regex: /.*/,
        },
      ],
    },
  ],
};

export default mockFormData;

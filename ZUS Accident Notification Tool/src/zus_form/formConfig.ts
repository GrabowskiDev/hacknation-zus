import type { FormSectionConfig, Witness } from "../types";

export const formConfig: FormSectionConfig[] = [
  {
    title: "Dane poszkodowanego",
    fields: [
      { key: "first_name", label: "Imię", type: "text" },
      { key: "last_name", label: "Nazwisko", type: "text" },
      { key: "pesel", label: "PESEL", type: "text", regex: /^\d{11}$/ },
      { key: "date_of_birth", label: "Data urodzenia", type: "date" },
      { key: "address_home", label: "Adres zamieszkania", type: "text" },
      { key: "address_correspondence", label: "Adres do korespondencji", type: "text" },
    ],
  },
  {
    title: "Dane płatnika składek",
    fields: [
      { key: "nip", label: "NIP", type: "text", regex: /^\d{10}$/ },
      { key: "regon", label: "REGON", type: "text", regex: /^\d{9,14}$/ },
      { key: "business_address", label: "Adres siedziby", type: "text" },
      { key: "pkd", label: "Kod PKD", type: "text" },
      { key: "business_description", label: "Rodzaj działalności", type: "textarea" },
    ],
  },
  {
    title: "Informacje o wypadku",
    fields: [
      { key: "accident_date", label: "Data wypadku", type: "date" },
      { key: "accident_time", label: "Godzina wypadku", type: "time" },
      { key: "accident_place", label: "Miejsce wypadku", type: "text" },
      { key: "injury_type", label: "Rodzaj urazu", type: "text" },
      { key: "accident_description", label: "Opis zdarzenia", type: "textarea" },
      { key: "first_aid_info", label: "Udzielona pierwsza pomoc", type: "textarea" },
      { key: "proceedings_info", label: "Postępowanie powypadkowe", type: "textarea" },
      { key: "equipment_info", label: "Maszyny i urządzenia", type: "textarea" },
    ],
  },
  {
    title: "Czas pracy",
    fields: [
      { key: "planned_work_start", label: "Planowane rozpoczęcie pracy", type: "time" },
      { key: "planned_work_end", label: "Planowane zakończenie pracy", type: "time" },
    ],
  },
  // Witnesses handled separately or as a simple field for now?
  // The original code handled 'witnesses' specifically.
  // I will add it here and handle the array conversion in the component.
  {
    title: "Świadkowie",
    fields: [
      { 
        key: "witnesses", 
        label: "Dane świadków", 
        type: "textarea", 
        placeholder: "Imię Nazwisko, Adres (oddzieleni przecinkami)",
        format: (value: Witness[]) => {
          if (Array.isArray(value) && value.length > 0) {
            return value.map((w) => `${w.first_name} ${w.last_name}`).join(", ");
          }
          return "";
        },
        parse: (value: string) => {
          return value.split(",").map((w) => {
            const parts = w.trim().split(" ");
            return {
              first_name: parts[0] || "",
              last_name: parts.slice(1).join(" ") || "",
            };
          }).filter(w => w.first_name || w.last_name);
        }
      },
    ],
  },
];

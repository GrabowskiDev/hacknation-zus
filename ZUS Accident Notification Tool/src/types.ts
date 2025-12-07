// src/types.ts

export type Role = "user" | "assistant";

export interface ChatTurn {
  role: Role;
  content: string;
}

export type ReporterType = "victim" | "proxy";

export const ReporterType = {
  VICTIM: "victim" as const,
  PROXY: "proxy" as const,
};

export interface Witness {
  first_name: string;
  last_name: string;
  address?: string;
}

export interface CaseState {
  reporter_type?: ReporterType; // Kto zgłasza
  proxy_document_attached?: boolean;

  // Dane poszkodowanego
  pesel?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  address_home?: string;
  address_correspondence?: string;

  // Dane działalności
  nip?: string;
  regon?: string;
  business_address?: string;
  pkd?: string;
  business_description?: string;

  // Informacje o wypadku
  accident_date?: string;
  accident_time?: string;
  accident_place?: string;
  planned_work_start?: string;
  planned_work_end?: string;
  injury_type?: string;
  accident_description?: string;
  first_aid_info?: string;
  proceedings_info?: string;
  equipment_info?: string;

  // Świadkowie
  witnesses: Witness[];

  // Flagi
  sudden?: boolean;
  external_cause?: boolean;
  injury_confirmed?: boolean;
  work_related?: boolean;
}

export interface MissingField {
  field: string;
  reason: string;
}

export interface ActionStep {
  step_number: number;
  description: string;
  required_documents: string[];
}

// Odpowiedź z Twojego API
export interface AssistantResponse {
  assistant_reply: string;
  missing_fields: MissingField[];
  case_state_preview: CaseState;
  recommended_actions?: ActionStep[];
}

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldConfig {
  key: keyof CaseState;
  label: string;
  type: "text" | "textarea" | "date" | "time" | "select";
  placeholder?: string;
  regex?: RegExp;
  options?: FormFieldOption[];
  format?: (value: any) => string;
  parse?: (value: string) => any;
}

export interface FormSectionConfig {
  title: string;
  fields: FormFieldConfig[];
}

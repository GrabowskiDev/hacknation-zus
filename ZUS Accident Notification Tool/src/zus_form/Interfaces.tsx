export interface FieldInterface {
  name: string;
  label?: string;
  inputType: string;
  validationRule?: (value: any) => boolean;
  currentValue: string;
  formatPlaceholder?: string;
}

export interface FormSectionInterface {
  title: string;
  fields: FieldInterface[];
}

export interface FormInterface {
  sections: FormSectionInterface[];
}

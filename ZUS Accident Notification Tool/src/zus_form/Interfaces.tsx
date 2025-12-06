export interface FieldInterface {
  name: string;
  label?: string;
  inputType: string;
  regex?: RegExp;
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

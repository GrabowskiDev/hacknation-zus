export const validateField = (value: string, regex?: RegExp): boolean => {
  if (regex) {
    return regex.test(value);
  }
  return true;
};

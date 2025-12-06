import type { FormSectionConfig } from "@/types";

// Helper to turn the nested section>fields structure into a flat array of fields
export const flattenFormConfig = (config: FormSectionConfig[]) => {
  return config.flatMap((section) => section.fields);
};

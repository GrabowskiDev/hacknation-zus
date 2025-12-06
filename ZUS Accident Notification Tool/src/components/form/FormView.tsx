import FormSection from "@/components/form/FormSection";
import { formConfig } from "@/config/formConfig"; // Ensure you move your config to src/config/
import { useFormSync } from "@/hooks/useFormSync";

function FormView() {
  // Logic is now one clean line
  const { localState, handleFieldChange, handleFieldBlur } =
    useFormSync(formConfig);

  return (
    <div className="h-full overflow-y-auto px-6 pb-20 custom-scrollbar">
      {formConfig.map((section, index) => (
        <FormSection
          key={index}
          config={section}
          values={localState}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
        />
      ))}
    </div>
  );
}

export default FormView;

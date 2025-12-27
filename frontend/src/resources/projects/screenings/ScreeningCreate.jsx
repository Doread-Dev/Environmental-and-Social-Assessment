import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  ReferenceInput,
  AutocompleteInput,
  required,
  maxLength,
  minLength,
} from "react-admin";

const categoryCodes = [
  { id: "A", name: "A - High potential environmental risk" },
  { id: "B", name: "B - Low to moderate environmental risk" },
  { id: "C", name: "C - Negligible environmental risk" },
  { id: "D", name: "D - Emergency cases and initiatives" },
  { id: "E", name: "E - Not enough information." },
  { id: "F", name: "F - Positive Environmental Impact" },
];

const ScreeningCreate = (props) => {
  return (
    <Create {...props} title="إنشاء فحص بيئي جديد">
      <SimpleForm>
        <ReferenceInput
          source="project"
          reference="projects"
          label="المشروع"
        //   validate={[required()]}
          fullWidth
        >
          <AutocompleteInput
            label="اختر المشروع"
            optionText="title"
            filterToQuery={(searchText) => ({ title: searchText })}
            sx={{ width: "100%" }}
          />
        </ReferenceInput>

        <SelectInput
          source="category_code"
          label="رمز التصنيف"
          choices={categoryCodes}
          validate={[required()]}
          fullWidth
        />

        <TextInput
          source="category_reason"
          label="سبب التصنيف"
          multiline
          rows={3}
          validate={[required(), minLength(10), maxLength(500)]}
          fullWidth
        />

        <TextInput
          source="potential_negative"
          label="التأثيرات السلبية المحتملة"
          multiline
          rows={3}
          validate={[required()]}
          fullWidth
        />

        <TextInput
          source="potential_positive"
          label="التأثيرات الإيجابية المحتملة"
          multiline
          rows={3}
          fullWidth
        />

        <TextInput
          source="recommendations"
          label="التوصيات"
          multiline
          rows={4}
        //   validate={[required()]}
          fullWidth
        />
      </SimpleForm>
    </Create>
  );
};

export default ScreeningCreate;

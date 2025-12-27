import {
  Edit,
  TabbedForm,
  FormTab,
  TextInput,
  SelectInput,
  ReferenceInput,
  AutocompleteInput,
} from "react-admin";

const ScreeningEdit = () => {
  return (
    <Edit title="تعديل فحص بيئي">
      <TabbedForm>
        <FormTab label="الأساسي">
          <ReferenceInput source="project" reference="projects">
            <AutocompleteInput optionText="title" disabled />
          </ReferenceInput>

          <SelectInput
            source="category_code"
            choices={[
              { id: "A", name: "A" },
              { id: "B", name: "B" },
              { id: "C", name: "C" },
              { id: "D", name: "D" },
              { id: "E", name: "E" },
              { id: "F", name: "F" },
            ]}
          />

          <TextInput source="category_reason" fullWidth />
        </FormTab>

        <FormTab label="التأثيرات">
          <TextInput source="potential_negative" fullWidth multiline />
          <TextInput source="potential_positive" fullWidth multiline />
          <TextInput source="recommendations" fullWidth multiline />
        </FormTab>

        <FormTab label="الحالة">
          <SelectInput
            source="status"
            choices={[
              { id: "draft", name: "draft" },
              { id: "pending", name: "pending" },
              { id: "approved", name: "approved" },
              { id: "rejected", name: "rejected" },
            ]}
          />
        </FormTab>
      </TabbedForm>
    </Edit>
  );
};

export default ScreeningEdit;

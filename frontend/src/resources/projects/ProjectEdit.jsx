import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  DateInput,
  required,
} from "react-admin";

// const projectComponents = [
//   { id: "Infrastructure", name: "بنية تحتية" },
//   { id: "Education", name: "تعليم" },
//   { id: "Health", name: "صحة" },
//   { id: "Livelihood", name: "سبل عيش" },
// ];

const ProjectEdit = (props) => {
  return (
    <Edit {...props}>
      <SimpleForm>
        {/* <TextInput source="id" label="#" disabled /> */}
        <TextInput
          source="title"
          label="عنوان المشروع"
          fullWidth
          validate={[required()]}
        />
        <TextInput
          source="location"
          label="الموقع"
          fullWidth
          validate={[required()]}
        />
        <TextInput
          source="project_component"
          label="المكون"
          fullWidth
          validate={[required()]}
        />
        {/* <SelectInput
          source="project_component"
          label="المكون"
          choices={projectComponents}
          validate={[required()]}
        /> */}
        <DateInput
          source="start_date"
          label="تاريخ البدء"
          validate={[required()]}
        />
        <DateInput
          source="end_date"
          label="تاريخ الانتهاء"
          validate={[required()]}
        />
      </SimpleForm>
    </Edit>
  );
};

export default ProjectEdit;

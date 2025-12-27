import {
  Create,
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

const ProjectCreate = (props) => {
  return (
    <Create {...props}>
      <SimpleForm>
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
          //   choices={projectComponents}
          validate={[required()]}
        />
        <DateInput
          source="start_date"
          label="تاريخ البدء"
          defaultValue={new Date()}
          validate={[required()]}
        />
        <DateInput
          source="end_date"
          label="تاريخ الانتهاء"
          validate={[required()]}
        />
      </SimpleForm>
    </Create>
  );
};

export default ProjectCreate;

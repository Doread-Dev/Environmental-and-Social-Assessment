import {
  List,
  Datagrid,
  TextField,
  EditButton,
  DeleteButton,
  DateField,
  ChipField,
  SearchInput,
  Filter,
  SelectInput,
} from "react-admin";

// const projectComponents = [
//   { id: "Infrastructure", name: "بنية تحتية" },
//   { id: "Education", name: "تعليم" },
//   { id: "Health", name: "صحة" },
//   { id: "Livelihood", name: "سبل عيش" },
// ];

// const ProjectFilter = (props) => (
//   <Filter {...props}>
//     <SearchInput source="q" alwaysOn />
//     <SelectInput
//       source="project_component"
//       choices={projectComponents}
//       label="المكون"
//     />
//   </Filter>
// );

const ProjectList = (props) => {
  return (
    <List
      {...props}
      //   filters={<ProjectFilter />}
      sort={{ field: "start_date", order: "DESC" }}
    >
      <Datagrid rowClick="edit">
        {/* <TextField source="id" label="#" /> */}
        <TextField source="title" label="عنوان المشروع" />
        <TextField source="location" label="الموقع" />
        <ChipField source="project_component" label="المكون" />
        <DateField source="start_date" label="تاريخ البدء" />
        <DateField source="end_date" label="تاريخ الانتهاء" />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export default ProjectList;

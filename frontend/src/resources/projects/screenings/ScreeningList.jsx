import {
  List,
  Datagrid,
  TextField,
  EditButton,
  DeleteButton,
  ChipField,
  ReferenceField,
  FunctionField,
  BooleanField,
  DateField,
  Filter,
  SelectInput,
  ReferenceInput,
} from "react-admin";
import ApproveRejectButtons from "./ApproveRejectButtons.jsx";

const categoryCodes = [
  { id: "A", name: "A - High potential environmental risk" },
  { id: "B", name: "B - Low to moderate environmental risk" },
  { id: "C", name: "C - Negligible environmental risk" },
  { id: "D", name: "D - Emergency cases and initiatives" },
  { id: "E", name: "E - Not enough information." },
  { id: "F", name: "F - Positive Environmental Impact" },
];

const ScreeningFilter = (props) => (
  <Filter {...props}>
    <ReferenceInput
      source="project"
      reference="projects"
      label="المشروع"
      alwaysOn
    />
    <SelectInput
      source="category_code"
      choices={categoryCodes}
      label="رمز التصنيف"
    />
    <SelectInput
      source="status"
      choices={[
        { id: "pending", name: "قيد المراجعة" },
        { id: "approved", name: "مقبول" },
        { id: "rejected", name: "مرفوض" },
      ]}
      label="الحالة"
    />
  </Filter>
);

const ScreeningList = (props) => {
  return (
    <List
      {...props}
      filters={<ScreeningFilter />}
      sort={{ field: "createdAt", order: "DESC" }}
      perPage={25}
    >
      <Datagrid rowClick="show">
        {/* ⭐⭐⭐⭐ استبدل ReferenceField بـ FunctionField ⭐⭐⭐⭐ */}
        <FunctionField
          label="المشروع"
          render={(record) => {
            console.log("📝 Record in FunctionField:", record);

            if (!record.project) {
              return <span style={{ color: "#999" }}>لا يوجد مشروع</span>;
            }

            if (typeof record.project === "object") {
              return (
                record.project.title || record.project.name || "بدون عنوان"
              );
            }

            return (
              <ReferenceField
                record={record}
                source="project"
                reference="projects"
                link="show"
              >
                <TextField source="title" />
              </ReferenceField>
            );
          }}
        />

        <ChipField
          source="category_code"
          label="التصنيف"
          sx={{
            backgroundColor: getCategoryColor,
            color: "white",
            fontWeight: "bold",
          }}
        />

        <FunctionField
          label="سبب التصنيف"
          render={(record) => (
            <span
              style={{
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {record.category_reason}
            </span>
          )}
        />
        <FunctionField
          label="التأثير السلبي"
          render={(record) => (
            <span
              style={{
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {record.potential_negative}
            </span>
          )}
        />

        <FunctionField
          label="التأثير الإيجابي"
          render={(record) => (
            <span
              style={{
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {record.potential_positive}
            </span>
          )}
        />

        <FunctionField
          label="التوصيات"
          render={(record) => (
            <span
              style={{
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {record.recommendations}
            </span>
          )}
        />

        <FunctionField
          label="الحالة"
          render={(record) => (
            <ChipField
              record={record}
              source="status"
              sx={{
                backgroundColor: getStatusColor(record.status),
                color: "white",
                fontWeight: "bold",
              }}
            />
          )}
        />

        <DateField
          source="createdAt"
          label="تاريخ الإنشاء"
          locales="ar-SA"
          showTime
        />

        <EditButton label="تعديل" />
        {/* <DeleteButton label="حذف" /> */}
        <FunctionField
          label="الموافقة"
          render={(record) => <ApproveRejectButtons record={record} />}
        />
      </Datagrid>
    </List>
  );
};

// ألوان التصنيفات
const getCategoryColor = (record) => {
  const colors = {
    A: "#f44336", // أحمر
    B: "#ff9800", // برتقالي
    C: "#4caf50", // أخضر
    D: "#2196f3", // أزرق
    E: "#a814a8ff",
    F: "#09883eff",
  };
  return colors[record.category_code] || "#9e9e9e";
};

const getStatusColor = (status) => {
  const colors = {
    pending: "#ff9800", // برتقالي
    approved: "#4caf50", // أخضر
    rejected: "#f44336", // أحمر
  };
  return colors[status] || "#9e9e9e";
};

export default ScreeningList;

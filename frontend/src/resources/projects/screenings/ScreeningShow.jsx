import {
  Show,
  SimpleShowLayout,
  TextField,
  ReferenceField,
  DateField,
  ChipField,
  TabbedShowLayout,
  Tab,
  RichTextField,
  BooleanField,
  FunctionField,
} from "react-admin";

const getCategoryLabel = (code) => {
  const labels = {
    A: "A - High potential environmental risk",
    B: "B - Low to moderate environmental risk",
    C: "C - Negligible environmental risk",
    D: "D - Emergency cases and initiatives",
    E: "E - Not enough information.",
    F: "F - Positive Environmental Impact",
  };
  return labels[code] || code;
};

const getStatusLabel = (status) => {
  const labels = {
    pending: "قيد المراجعة",
    approved: "مقبول",
    rejected: "مرفوض",
  };
  return labels[status] || status;
};

const ScreeningShow = (props) => {
  return (
    <Show {...props} title="عرض الفحص البيئي">
      <TabbedShowLayout>
        <Tab label="الملخص">
          <ReferenceField source="project" reference="projects" label="المشروع">
            <TextField source="title" />
          </ReferenceField>

          <FunctionField
            label="رمز التصنيف"
            render={(record) => (
              <ChipField
                record={record}
                source="category_code"
                sx={{
                  backgroundColor: getCategoryColor(record.category_code),
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "1rem",
                }}
              />
            )}
          />

          <TextField source="category_reason" label="سبب التصنيف" />

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
                  fontSize: "1rem",
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
          <DateField
            source="updatedAt"
            label="آخر تحديث"
            locales="ar-SA"
            showTime
          />
        </Tab>

        <Tab label="التفاصيل">
          <TextField source="potential_negative" label="التأثيرات السلبية" />
          <TextField source="potential_positive" label="التأثيرات الإيجابية" />
          <RichTextField source="recommendations" label="التوصيات" />
        </Tab>

        <Tab label="الموافقة">
          <BooleanField source="is_approved" label="تمت الموافقة" />
          <DateField
            source="approved_at"
            label="تاريخ الموافقة"
            locales="ar-SA"
          />
          <TextField source="approval_notes" label="ملاحظات الموافقة" />
          <TextField source="approved_by" label="تمت الموافقة من قبل" />
        </Tab>
      </TabbedShowLayout>
    </Show>
  );
};

// نفس الدوال المساعدة من List
const getCategoryColor = (code) => {
  const colors = { A: "#f44336", B: "#ff9800", C: "#4caf50", D: "#2196f3" };
  return colors[code] || "#9e9e9e";
};

const getStatusColor = (status) => {
  const colors = {
    pending: "#ff9800",
    approved: "#4caf50",
    rejected: "#f44336",
  };
  return colors[status] || "#9e9e9e";
};

export default ScreeningShow;

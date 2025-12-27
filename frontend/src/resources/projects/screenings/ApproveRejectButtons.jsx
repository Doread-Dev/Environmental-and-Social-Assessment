import { Button, useNotify, useRefresh } from "react-admin";
import { useDataProvider } from "react-admin";

const ApproveRejectButtons = ({ record }) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();

  const handleApprove = async () => {
    try {
      console.log("✅ Approving screening:", record.id);

      await dataProvider.approveScreening(record.id, "approve");

      notify("تمت الموافقة على الفحص", { type: "success" });
      refresh(); 
    } catch (error) {
      console.error("Approve error:", error);
      notify("فشلت الموافقة: " + error.message, { type: "error" });
    }
  };

  const handleReject = async () => {
    try {
      console.log("❌ Rejecting screening:", record.id);

      await dataProvider.approveScreening(record.id, "reject");

      notify("تم رفض الفحص", { type: "success" });
      refresh(); 
    } catch (error) {
      console.error("Reject error:", error);
      notify("فشل الرفض: " + error.message, { type: "error" });
    }
  };

  if (!record) return null;

  if (record.status === "approved" || record.status === "rejected") {
    return (
      <span style={{ color: "#666", fontSize: "0.9rem" }}>
        {record.status === "approved" ? "✓ مقبول" : "✗ مرفوض"}
      </span>
    );
  }

  if (record.status !== "pending" && record.status !== "draft") {
    return null;
  }

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <Button
        onClick={handleApprove}
        variant="contained"
        color="success"
        size="small"
        sx={{ minWidth: "90px" }}
      >
        ✓ موافقة
      </Button>

      <Button
        onClick={handleReject}
        variant="contained"
        color="error"
        size="small"
        sx={{ minWidth: "90px" }}
      >
        ✗ رفض
      </Button>
    </div>
  );
};

export default ApproveRejectButtons;

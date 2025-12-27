import { useState } from "react";
import { useLogin, useNotify } from "react-admin";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";

const LoginPage = () => {
  const [mode, setMode] = useState("login"); // 'login' أو 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("environmental_specialist");

  const login = useLogin();
  const notify = useNotify();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "login") {
      // تسجيل الدخول
      try {
        await login({ username: email, password });
        notify("تم تسجيل الدخول بنجاح", { type: "success" });
      } catch (error) {
        notify("فشل تسجيل الدخول", { type: "error" });
      }
    } else {
      // تسجيل جديد
      try {
        // هنا تحتاج دالة register من authProvider
        // تحتاج تعدل authProvider وتضيف register function
        const response = await fetch(
          "http://localhost:3000/api/v1/auth/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name,
              email,
              password,
              role,
            }),
          }
        );

        if (response.ok) {
          notify("تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن", {
            type: "success",
          });
          setMode("login");
        } else {
          const error = await response.json();
          notify(error.message || "فشل التسجيل", { type: "error" });
        }
      } catch (error) {
        notify("حدث خطأ في الاتصال", { type: "error" });
      }
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
      }}
    >
      <Card sx={{ minWidth: 350 }}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            نظام إدارة المشاريع البيئية
          </Typography>

          <Tabs
            value={mode}
            onChange={(e, newValue) => setMode(newValue)}
            centered
          >
            <Tab label="تسجيل الدخول" value="login" />
            <Tab label="إنشاء حساب" value="register" />
          </Tabs>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {mode === "register" && (
              <>
                <TextField
                  label="الاسم الكامل"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  margin="normal"
                  required
                />

                <TextField
                  select
                  label="الدور"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  fullWidth
                  margin="normal"
                  SelectProps={{ native: true }}
                  required
                >
                  <option value="environmental_specialist">أخصائي بيئي</option>
                  <option value="program_manager">مدير برنامج</option>
                  <option value="project_manager">مدير مشروع</option>
                </TextField>
              </>
            )}

            <TextField
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              required
            />

            <TextField
              label="كلمة المرور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
            >
              {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
            {mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
            <Button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              color="primary"
              size="small"
            >
              {mode === "login" ? "إنشاء حساب جديد" : "تسجيل الدخول"}
            </Button>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;

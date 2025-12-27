import { httpClient } from "../utils/httpClient";

const authProvider = {
  // تسجيل الدخول
  login: async ({ username, password }) => {
    try {
      const response = await httpClient("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      });

      const { token } = response.json.data;

      // حفظ التوكن في localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("username", username);

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error("فشل تسجيل الدخول. تأكد من البيانات"));
    }
  },

  // تسجيل مستخدم جديد (خاص بـ environmental_specialist)
  register: async (userData) => {
    try {
      const response = await httpClient("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      return Promise.resolve(response.json);
    } catch (error) {
      return Promise.reject(error);
    }
  },

  // تسجيل الخروج
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    return Promise.resolve();
  },

  // التحقق من وجود توكن
  checkAuth: () => {
    const token = localStorage.getItem("token");
    return token ? Promise.resolve() : Promise.reject();
  },

  // التعامل مع الأخطاء
  checkError: (error) => {
    const status = error.status || error.response?.status;

    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      return Promise.reject();
    }

    return Promise.resolve();
  },

  // الحصول على الصلاحيات
  getPermissions: () => {
    // هنا ممكن تضيف منطق لفحص الـ role من التوكن
    return Promise.resolve();
  },

  // الحصول على اسم المستخدم
  getIdentity: () => {
    const username = localStorage.getItem("username");
    return Promise.resolve({
      id: username,
      fullName: username,
      avatar: undefined,
    });
  },
};

export default authProvider;

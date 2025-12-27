import { fetchUtils } from "react-admin";

const API_URL = "http://localhost:3000";

export const httpClient = (url, options = {}) => {
  // جلب التوكن من localStorage
  const token = localStorage.getItem("token");

  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  });

  // إضافة الـ Authorization header إذا موجود token
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // تعديل الرابط ليشمل الـ API_URL
  const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;

  return fetchUtils.fetchJson(fullUrl, {
    ...options,
    headers,
  });
};

# سياسة الأدوار وحماية المسارات (Roles & Route Protection)

## نظرة عامة

نعتمد مصادقة JWT مع هيدر `Authorization: Bearer <token>`. بعد التحقق من التوكن، يتم فحص الدور عبر `requireRole(...)` لحماية المسارات. القواعد أدناه مقترحة للتطبيق على المسارات الحالية.

## تعريف الأدوار

- **environmental_specialist**: صلاحيات كاملة على كل الموارد (CRUD + موافقات + رفع ملفات).
- **program_manager**: يقود العملية البيئية؛ كل عمليات الإنشاء/التعديل/الموافقة على الأدوات، ورفع الملفات.
- **project_manager**: إدارة المشاريع وأدواتها (إنشاء/تعديل)، باستثناء الموافقات النهائية التي تبقى لـ environmental_specialist/program_manager.
- **environmental_focal_point**: تنفيذ/تحديث الأنشطة الميدانية والمراقبة ورفع ملفات مرتبطة؛ قراءة باقي الموارد.
- **viewer**: قراءة فقط لجميع الموارد العامة (لا إنشاء/تعديل/حذف/رفع).

## سياسات المسارات المقترحة

- **Auth**

  - `POST /auth/register`: environmental_specialist فقط (أو يغلق لاحقًا بعد إنشاء أول مستخدم).
  - `POST /auth/login`: مفتوح.

- **Projects**

  - GET: all (viewer وما فوق)
  - POST/PUT/DELETE: environmental_specialist, program_manager, project_manager

- **Screenings**

  - GET: all
  - POST/PUT: environmental_specialist, program_manager, project_manager
  - PATCH approve/reject: environmental_specialist, program_manager

- **Assessments** (ومساراتها الفرعية: methods, consultations, scores, calculate)

  - GET: all
  - POST/PUT: environmental_specialist, program_manager, project_manager
  - PATCH calculate: environmental_specialist, program_manager

- **Monitoring**

  - GET (list/by project): all
  - POST/PUT: environmental_specialist, program_manager, project_manager
  - PATCH quarter: environmental_specialist, program_manager, project_manager, environmental_focal_point

- **ManagementActivity**

  - GET by project: all
  - POST/PUT/DELETE: environmental_specialist, program_manager, project_manager
  - (اختياري) environmental_focal_point: PUT لتحديث التنفيذ الميداني

- **MitigationPlan**

  - GET by project: all
  - POST/PUT/DELETE: environmental_specialist, program_manager
  - (اختياري) project_manager: PUT

- **SEMP (objectives/targets/actions)**

  - GET plan: all
  - POST/PUT (objectives/targets/actions): environmental_specialist, program_manager, project_manager
  - (اختياري) environmental_focal_point: PUT على actions فقط

- **Lookups**

  - GET: all (بدون حماية أو بحماية قراءة فقط)

- **Attachments**
  - GET by id: all
  - POST /attachments (بيانات مرفق بدون ملف): environmental_specialist, program_manager, project_manager
  - POST /attachments/upload (ملف فعلي): environmental_specialist, program_manager, project_manager, environmental_focal_point

## ملاحظات تنفيذية

- أضف `auth` عالميًا ثم `requireRole(...)` لكل مجموعة مسارات حسب الجدول أعلاه.
- احتفظ بالـ `/health` و `/auth/login` (وأي مسار توثيق) دون حماية.
- يمكن تمرير الأدوار كـ مصفوفة، مثال:
  ```js
  router.post(
    "/",
    auth,
    requireRole("environmental_specialist", "program_manager"),
    controller.create
  );
  ```
- في حال لم يُعرّف دور المستخدم في DB، تعامل معه كـ viewer (قراءة فقط).

# دليل الاختبارات والـ API (مرتَّب حسب المراحل)

> جميع الطلبات تحت `http://localhost:3000`. استخدم هيدر `Content-Type: application/json` للطلبات التي تحتوي على جسم، وهيدر `Authorization: Bearer <TOKEN>` لكل المسارات المحمية. ابدأ دائماً بتسجيل الدخول للحصول على التوكن.
>
> **صلاحيات الأدوار (فبراير 2026):** environmental_specialist فقط: Register (بعد أول مستخدم)، approve/reject للـ Screening و Assessment، حذف المشروع. الأدوار الأربعة (env_spec, program_mgr, project_mgr, environmental_focal_point) لإنشاء/تحديث/حذف المحتوى (ما عدا حذف المشروع). viewer: قراءة فقط + GET /users. التفاصيل في نهاية الملف وفي Overview.md.

---

## 0) Auth (أساسي قبل أي طلب محمي)

### POST `/api/v1/auth/register`

- الاستخدام: إنشاء مستخدم جديد. بعد أول مستخدم (environmental_specialist) يصبح المسار محمياً ويتطلب توكن بنفس الدور.
- جسم مثال:

```json
{
  "name": "Admin",
  "email": "Haydara@akdn.com",
  "password": "Passw0rd!",
  "role": "environmental_specialist"
}
```
```json
{
  "name": "Admin 2",
  "email": "admin2@example.com",
  "password": "password123",
  "role": "environmental_specialist"
}
```

- في بوست مان:
  - Method: POST
  - Body: raw JSON كما أعلاه
  - (لهذا الطلب فقط في البداية قد لا تحتاج Authorization؛ بعد أول مستخدم يجب إضافة Bearer admin)

### POST `/api/v1/auth/login`

- الاستخدام: استرجاع توكن JWT.
- جسم مثال:

```json
{ "email": "admin@example.com", "password": "Passw0rd!" }
```

- الناتج: `data.token` استخدمه في هيدر `Authorization: Bearer <token>`.

---

## Users

- GET `/api/v1/users`
  - هيدر: Authorization
  - الأدوار المسموحة: environmental_specialist / program_manager / project_manager / environmental_focal_point / **viewer**
  - يعيد قائمة بجميع المستخدمين (مرتبة تنازلياً بالتاريخ)

---

## 1) Lookups (مرحلة التمهيد، للقراءة)

- GET `/api/v1/lookups/impact-categories`
- GET `/api/v1/lookups/impact-questions`
- GET `/api/v1/lookups/indicators`
- GET `/api/v1/lookups/job-titles`
- بدون توكن أو يمكن استخدام توكن (قراءة فقط).
- في بوست مان: Method GET، لا جسم، يمكن ترك الهيدر بدون Authorization.

---

## 2) المرفقات (Metadata + رفع ملف)

### POST `/api/v1/attachments`

- الاستخدام: إنشاء سجل مرفق (بدون رفع ملف).
- هيدر: Authorization (أدوار: environmental_specialist / program_manager / project_manager / environmental_focal_point)
- جسم مثال:

```json
{
  "entity_type": "project",
  "entity_id": "<PROJECT_ID>",
  "file_name": "report.pdf",
  "file_path": "/tmp/report.pdf",
  "file_type": "application/pdf",
  "file_size": 12345
}
```

### POST `/api/v1/attachments/upload`

- الاستخدام: رفع ملف فعلي عبر multipart/form-data.
- هيدر: Authorization (أدوار: environmental_specialist / program_manager / project_manager / environmental_focal_point)
- في بوست مان:
  - Method: POST
  - Authorization: Bearer <token>
  - Body: form-data
    - Key: `file` (Type: File) اختر ملفاً من جهازك.
    - Key: `entity_type` (Text) مثال: `project`
    - Key: `entity_id` (Text) ضع معرف الكيان.

### GET `/api/v1/attachments/:id`

- الاستخدام: قراءة بيانات مرفق (قراءة مفتوحة).
- في بوست مان: Method GET، لا جسم.

---

## 3) Projects (الأساس لكل الأدوات)

### POST `/api/v1/projects`

- هيدر: Authorization (أدوار: environmental_specialist / program_manager / project_manager / environmental_focal_point)
- جسم مثال:

```json
{
  "title": "School Rehab",
  "location": "Aleppo",
  "start_date": "2024-01-01",
  "end_date": "2024-03-01",
  "project_component": "Infrastructure"
}
```

### GET `/api/v1/projects` | GET `/api/v1/projects/:id`

- قراءة (مفتوحة).

### PUT `/api/v1/projects/:id`

- هيدر: Authorization (نفس أدوار POST: environmental_specialist / program_manager / project_manager / environmental_focal_point).
- جسم جزئي أو كامل (مثلاً تحديث `project_component`).

### DELETE `/api/v1/projects/:id`

- هيدر: Authorization (**environmental_specialist** فقط).
- الاستخدام: حذف مشروع مع **جميع البيانات المرتبطة به** من قاعدة البيانات والملفات من نظام الملفات
- **⚠️ تحذير**: هذه العملية لا يمكن التراجع عنها (irreversible)

**البيانات التي يتم حذفها تلقائياً**:
- ✅ **Assessment Data**: جميع التقييمات البيئية المرتبطة + طرق التقييم + الاستشارات المجتمعية + نتائج التأثير
- ✅ **Screening Data**: جميع عمليات الفرز المرتبطة
- ✅ **SEMP Data**: جميع الأهداف والـ Targets والـ Actions المرتبطة
- ✅ **Management & Mitigation**: جميع أنشطة الإدارة وخطط التخفيف
- ✅ **Monitoring Data**: جميع سجلات المراقبة
- ✅ **Attachments**: جميع المرفقات المرتبطة (من قاعدة البيانات + الملفات الفعلية من مجلد `uploads`)

**ملاحظات**:
- العملية تحذف جميع البيانات المرتبطة بشكل تلقائي
- الملفات المرفقة تُحذف من نظام الملفات (مجلد `uploads`)
- إذا فشل حذف ملف واحد، العملية تستمر ولا تتوقف
- الناتج: `204 No Content` عند النجاح

---

## 4) Tool 1: Screening

### POST `/api/v1/screenings`

- هيدر: Authorization (environmental_specialist / program_manager / project_manager / environmental_focal_point)
- جسم مثال:

```json
{
  "project": "<PROJECT_ID>",
  "category_code": "A",
  "category_reason": "High environmental sensitivity",
  "potential_negative": "Dust",
  "potential_positive": "Job creation"
}
```

### GET `/api/v1/screenings` | `/api/v1/screenings/:id` | `/api/v1/screenings/project/:projectId`

- قراءة (مفتوحة).

### PUT `/api/v1/screenings/:id`

- نفس أدوار POST (environmental_specialist / program_manager / project_manager / environmental_focal_point).

### PATCH `/api/v1/screenings/:id/approve`

- هيدر: Authorization (**environmental_specialist** فقط).
- جسم (اختياري):

```json
{
  "recommendations": "نص التوصيات"
}
```

### PATCH `/api/v1/screenings/:id/reject`

- هيدر: Authorization (**environmental_specialist** فقط).
- جسم (اختياري):

```json
{
  "reject_reason": "سبب الرفض - معلومات غير كافية"
}
```

**ملاحظات**:
- `reject_reason` اختياري (يمكن إرسال body فارغ)
- `reject_by` يتم تعبئته تلقائياً من المستخدم الحالي (`req.user._id`)
- في حالة الرفض، يتم حفظ `status = "rejected"` مع `reject_by` و `reject_reason` (إن وُجد)

---

## 5) Tool 2: Assessment

### POST `/api/v1/assessments`

- هيدر: Authorization (environmental_specialist / program_manager / project_manager / environmental_focal_point)
- جسم مثال:

```json
{
  "project": "<PROJECT_ID>",
  "project_activity": "Water pipeline",
  "description": "Assess environmental impact",
  "environmental_setting": "Urban",
  "legal_requirements": "Local EIA rules"
}
```

**ملاحظات**:
- `officer` يتم تعيينه تلقائياً من المستخدم الحالي (`req.user._id`) ولا يمكن تمريره من الـ client

### POST `/api/v1/assessments/:id/methods`

```json
{ "method_type": "survey", "details": "Household survey" }
```

### POST `/api/v1/assessments/:id/consultations` "عدلت"

```json
{
  "type": "community_meeting",
  "participants": "Local reps",
  "notes": "Concerns about noise"
}
```

### POST `/api/v1/assessments/:id/scores`

- جسم مثال (مصفوفة):

```json
[{ "question": "<IMPACT_QUESTION_ID>", "level": "medium", "note": "Some dust" }]
```

### PATCH `/api/v1/assessments/:id/calculate`

- هيدر: Authorization (environmental_specialist / program_manager / project_manager / environmental_focal_point).
- لا جسم مطلوب؛ يحسب عدد النتائج لكل مستوى (`total_project_score`) ويحدد مستوى التأثير الكلي (`total_project_impact`) حسب أولوية الفئات.
  - المنطق:
    - يتم عدّ عدد الإجابات في كل مستوى (negligible, low, medium, high, not_applicable).
    - يتم اختيار `total_project_impact` حسب أولوية المستويات (بغضّ النظر عن عدد النقاط):
      - إذا وُجد أي سؤال بمستوى `high` → النتيجة = `high`
      - وإلا إذا وُجد `medium` → النتيجة = `medium`
      - وإلا إذا وُجد `low` → النتيجة = `low`
      - وإلا إذا وُجد `negligible` → النتيجة = `negligible`
      - وإلا إذا وُجد فقط `not_applicable` → النتيجة = `not_applicable`
  - مثال ناتج مختصر:

```json
{
  "total_project_score": {
    "negligible": 50,
    "low": 40,
    "medium": 20,
    "high": 5,
    "not_applicable": 70
  },
  "total_project_impact": "high"
}
```

### PATCH `/api/v1/assessments/:id/approve` 

- هيدر: Authorization (**environmental_specialist** فقط).
- جسم (لـ approve اختياري):

```json
{
  "recommendations": "نص التوصيات"
}
```

- ملاحظة: في حالة approve، يمكن إرسال recommendations.

### PATCH `/api/v1/assessments/:id/reject`

- هيدر: Authorization (**environmental_specialist** فقط).
- جسم (اختياري):

```json
{
  "reject_reason": "سبب الرفض - معلومات غير كافية"
}
```

**ملاحظات**:
- `reject_reason` اختياري (يمكن إرسال body فارغ)
- `reject_by` يتم تعبئته تلقائياً من المستخدم الحالي (`req.user._id`)
- في حالة الرفض، يتم حفظ `status = "rejected"` مع `reject_by` و `reject_reason` (إن وُجد)

### GET `/api/v1/assessments` | `/:id` | `/project/:projectId`

- قراءة (مفتوحة).

### PUT `/api/v1/assessments/:id`

- نفس أدوار POST (environmental_specialist / program_manager / project_manager / environmental_focal_point). وينطبق نفس الأدوار على POST /:id/methods، PUT /:id/methods، POST /:id/consultations، PUT /:id/consultations، POST /:id/scores.

---

## 6) Tool 5: Monitoring

### GET `/api/v1/monitoring`

- الاستخدام: الحصول على قائمة بجميع سجلات المراقبة.
- في بوست مان: Method GET، لا جسم، لا يحتاج Authorization (مفتوح للقراءة).

### GET `/api/v1/monitoring/:id`

- الاستخدام: الحصول على سجل مراقبة واحد بواسطة ID.
- في بوست مان: Method GET، لا جسم، لا يحتاج Authorization (مفتوح للقراءة).
- مثال: `GET /api/v1/monitoring/507f1f77bcf86cd799439011`
- الناتج: سجل واحد مع populate للعلاقات (project, indicator, responsible).

### GET `/api/v1/monitoring/project/:projectId`

- الاستخدام: الحصول على جميع سجلات المراقبة لمشروع معين.
- في بوست مان: Method GET، لا جسم، لا يحتاج Authorization (مفتوح للقراءة).

### POST `/api/v1/monitoring`

- هيدر: Authorization (environmental_specialist / program_manager / project_manager / environmental_focal_point)
- جسم مثال:

```json
{
  "project": "<PROJECT_ID>",
  "indicator": "<INDICATOR_ID>",
  "scores": {
    "baseline": "قيمة يدوية",
    "Q1": "قيمة يدوية",
    "Q2": "قيمة يدوية",
    "Q3": "قيمة يدوية",
    "Q4": "قيمة يدوية"
  },
  "total": "قيمة يدوية",
  "final_assessment": "تقييم نهائي نص حر",
  "ranking": "medium"
}
```

**ملاحظات**:

- جميع القيم في `scores` هي نصية (String) ويدوية
- `total` هو نص يدوي (لا يتم حسابه تلقائياً)
- `final_assessment` هو نص حر (لا enum)
- `ranking` هو enum محدد لكن يتم إرساله يدوياً

### PATCH `/api/v1/monitoring/:id/quarter/:q`

- أدوار: environmental_specialist / program_manager / project_manager / environmental_focal_point
- جسم:

```json
{ "value": "قيمة نصية يدوية" }
```

**ملاحظات**:

- `value` نص (String) وليس رقم
- لا يتم حساب `total` تلقائياً بعد تحديث quarter
- يجب تحديث `total` يدوياً عبر PUT endpoint إذا لزم الأمر

### GET `/api/v1/monitoring` | `/api/v1/monitoring/:id` | `/project/:projectId`

- قراءة (مفتوحة).

### PUT `/api/v1/monitoring/:id`

- نفس أدوار POST (environmental_specialist / program_manager / project_manager / environmental_focal_point).

---

## 7) Tool 3: Management Activities

### POST `/api/v1/management`

- هيدر: Authorization (environmental_specialist / program_manager / project_manager / environmental_focal_point)
- جسم مثال:

```json
{
  "project": "<PROJECT_ID>",
  "activity_description": "Dust suppression",
  "potential_impact": "Potential dust impact near houses",
  "recommended_actions": "Water spraying",
  "monitoring_requirements": "Weekly check",
  "responsible": "<USER_ID>"
}
```

### GET `/api/v1/management/project/:projectId`

- قراءة (مفتوحة).

### PUT `/api/v1/management/:id` | DELETE `/api/v1/management/:id`

- أدوار كما في POST (environmental_specialist / program_manager / project_manager / environmental_focal_point).

---

## 8) Tool 4: Mitigation Plan

### POST `/api/v1/mitigation`

- هيدر: Authorization (environmental_specialist / program_manager / project_manager / environmental_focal_point)
- جسم مثال:

```json
{
  "project": "<PROJECT_ID>",
  "output_description": "Waste management",
  "potential_impact_and_significance": "Possible soil contamination, medium significance",
  "mitigation_and_enhancement_measures": "Segregation, labeling, safe disposal",
  "schedule": "Before: train staff; During: daily checks; After: monthly audit",
  "responsible": "<USER_ID>"
}
```

### GET `/api/v1/mitigation/project/:projectId`

- قراءة (مفتوحة).

### PUT `/api/v1/mitigation/:id` | DELETE `/api/v1/mitigation/:id`

- أدوار كما في POST (environmental_specialist / program_manager / project_manager / environmental_focal_point).

---

## 9) SEMP

### POST `/api/v1/semp/objectives`

- هيدر: Authorization (environmental_specialist / program_manager / project_manager / environmental_focal_point)
- جسم مثال:

```json
{ "project": "<PROJECT_ID>", "objective_text": "Reduce dust impact" }
```

### POST `/api/v1/semp/targets`

```json
{ "objective": "<OBJECTIVE_ID>", "target_text": "Weekly suppression" }
```

### POST `/api/v1/semp/actions`

```json
{
  "target": "<TARGET_ID>",
  "action_text": "Spray water daily",
  "responsible": "<USER_ID>"
}
```

### PUT `/api/v1/semp/objectives/:id` | `/targets/:id` | `/actions/:id`

- نفس الأدوار (environmental_specialist / program_manager / project_manager / environmental_focal_point).

### GET `/api/v1/semp/project/:projectId`

- قراءة (مفتوحة).

---

## 10) Reports (Phase 4)

### GET `/api/v1/reports/dashboard`

- هيدر: Authorization (أي دور بما فيهم viewer).
- لا جسم. يعيد إحصاءات إجمالية.

### GET `/api/v1/reports/export`

- هيدر: Authorization (environmental_specialist / program_manager).
- بارامترات استعلام:
  - `type`: `projects` أو `monitoring`
  - `format`: `csv` أو `excel` أو `pdf`
  - `projectId`: اختياري عند التصدير لـ monitoring
- في بوست مان:
  - Method: GET
  - Params: مثال `type=projects`, `format=excel`
  - Authorization: Bearer <admin/program_manager>
- الناتج: ملف يتم تنزيله؛ في Postman يمكنك اختيار “Send and Download”.

---

## 11) Tool 1→4 Workflow (ملاحظات عملية للاختبار في Postman)

1. Auth: سجل/سجّل الدخول، خذ التوكن، خزنّه كـ Bearer Token في بيئة Postman.
2. أنشئ Project.
3. Screening: POST ثم (اختياري) PATCH approve/reject.
4. Assessment: POST ثم add methods/consultations/scores ثم PATCH calculate.
5. Management/Mitigation/SEMP: أنشئ حسب الحاجة على نفس المشروع.
6. Monitoring: أنشئ سجلاً ثم PATCH الربع السنوي بقيمة نصية (value: string).
7. Attachments: جرّب upload بملف صغير (Text/PNG).
8. Reports: جرّب dashboard بقراءة، ثم export بكل الصيغ لكل من projects و monitoring.

> **تذكير بصلاحيات الأدوار (Roles & Permissions):**
>
> - **environmental_specialist فقط:** تسجيل مستخدم جديد (Register بعد وجود مستخدم)، الموافقة/الرفض على Screening و Assessment، حذف المشروع (DELETE project).
> - **الأدوار الأربعة (env_spec, program_mgr, project_mgr, environmental_focal_point):** إنشاء/تحديث/حذف للمشاريع (ما عدا حذف المشروع)، Screenings، Assessments، Management، Mitigation، SEMP، المرفقات (إنشاء + رفع).
> - **viewer:** القراءة فقط (جميع GET) + قائمة المستخدمين GET /users؛ لا create/update/delete.
> - **التصدير:** GET /reports/export محصور بـ `environmental_specialist` و `program_manager`.
> - **Dashboard:** GET /reports/dashboard مسموح لجميع الأدوار بما فيها viewer.

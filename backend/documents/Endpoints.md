# دليل الاختبارات والـ API (مرتَّب حسب المراحل)

> جميع الطلبات تحت `http://localhost:3000`. استخدم هيدر `Content-Type: application/json` للطلبات التي تحتوي على جسم، وهيدر `Authorization: Bearer <TOKEN>` لكل المسارات المحمية. ابدأ دائماً بتسجيل الدخول للحصول على التوكن.

---

## 0) Auth (أساسي قبل أي طلب محمي)

### POST `/api/v1/auth/register`

- الاستخدام: إنشاء مستخدم جديد. بعد أول مستخدم (environmental_specialist) يصبح المسار محمياً ويتطلب توكن بنفس الدور.
- جسم مثال:

```json
{
  "name": "Admin Auto",
  "email": "admin@example.com",
  "password": "Passw0rd!",
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

## 1) Lookups (مرحلة التمهيد، للقراءة)

- GET `/api/v1/impact-categories`
- GET `/api/v1/impact-questions`
- GET `/api/v1/indicators`
- GET `/api/v1/job-titles`
- بدون توكن أو يمكن استخدام توكن (قراءة فقط).
- في بوست مان: Method GET، لا جسم، يمكن ترك الهيدر بدون Authorization.

---

## 2) المرفقات (Metadata + رفع ملف)

### POST `/api/v1/attachments`

- الاستخدام: إنشاء سجل مرفق (بدون رفع ملف).
- هيدر: Authorization (أدوار: env_specialist / program_manager / project_manager)
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
- هيدر: Authorization (أدوار: env_specialist / program_manager / project_manager / environmental_focal_point)
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

- هيدر: Authorization (أدوار: env_specialist / program_manager / project_manager)
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

- هيدر: Authorization كما في POST.
- جسم جزئي أو كامل (مثلاً تحديث `project_component`).

### DELETE `/api/v1/projects/:id`

- هيدر: Authorization كما في POST.

---

## 4) Tool 1: Screening

### POST `/api/v1/screenings`

- هيدر: Authorization (env_specialist / program_manager / project_manager)
- جسم مثال:

```json
{
  "project": "<PROJECT_ID>",
  "category_code": "A",
  "category_reason": "High environmental sensitivity",
  "potential_negative": "Dust",
  "potential_positive": "Job creation",
  "recommendations": "Use dust control"
}
```

### GET `/api/v1/screenings` | `/api/v1/screenings/:id` | `/api/v1/projects/:projectId/screening`

- قراءة (مفتوحة).

### PUT `/api/v1/screenings/:id`

- نفس أدوار POST.

### PATCH `/api/v1/screenings/:id/approve` | `/reject`

- هيدر: Authorization (env_specialist / program_manager).
- لا جسم مطلوب.

---

## 5) Tool 2: Assessment

### POST `/api/v1/assessments`

- هيدر: Authorization (env_specialist / program_manager / project_manager)
- جسم مثال:

```json
{
  "project": "<PROJECT_ID>",
  "officer": "<USER_ID>",
  "project_activity": "Water pipeline",
  "description": "Assess environmental impact",
  "environmental_setting": "Urban",
  "legal_requirements": "Local EIA rules"
}
```

### POST `/api/v1/assessments/:id/methods`

```json
{ "method_type": "survey", "details": "Household survey" }
```

### POST `/api/v1/assessments/:id/consultations`

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

- هيدر: Authorization (env_specialist / program_manager).
- لا جسم مطلوب؛ يحسب total و impact level.

### GET `/api/v1/assessments` | `/:id` | `/project/:projectId`

- قراءة (مفتوحة).

### PUT `/api/v1/assessments/:id`

- نفس أدوار POST.

---

## 6) Tool 5: Monitoring

### POST `/api/v1/monitoring`

- هيدر: Authorization (env_specialist / program_manager / project_manager)
- جسم مثال:

```json
{
  "project": "<PROJECT_ID>",
  "indicator": "<INDICATOR_ID>",
  "scores": { "baseline": 1, "Q1": 2 },
  "final_assessment": "medium",
  "ranking": 2
}
```

### PATCH `/api/v1/monitoring/:id/quarter/:q`

- أدوار: env_specialist / program_manager / project_manager / environmental_focal_point
- جسم:

```json
{ "value": 3 }
```

### GET `/api/v1/monitoring` | `/project/:projectId`

- قراءة (مفتوحة).

### PUT `/api/v1/monitoring/:id`

- نفس أدوار POST.

---

## 7) Tool 3: Management Activities

### POST `/api/v1/management`

- هيدر: Authorization (env_specialist / program_manager / project_manager)
- جسم مثال:

```json
{
  "project": "<PROJECT_ID>",
  "activity_description": "Dust suppression",
  "potential_impact": "low",
  "recommended_actions": "Water spraying",
  "monitoring_requirements": "Weekly check",
  "responsible": "<USER_ID>"
}
```

### GET `/api/v1/projects/:projectId/management`

- قراءة (مفتوحة).

### PUT `/api/v1/management/:id` | DELETE `/api/v1/management/:id`

- أدوار كما في POST.

---

## 8) Tool 4: Mitigation Plan

### POST `/api/v1/mitigation`

- هيدر: Authorization (env_specialist / program_manager)
- جسم مثال:

```json
{
  "project": "<PROJECT_ID>",
  "output_description": "Waste management",
  "impact_level": "medium",
  "mitigation_measures": "Segregation and proper disposal",
  "responsible": "<USER_ID>"
}
```

### GET `/api/v1/projects/:projectId/mitigation`

- قراءة (مفتوحة).

### PUT `/api/v1/mitigation/:id` | DELETE `/api/v1/mitigation/:id`

- أدوار كما في POST.

---

## 9) SEMP (Tool 3/4 الهرمي)

### POST `/api/v1/semp/objectives`

- هيدر: Authorization (env_specialist / program_manager / project_manager)
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

- نفس الأدوار.

### GET `/api/v1/projects/:projectId/semp`

- قراءة (مفتوحة).

---

## 10) Reports (Phase 4)

### GET `/api/v1/reports/dashboard`

- هيدر: Authorization (أي دور بما فيهم viewer).
- لا جسم. يعيد إحصاءات إجمالية.

### GET `/api/v1/reports/export`

- هيدر: Authorization (env_specialist / program_manager).
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
6. Monitoring: أنشئ سجلاً ثم PATCH الربع السنوي بقيمة رقمية.
7. Attachments: جرّب upload بملف صغير (Text/PNG).
8. Reports: جرّب dashboard بقراءة، ثم export بكل الصيغ لكل من projects و monitoring.

> تذكير بالأدوار الحرجة:
>
> - التسجيل بعد أول مستخدم: يتطلب `environmental_specialist`.
> - التصدير: `environmental_specialist` أو `program_manager`.
> - تحديث ربع Monitoring: يشمل `environmental_focal_point`.
> - رفع الملفات: focal مسموح في `/attachments/upload`، إنشاء سجل مرفق محصور في الأدوار الثلاثة العليا.

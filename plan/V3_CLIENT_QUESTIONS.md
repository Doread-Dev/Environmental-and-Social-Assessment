# v3 — Questions for the client and their IT

**What this is:** the list the owner takes to the client (AKF) and the client's IT before the v3
technology stage. It comes from [V3_STRUCTURE_DRAFT.md](V3_STRUCTURE_DRAFT.md) §7.1 (same numbers).
Each question is written in English (for the client) and Arabic (for the owner), with why we ask.
Write the answer under each question, then copy the answers into the draft.

**Nothing in the v3 structure waits for these answers** — the structure supports every answer.
They decide the technology, the order of delivery and what is switched on.

**ما هي هذه الورقة:** قائمة الأسئلة التي يأخذها المالك إلى العميل (AKF) وقسم الـ IT عنده قبل مرحلة
التقنية في v3. كل سؤال بالإنكليزية (للعميل) وبالعربية (للمالك) مع سبب السؤال. يُكتب الجواب تحت كل
سؤال ثم يُنقل إلى المسودة.

---

## A. For the IT team — أسئلة لقسم الـ IT

### C1. Staff accounts and sign-in — حسابات الموظفين وتسجيل الدخول

**EN:** How do staff sign in at work? Which identity provider is behind the `akdn.org` accounts (for
example Microsoft Entra ID / Active Directory, Google Workspace, another)? Is there one directory
for all of AKDN, or one per agency or country? Is multi-factor sign-in required? Can a new
application be registered for single sign-on, and who approves it?

**AR:** كيف يسجّل الموظفون الدخول في عملهم؟ ما هو النظام الذي يدير حسابات `akdn.org` (مثلاً Microsoft
Entra ID / Active Directory أو Google Workspace أو غيره)؟ هل يوجد دليل واحد لكل AKDN أم دليل لكل
وكالة أو دولة؟ هل التحقق بخطوتين مطلوب؟ هل يمكن تسجيل تطبيق جديد للدخول الموحّد، ومن يوافق عليه؟

**Why — السبب:** it decides how people sign in to ESMS and how their accounts are created.
يحدّد طريقة دخول الناس إلى ESMS وكيف تُنشأ حساباتهم.

**Answer — الجواب:**

### C2. The global AKF platform — منصة AKF العالمية

**EN:** What is the global platform (its name, a product or a custom build, its technology)? How does
it open other tools: a plain link, single sign-on, an embedded frame, an API? Can a link open a
specific page inside ESMS? Does it already have a list of projects, countries or users that ESMS
should read instead of typing again?

**AR:** ما هي المنصة العالمية (اسمها، منتج جاهز أم مبنية خصيصاً، تقنيتها)؟ كيف تفتح الأدوات الأخرى: رابط
عادي، دخول موحّد، إطار مضمَّن، أم API؟ هل يمكن لرابط أن يفتح صفحة محدّدة داخل ESMS؟ هل فيها قائمة
مشاريع أو دول أو مستخدمين يجب أن يقرأها ESMS بدل إدخالها من جديد؟

**Why — السبب:** it decides the entry from the platform and whether ESMS exchanges data with it.
يحدّد طريقة الدخول من المنصة وهل يتبادل ESMS البيانات معها.

**Answer — الجواب:**

### C3. Databases and servers the IT team runs — قواعد البيانات والخوادم التي يشغّلها الـ IT

**EN:** Which database systems does IT run and support today (SQL Server, PostgreSQL, MySQL,
other)? Which server systems (Windows Server, Linux)? Own servers, a cloud (which one), or both?
Are containers (Docker) allowed? Is there a standard IT expects new applications to follow?

**AR:** ما هي أنظمة قواعد البيانات التي يشغّلها ويدعمها الـ IT اليوم (SQL Server، PostgreSQL، MySQL،
غيرها)؟ ما هي أنظمة الخوادم (Windows Server، Linux)؟ خوادم خاصة، سحابة (أيّ سحابة)، أم الاثنان؟ هل
الحاويات (Docker) مسموحة؟ هل يوجد معيار يتوقع الـ IT أن تتبعه التطبيقات الجديدة؟

**Why — السبب:** a stack their IT already operates is easier to host, back up and approve.
التقنية التي يشغّلها الـ IT أصلاً أسهل في الاستضافة والنسخ الاحتياطي والموافقة.

**Answer — الجواب:**

### C4. Where data may live — أين يُسمح بحفظ البيانات

**EN:** Will ESMS run on one central hosting for all countries? Are there countries whose data must
stay inside the country? Does Syria stay on its own server or join the central one?

**AR:** هل سيعمل ESMS على استضافة مركزية واحدة لكل الدول؟ هل توجد دول يجب أن تبقى بياناتها داخلها؟ هل
تبقى سوريا على خادمها الخاص أم تنضم إلى الخادم المركزي؟

**Why — السبب:** it decides which countries are central and which get their own installation.
يحدّد أيّ الدول تكون على الخادم المركزي وأيّها تأخذ تنصيباً خاصاً.

**Answer — الجواب:**

### C5. Links to other systems — الربط مع أنظمة أخرى

**EN:** Must ESMS exchange data with other systems (project lists, reporting or BI tools, document
storage such as SharePoint)? In which direction, and how often?

**AR:** هل يجب أن يتبادل ESMS البيانات مع أنظمة أخرى (قوائم المشاريع، أدوات التقارير أو BI، تخزين
الوثائق مثل SharePoint)؟ بأيّ اتجاه وكم مرة؟

**Why — السبب:** it decides the integration layer (APIs, imports, exports).
يحدّد طبقة الربط (APIs، استيراد، تصدير).

**Answer — الجواب:**

### C7. Email — البريد الإلكتروني

**EN:** Can the ESMS server send email (notifications, invitations, password reset)? Through which
mail service, and from which address?

**AR:** هل يستطيع خادم ESMS إرسال بريد إلكتروني (إشعارات، دعوات، استرجاع كلمة السر)؟ عبر أيّ خدمة
بريد ومن أيّ عنوان؟

**Why — السبب:** email notifications, invitations for people outside the organisation, password
reset. إشعارات البريد، دعوة الأشخاص من خارج المنظمة، استرجاع كلمة السر.

**Answer — الجواب:**

---

## B. For the client (the programme side) — أسئلة للعميل (جهة البرامج)

### C11. What is needed first — ما المطلوب أولاً

**EN:** Which comes first: activities inside projects (for Syria), or the global roll-out (other
countries, entry from the global platform)?

**AR:** أيّهما أولاً: الأنشطة داخل المشاريع (لسوريا)، أم التوسّع العالمي (دول أخرى، الدخول من المنصة
العالمية)؟

**Why — السبب:** it sets the order of the delivery stages (v3.0 / v3.1).
يحدّد ترتيب محطات التسليم.

**Answer — الجواب:**

### C6. Countries, users, dates — الدول والمستخدمون والمواعيد

**EN:** Which countries are expected to use ESMS first, roughly how many users in each, and when?

**AR:** ما هي الدول المتوقع أن تستخدم ESMS أولاً، كم مستخدماً تقريباً في كل دولة، ومتى؟

**Why — السبب:** sizing and the order of the roll-out. تقدير الحجم وترتيب التوسّع.

**Answer — الجواب:**

### C8. Organisation levels — مستويات المنظمة

**EN:** Besides the country office, are other levels in use: regions grouping several countries,
field offices inside a country, other AKDN agencies besides AKF? Should access be given at any of
these levels?

**AR:** غير مكتب الدولة، هل توجد مستويات أخرى مستخدمة: أقاليم تضم عدة دول، مكاتب ميدانية داخل الدولة،
وكالات AKDN أخرى غير AKF؟ وهل يجب أن تُعطى الصلاحيات على أيّ من هذه المستويات؟

**Why — السبب:** each level can become a place where access is given. v3 builds the country office;
others are added without a rebuild. كل مستوى يمكن أن تُعطى عليه صلاحيات؛ v3 يبني مكتب الدولة والباقي
يُضاف دون إعادة بناء.

**Answer — الجواب:**

### C9. Tools for activities, and new tools — أدوات الأنشطة والأدوات الجديدة

**EN:** An activity will go through Tools 1–5 like a project. Should activities also have the SEMP
Plan and Stakeholder Awareness? Are other tools wanted, for a project, an activity, an office or
the whole organisation?

**AR:** النشاط سيمرّ بالأدوات 1–5 مثل المشروع. هل يجب أن يكون للأنشطة أيضاً SEMP Plan و Stakeholder
Awareness؟ هل توجد أدوات أخرى مطلوبة، للمشروع أو النشاط أو المكتب أو المنظمة كلها؟

**Why — السبب:** tools are switched on per level by configuration; a new tool is one new module.
الأدوات تُفعَّل لكل مستوى بالإعداد؛ والأداة الجديدة موديول واحد.

**Answer — الجواب:**

### C12. Kinds of activities — أنواع الأنشطة

**EN:** Should an activity carry a kind from a list (for example construction, training,
distribution)? This is a descriptive label only; the risk rating always comes from the activity's
own screening and assessment.

**AR:** هل يجب أن يحمل النشاط نوعاً من قائمة (مثلاً بناء، تدريب، توزيع)؟ هذا وصف فقط؛ تقييم الخطورة
يأتي دائماً من الـ screening والـ assessment الخاصَّين بالنشاط.

**Why — السبب:** it switches on an optional managed list; no structural change.
يفعّل قائمة اختيارية تُدار من التطبيق؛ دون تغيير في البنية.

**Answer — الجواب:**

### C13. Reporting year and languages — سنة التقارير واللغات

**EN:** Do all offices report by calendar year (GHG Emissions, Environmental Data, Stakeholder
Awareness), or does any office use another reporting year? Which languages are needed beyond
English and Arabic, and who provides the translation of the questions and indicators?

**AR:** هل تعتمد كل المكاتب السنة الميلادية في التقارير (GHG Emissions، Environmental Data،
Stakeholder Awareness)، أم يستخدم مكتب ما سنة تقارير مختلفة؟ ما اللغات المطلوبة غير الإنكليزية
والعربية، ومن يقدّم ترجمة الأسئلة والمؤشرات؟

**Why — السبب:** periods of the yearly reports; languages are added as data.
فترات التقارير السنوية؛ واللغات تُضاف كبيانات.

**Answer — الجواب:**

### C14. Keeping and removing data — حفظ البيانات وحذفها

**EN:** Is there a policy on how long project records must be kept after a project closes, and on
personal data of staff and outside people (names, emails)? Who may ask for data to be removed?

**AR:** هل توجد سياسة تحدّد مدة حفظ سجلات المشروع بعد إغلاقه، وسياسة للبيانات الشخصية للموظفين
والأشخاص من خارج المنظمة (أسماء، بريد إلكتروني)؟ من يحقّ له طلب حذف بيانات؟

**Why — السبب:** v3 never removes data by itself (except Deleted items after 30 days); a retention
rule would be added as a setting. v3 لا يحذف بيانات من تلقاء نفسه (ما عدا العناصر المحذوفة بعد 30
يوماً)؛ وقاعدة الحفظ تُضاف كإعداد.

**Answer — الجواب:**

### C10. Features not discussed yet — الميزات التي لم تُناقش بعد

**EN:** Which features does the client have in mind for the next version that have not been
discussed yet?

**AR:** ما هي الميزات التي يفكّر بها العميل للنسخة القادمة ولم تُناقش بعد؟

**Why — السبب:** they may shape the structure, so they are needed before the technology stage.
قد تؤثّر على البنية، لذلك نحتاجها قبل مرحلة التقنية.

**Answer — الجواب:**

---

## C. Added by the technology stage — أسئلة أضافتها مرحلة التقنية

These five come from the architecture records in [v3-architecture/](v3-architecture/README.md).
C15–C17 are for the IT team; C18 is for whoever handles maps at the client; C19 is for the
client's management together with IT.

### C15. Who maintains the code — من يصون الكود على المدى الطويل

**EN:** After delivery, who maintains and extends the application: the supplier, or your IT team?
Does IT require a specific platform or programming language for applications it hosts or takes
over (for example Microsoft .NET)?

**AR:** بعد التسليم، من يصون التطبيق ويطوّره: المورّد أم فريق الـ IT عندكم؟ هل يشترط الـ IT منصة أو
لغة برمجة معيّنة للتطبيقات التي يستضيفها أو يستلمها (مثلاً Microsoft .NET)؟

**Why — السبب:** it decides the programming language of the server (ADR-003). The hosting is not
affected. يحدّد لغة برمجة الخادم؛ ولا يؤثّر على الاستضافة.

**Answer — الجواب:**

### C16. Security requirements — متطلبات الأمان

**EN:** Which security standards or policies must a new application meet? Is a security assessment
or penetration test required before go-live, and who performs it? How is this kind of data
classified in your organisation?

**AR:** ما هي معايير أو سياسات الأمان التي يجب أن يلتزم بها أي تطبيق جديد؟ هل يُشترط تقييم أمني أو
اختبار اختراق قبل التشغيل، ومن ينفّذه؟ كيف يُصنَّف هذا النوع من البيانات عندكم؟

**Why — السبب:** it sets the security level we build and prove (ADR-018).
يحدّد مستوى الأمان الذي نبنيه ونثبته.

**Answer — الجواب:**

### C17. Availability and recovery — التوفّر والاسترجاع

**EN:** In which hours must ESMS be available in each office? How long may it be down in the worst
case, and how much recent work may be lost (minutes, hours)? Who should be contacted when the
service is down?

**AR:** في أيّ ساعات يجب أن يكون ESMS متاحاً في كل مكتب؟ كم يُسمح أن يتوقف في أسوأ الأحوال، وكم من
العمل الأخير يُسمح بفقدانه (دقائق، ساعات)؟ من يجب إبلاغه عند توقف الخدمة؟

**Why — السبب:** it sizes the hosting and the backups (ADR-016, ADR-017).
يحدّد حجم الاستضافة والنسخ الاحتياطي.

**Answer — الجواب:**

### C18. Maps and boundaries — الخرائط والحدود الإدارية

**EN:** Does your organisation have a mapping (GIS) team or a map service (for example ArcGIS)?
Which administrative boundaries (countries, governorates, districts) do you use officially in your
maps and reports?

**AR:** هل عند المنظمة فريق خرائط (GIS) أو خدمة خرائط (مثلاً ArcGIS)؟ ما هي الحدود الإدارية (دول،
محافظات، مناطق) التي تعتمدونها رسمياً في خرائطكم وتقاريركم؟

**Why — السبب:** project locations are stored with their country and area; the boundaries used must
be the ones the organisation accepts (ADR-021). مواقع المشاريع تُحفظ مع الدولة والمنطقة؛ ويجب أن
تكون الحدود المستخدمة هي المعتمدة عند المنظمة.

**Answer — الجواب:**

### C19. Countries that keep their data inside — الدول التي تُبقي بياناتها داخلها

**EN:** For a country that must host ESMS on its own server, or whose data may not leave it:
(1) Will that server be reachable over the internet, or only inside a closed network?
(2) May head-office staff open that country's system from abroad to view its projects?
(3) May a summary without names be sent to the central system for global reports — for example
project code, status, risk category, dates and area, with no people's names, no free text and no
documents? Or only totals? Or nothing?
(4) Who will host, back up and update that country's server?

**AR:** بخصوص دولة يجب أن تستضيف ESMS على خادمها الخاص، أو لا يُسمح لبياناتها بالخروج منها:
(1) هل سيكون ذلك الخادم متاحاً عبر الإنترنت، أم داخل شبكة مغلقة فقط؟
(2) هل يُسمح لموظفي المكتب الرئيسي بفتح نظام تلك الدولة من الخارج للاطلاع على مشاريعها؟
(3) هل يُسمح بإرسال ملخّص بلا أسماء إلى النظام المركزي للتقارير العالمية — مثلاً رمز المشروع، حالته،
فئة الخطورة، التواريخ والمنطقة، دون أسماء أشخاص ودون نصوص حرّة ودون وثائق؟ أم الأعداد الإجمالية
فقط؟ أم لا شيء؟
(4) من سيستضيف خادم تلك الدولة ويأخذ نسخه الاحتياطية ويحدّثه؟

**Why — السبب:** such a country still gets the same settings as everyone and can still appear in
global reports; these answers decide how much of that is switched on (ADR-023).
هذه الدولة تأخذ الإعدادات نفسها مثل الجميع ويمكن أن تظهر في التقارير العالمية؛ وهذه الأجوبة تحدّد
مقدار ما يُفعَّل من ذلك.

**Answer — الجواب:**

# Meeting sheet — IT of the Syria office

Asked in the meeting, in Arabic. These are about **the server in Syria** (the v2 / v2.5 install).
The full technical background for IT is in the [IT checklist](../../deploy/IT-CHECKLIST.md) that
ships in the release; S1–S10 are its §9 in short. What he cannot answer on the spot, he sends
later. The map of all questions is in [README.md](README.md).

---

## A. The server — الخادم

### S1. Operating system — نظام التشغيل

**EN:** Windows Server (which edition) or Linux (Ubuntu, which release)?
**AR:** الخادم Windows Server (أيّ إصدار) أم Linux (Ubuntu، أيّ إصدار)؟
**Why:** Windows is tested for real; the Linux path must be tested before install day.
**Answer — الجواب:**

### S2. Size — الحجم

**EN:** How many cores, how much RAM, which disks? (Needed: 2–4 cores, 4–8 GB RAM, 40–60 GB.)
**AR:** كم نواة، كم RAM، وما الأقراص؟ (المطلوب: 2–4 أنوية، 4–8 GB RAM، 40–60 GB.)
**Answer — الجواب:**

### S3. Backups — النسخ الاحتياطي

**EN:** Is there a second disk or a network share for the nightly backup? Who checks it? Is there a
copy outside the building?
**AR:** هل يوجد قرص ثانٍ أو مجلد شبكة للنسخة الاحتياطية الليلية؟ من يتحقق منها؟ هل توجد نسخة خارج
المبنى؟
**Answer — الجواب:**

### S4. Name and address — الاسم والعنوان

**EN:** Which name will users type to open ESMS, and who adds it to DNS?
**AR:** ما الاسم الذي سيكتبه المستخدمون لفتح ESMS، ومن يضيفه إلى DNS؟
**Answer — الجواب:**

### S5. HTTPS certificate — شهادة HTTPS

**EN:** Do you have an internal certificate authority (usual on a Windows domain)? If not, we make a
self-signed certificate and install it once on each user's PC.
**AR:** هل عندكم جهة إصدار شهادات داخلية (عادةً مع Windows domain)؟ إن لم توجد نصنع شهادة موقَّعة ذاتياً
وتُثبَّت مرة واحدة على كل حاسوب.
**Why:** without it, passwords travel unencrypted on the network.
**Answer — الجواب:**

### S6. Network — الشبكة

**EN:** Can every user's PC reach the server on port 443? Is there a proxy? Do users outside the
office (field, home) need access, and how (VPN)?
**AR:** هل يصل كل حاسوب إلى الخادم على المنفذ 443؟ هل يوجد proxy؟ هل يحتاج مستخدمون خارج المكتب
(الميدان، البيت) الدخول، وكيف (VPN)؟
**Answer — الجواب:**

### S7. Antivirus — مضاد الفيروسات

**EN:** Which product, and can the database folder be excluded from scanning?
**AR:** ما المنتج المستخدم، وهل يمكن استثناء مجلد قاعدة البيانات من الفحص؟
**Answer — الجواب:**

### S8. Access for the install — صلاحيات التنصيب

**EN:** Who has administrator access on the server? May the owner connect remotely (RDP / SSH /
AnyDesk) on install day and for updates?
**AR:** من يملك صلاحية المدير على الخادم؟ هل يمكن أن أتصل عن بُعد (RDP / SSH / AnyDesk) يوم التنصيب
وعند التحديثات؟
**Answer — الجواب:**

### S9. Domain — الدومين

**EN:** Is the server in a Windows domain?
**AR:** هل الخادم ضمن Windows domain؟
**Answer — الجواب:**

### S10. Install day — يوم التنصيب

**EN:** Which day suits? Is 02:00 free for the nightly backup? Does the server have internet on
install day (it is not needed; installers come on a USB stick)?
**AR:** أيّ يوم يناسب؟ هل الساعة 02:00 فارغة للنسخة الليلية؟ هل للخادم إنترنت يوم التنصيب (غير مطلوب؛
الملفات تأتي على USB)؟
**Answer — الجواب:**

---

## B. Email, accounts, hours — البريد، الحسابات، ساعات العمل

### S11. Email from the server — إرسال البريد من الخادم (C7)

**EN:** Can the server send email (notifications, password reset)? Through which mail server, and
from which address?
**AR:** هل يستطيع الخادم إرسال بريد (إشعارات، استرجاع كلمة السر)؟ عبر أيّ خادم بريد، ومن أيّ عنوان؟
**Why:** v2.5 notifications stay inside the app until this is answered.
**Answer — الجواب:**

### S12. Staff accounts — حسابات الموظفين (C1, local part)

**EN:** Which accounts do Syria staff use at work (Microsoft 365, a local Windows domain, other)?
Is the email `@akdn.org` or another? Is there a second sign-in step (code on the phone)?
**AR:** ما الحسابات التي يستخدمها موظفو سوريا في العمل (Microsoft 365، دومين محلي، غيره)؟ هل الإيميل
`@akdn.org` أم غيره؟ هل يوجد تحقق بخطوة ثانية (رمز على الهاتف)?
**Why:** the full answer comes from the global platform team; this tells us what Syria has today.
**Answer — الجواب:**

### S13. Working hours and who is called — ساعات العمل ومن نبلّغ (C17, Syria)

**EN:** In which hours is ESMS used? Who do we call when the server is down, and who restarts it?
**AR:** في أيّ ساعات يُستخدم ESMS؟ من نبلّغ عند توقف الخادم، ومن يعيد تشغيله؟
**Answer — الجواب:**

---

## C. Only if the central server will be in Syria — فقط إذا كان الخادم المركزي في سوريا

### S14. Hosting other countries — استضافة دول أخرى

**EN:** If offices in other countries open ESMS on this server: is there a fixed public address and
a domain name, how fast and how stable is the internet line, is there power backup (UPS,
generator), who watches the server outside working hours, and may a foreign office reach it at all
(firewall, policy)?
**AR:** إذا فتحت مكاتب دول أخرى ESMS على هذا الخادم: هل يوجد عنوان عام ثابت واسم نطاق، ما سرعة خط
الإنترنت واستقراره، هل توجد طاقة احتياطية (UPS، مولّدة)، من يراقب الخادم خارج الدوام، وهل يُسمح أصلاً
لمكتب خارجي بالوصول إليه (جدار ناري، سياسة)؟
**Why:** a central server must be reachable and stable for every country, all day.
**Answer — الجواب:**

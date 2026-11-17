# ESMS version 3 — questions for the team of the global platform

> Owner's note (delete before sending): this is the file to send by email, through the head of the
> environment department (question E2). English only. Copy it into a Word or PDF file, or paste it
> into the email. The numbers in brackets are our internal question numbers; the map is in
> [README.md](README.md). Answers come back to the main chat and into
> [V3_CLIENT_QUESTIONS.md](../V3_CLIENT_QUESTIONS.md).

---

**Subject:** ESMS version 3 — technical questions before we build the link to the global platform

Dear colleagues,

ESMS (Environmental and Social Management System) is the application the Syria office uses for the
environmental and social due diligence of its projects: screening, assessment, management and
mitigation plans, and monitoring. Version 2 is finished and is being installed on the Syria
office's server.

We are now planning **version 3**, and the decision is that it serves the **whole organisation**,
not Syria alone: each country office works on its own projects, head office sees across offices,
and staff open ESMS **from the global platform** with a button or link.

To build it the right way for your environment, we need facts that only your team has. Short
answers are enough; "not decided yet" is also a useful answer. Where a document already describes
it (a standard, a policy, an onboarding guide for new applications), a copy of the document is the
best answer.

Thank you for your time.

---

## 1. Contact and process

**1.1 (G1)** Who is our contact for technical questions (name, role, email)? Is there a formal
process for connecting a new application to the platform, and who approves it?

**1.2 (G2)** Is there a test environment of the platform and of the sign-in where we can try the
link before go-live?

**1.3 (G4)** What do you need from us (documents, a security questionnaire, a demo, source code
review)?

## 2. Sign-in and accounts

**2.1 (C1)** How do staff sign in at work? Which identity provider is behind the staff accounts
(for example Microsoft Entra ID / Active Directory, Google Workspace, another)?

**2.2 (C1)** Is there one directory for the whole organisation, or one per agency or country?

**2.3 (C1)** Is multi-factor sign-in required for staff?

**2.4 (C1)** Can a new application be registered for single sign-on (OpenID Connect or SAML)? Can
user accounts and groups be provisioned to it automatically (SCIM)?

**2.5 (C1)** People outside the organisation (consultants, partners, donors' reviewers) sometimes
need read access. Do they get a guest account in your directory, or must the application keep its
own accounts for them?

## 3. The global platform

**3.1 (C2)** What is the platform: its name, a product or a custom build, its technology?

**3.2 (C2)** How does it open other tools today: a plain link, single sign-on, an embedded frame,
an API? Can a link open a specific page inside ESMS (for example one project)?

**3.3 (C2, C5)** Does the platform hold lists that ESMS should read instead of typing them again:
countries and offices, projects, staff and their roles? If so, how can they be read (API, export
file), and how often do they change?

**3.4 (C5)** Should ESMS send anything back to the platform or to other systems (project status,
risk category, reports)? Which systems: reporting or BI tools, document storage such as
SharePoint, others? In which direction, and how often?

**3.5 (G3)** Are there rules for the look of applications opened from the platform (logo, colours,
naming, a shared header)?

## 4. Hosting and operation

**4.1 (C3)** Which server systems does your IT run and support (Windows Server, Linux)? Own
servers, a cloud (which one), or both? Are containers (Docker, Kubernetes) allowed?

**4.2 (C3)** Which database systems does your IT run and support (SQL Server, PostgreSQL, MySQL,
others)?

**4.3 (C3)** Is there a standard that new applications must follow (architecture, hosting,
logging, backups)?

**4.4 (C4)** Where should the central ESMS run: at head office, in a cloud, or on a country
office's server (the Syria office's server has been suggested)? Who decides this?

**4.5 (C4)** Are there countries whose data must stay inside the country?

**4.6 (C19)** For such a country, which hosts ESMS on its own server:
(a) will that server be reachable over the internet, or only inside a closed network;
(b) may head-office staff open that country's system from abroad;
(c) may a summary without names be sent to the central system for global reports (project code,
status, risk category, dates and area; no people's names, no free text, no documents), or only
totals, or nothing;
(d) who hosts, backs up and updates that server?

**4.7 (C7)** Can the application send email (notifications, invitations, password reset)? Through
which mail service, and from which address?

**4.8 (C17)** In which hours must the application be available? How long may it be down in the
worst case, and how much recent work may be lost (minutes, hours)? Who is contacted when it is
down?

**4.9 (C15)** After delivery, who maintains and extends the application: the supplier or your IT
team? Does IT require a specific platform or programming language for applications it hosts or
takes over (for example Microsoft .NET)?

## 5. Security and data

**5.1 (C16)** Which security standards or policies must a new application meet? Is a security
assessment or a penetration test required before go-live, and who performs it?

**5.2 (C16)** How is this kind of data classified (project assessments, staff names and emails,
uploaded project documents)?

**5.3 (C14)** Is there a policy on how long project records are kept after a project closes, and on
personal data of staff and outside people? Who may ask for data to be removed?

## 6. About the organisation

Asked here in case the country office cannot answer.

**6.1 (C6)** Which countries are expected to use ESMS first, roughly how many users in each, and
when?

**6.2 (C8)** Besides the country office, which levels are in use: regions grouping several
countries, field offices inside a country, other agencies? Should access be given at those levels?

**6.3 (C13)** Do all offices report by calendar year? Which languages are needed besides English
and Arabic, and who provides the translations?

**6.4 (C18)** Is there a mapping (GIS) team or a map service (for example ArcGIS)? Which
administrative boundaries are used officially in maps and reports?

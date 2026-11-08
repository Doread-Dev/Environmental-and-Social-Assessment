---
id: your-role
---

# Your role

Every account has one role, chosen by the administrator. Your role decides which buttons you see:
a button you may not use is simply not shown. In v2 every role can open every project; there is
no "my projects only".

This part describes what your role does.

<a id="role-users" data-requires="manage_users"></a>
## Looking after the system and its users

As an administrator you look after the system and its people:

- Create accounts, give each one a role and a job title, change roles, deactivate and reactivate
  people, and reset forgotten passwords. See [users](10-administration.md#users).
- Keep at least two active administrator accounts. ESMS refuses to deactivate the last active
  administrator or to give them another role.
- Permanently delete archived projects. See
  [permanent delete](04-projects.md#project-purge).
- Read the **Activity log**: who deleted, archived, restored or replaced what, and every user
  change. See [the Activity log](10-administration.md#activity-log).

Where: **Settings** (left menu, bottom), tabs **Users & projects** and **Activity log**.

<a id="role-review" data-requires="approve"></a>
## Reviewing the work

You are a reviewer. You check the work of the project teams and decide:

- Approve or reject a submitted screening (Tool 1) and a submitted assessment (Tool 2). To approve
  you write recommendations; to reject you give a reason. See
  [Tool 1 review](05-tool-1-screening.md#screening-review) and
  [Tool 2 review](06-tool-2-assessment.md#assessment-review).
- You may approve your own work: ESMS does not need a second person.

<a id="role-projects-admin" data-requires="archive_project"></a>
## Archiving and deleting projects

You archive and restore projects, and delete a project that has nothing approved yet. See
[archive and restore](04-projects.md#project-archive) and [delete](04-projects.md#project-delete).
Where: **Settings** → **Projects Management**.

<a id="role-library" data-requires="manage_library"></a>
## Keeping the Library

You upload the organisation's guidance PDFs, choose where they appear, and replace or delete them.
See [keep the Library](09-library-and-guidance.md#library-manage).

<a id="role-project-work" data-requires="edit"></a>
## Doing the project work

You do the project work:

- Create a project and keep its details up to date. See [Projects](04-projects.md).
- Fill in Tool 1 (Screening), save drafts, and submit it for review.
- When the screening is approved, fill in Tool 2 (Assessment) and submit it.
- When the assessment is approved, fill in Tools 3 and 4 (the management activities and the
  mitigation plan). They are saved, not submitted.
- When Tools 3 and 4 are complete, record monitoring data in Tool 5 every quarter.
- If your work is rejected, read the reason, correct it and submit it again.
- Upload and delete the project's documents in its **Documents** page.
- Export to Excel: each tool, and the whole project as one workbook.

<a id="role-reading" data-unless="edit"></a>
## Reading the projects

Your account reads. It is for people who follow the projects without changing them.

- Open the **Dashboard**, the **Projects** list and any project.
- Read every tool. Buttons such as **View Assessment**, **View Tool →** and **View Data** take you
  to the pages.
- Open and download the project's **Documents** and the **Library** documents.

Your account cannot create or change anything, upload files or export to Excel. If you need an
Excel file, ask a colleague who works on the project.

<a id="role-overview" data-requires="manage_users"></a>
## Which role to give: who does what

When you create a user, give the role that matches the person's work:

| Task | Roles |
|---|---|
| Create a project, edit its details, fill in, save and submit the tools, upload documents, export | Administrator, Environmental Specialist, Program Manager, Project Manager, Environmental Focal Point |
| Approve or reject Tools 1 and 2, archive, restore and delete projects, keep the Library | Environmental Specialist, Administrator |
| Users, permanent deletion, the Activity log | Administrator |
| Read everything | every role, Viewer included |

The Program Manager, Project Manager and Environmental Focal Point roles have the same rights
today; their names tell who the person is in the organisation. The **Viewer** reads only and does
not export.

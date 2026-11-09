---
id: administration
requires: delete_project
---

# Settings and administration

**Settings** is at the bottom of the left menu (and in the menu under your name).

<a id="settings-page"></a>
## The Settings page

Its first tab (**Projects**, or **Users & projects**) holds **Projects Management**: every project
with the buttons to archive, restore and delete it. How to use them: see
[archive and restore](04-projects.md#project-archive) and [delete](04-projects.md#project-delete).

<a id="users" data-requires="manage_users"></a>
## Users

**Settings** → **Users & projects** → **Users Management**. The table lists each user's **Name**
(with "(you)" next to your own), **Email**, **Role** and **Status** (**Active** or **Inactive**).
**Password change pending** means the user has not chosen their own password yet.

Filters: the search box, **Active users** / **Inactive users** / **All users**, and the role.

There is no public sign-up: every account is created here. Which role to give: see
[who does what](03-your-role.md#role-overview).

### Create a user

1. Press **Add User**.
2. Fill in **Name**, **Email** (used to sign in; it cannot be changed later), **Role** and, if you
   like, **Job title**. Use the person's work email.
3. Press **Create User**.
4. The dialog **Temporary password** shows the new password once. Press **Copy**, give it to the
   person in a safe way (in person or by phone, not in a group chat), then press **Done**.

At their first sign-in the person must choose their own password (see
[first sign-in](02-signing-in.md#first-password)). If the temporary password gets lost, reset it.

### Edit a user or change their role

1. Press the pencil icon in the user's row. The dialog **Edit User** opens.
2. Change the **Name**, the **Role** or the **Job title** (the email stays).
3. Press **Save Changes**.

A role change takes effect at once. It is written in the Activity log, with the old and the new
role.

### Reset a password

When someone forgot their password:

1. Press the key icon in their row. The dialog **Reset password** asks first.
2. Press **Reset Password**. Their old password stops working at once.
3. Give them the new **Temporary password** as above. They choose a new one at their next sign-in.

The reset is written in the Activity log. ESMS never shows anyone's own password, and you cannot
type one for them.

### Deactivate and reactivate

People are never deleted, so that their name stays on the work they did. When someone leaves:

1. Press the person icon with a stroke in their row. The dialog **Deactivate user** asks first.
2. Press **Deactivate**. They are signed out at once and cannot sign in until reactivated.

To let them back in, show **Inactive users**, and press the person icon with a tick in their row:
they are reactivated at once.

Both are written in the Activity log.

### The last administrator

ESMS always keeps at least one active administrator. It refuses to deactivate the last active
administrator ("Cannot deactivate the last active admin") or to give them another role ("Cannot
change the role of the last active admin"). Create a second administrator first.

Keep two administrator accounts at all times, so that one can reset the other's password. An
administrator who forgets their password asks another administrator to reset it. If there is no
other administrator, IT can reset it on the server (see the install guides in `deploy/`).

<a id="activity-log" data-requires="read_audit_log"></a>
## The Activity log

**Settings** → **Activity log**: who did which critical action, and when. Nobody can change or
delete its entries, and they stay after a project is deleted or a user is deactivated.

What it records:

- projects: deleted, permanently deleted, archived, restored;
- project files: deleted;
- the Library: a PDF replaced, a document deleted;
- Tools 3 and 4: rows removed by a save;
- users: created, role changed, deactivated, reactivated, password reset.

What it does not record: creating and editing data, submissions, approvals and rejections (the
tools themselves show who submitted, approved or rejected), uploads, and sign-ins.

How to use it:

- **All actions** (the filter) shows one kind of action, or one group (projects, files, library,
  SEMP rows, users and access).
- Each row shows the **Date**, **Who** did it, the **Action**, the **Project** and the **Target**
  (the file, document or user concerned).
- The arrow at the start of a row (**Show details**) opens what was recorded: for example the
  deleted project's summary, the removed rows, or the old and new role.

---
id: projects
---

# Projects

A project is one development project that goes through the environmental and social review. Each
project has one screening, one assessment, one management plan (Tools 3 and 4) and one set of
monitoring data, plus its own documents.

<a id="project-create" data-requires="create_project"></a>
## Create a project

1. **Projects** → **Create New Project** (or **New Project** on the Dashboard).
2. Fill in every field:
   - **Project Title**
   - **Project Location**: a city, a region or coordinates.
   - **Start Date** and **End Date**. The end date cannot be before the start date; a project of
     one day (same start and end) is fine.
   - **Project Component / Activity Description**: the main activities, buildings or
     interventions.
3. Press **Save Project**. The project's overview opens.

**Cancel** goes back to the project list. If you typed something, ESMS asks whether to save it
first (see [unsaved changes](11-everyday-situations.md#unsaved-changes)).

Arabic text is fine in every field.

<a id="project-overview"></a>
## The project overview

**Project Overview** is the first page of a project. It shows:

- the title, the project's ID, its status and its dates;
- a progress line through the four steps;
- **Risk Level** (the category from the screening), **Activities** (the number of rows in
  Tool 3) and **Timeframe** (the duration);
- a green card with the next step, for example "Start Screening", "Pending Approval",
  "Revise Assessment" or "Start Monitoring", with a button that opens that tool
  (**Open Tool** and its number);
- the project's details (location, component, dates).

<a id="project-edit" data-requires="edit"></a>
## Edit the project's details

1. On the overview, press **Edit Project**.
2. Change the fields. All are required. The end date is called **End Date (Estimated)** here.
3. Press **Save Changes**.

The project's details stay editable at every stage, even after approvals, until the project is
archived.

<a id="project-documents"></a>
## Documents

Every project has a **Documents** page (in the project's left menu). It holds the project's own
files, grouped by tool: **Screening – Tool 1**, **Assessment – Tool 2**, **Management activities –
Tool 3**, **Mitigation plan – Tool 4**, **Monitoring – Tool 5** and **Other**. (The
organisation's guidance is not here but in the [Library](09-library-and-guidance.md).)

Click a PDF to read it inside ESMS; the viewer has **Download** and a close button. Other files
(Word, Excel…) download when you click them. The download icon next to each file downloads it.

<a id="project-documents-edit" data-requires="edit"></a>
## Upload and delete documents

Upload:

1. Press **Upload** in the section the file belongs to.
2. Choose one or more files. The blue box **Uploading files** at the top lists the allowed types
   (PDF, Word, Excel, PowerPoint and their OpenDocument forms) and the maximum size per file
   (10 MB unless IT changed it).
3. ESMS confirms each upload; a file that is refused shows why (wrong type, too large, empty).

Delete: the bin icon next to the file → **Delete file** asks first. A deleted file is gone for
everyone and cannot be recovered.

Files of an archived project can be opened and downloaded, not uploaded or deleted.

<a id="project-export" data-requires="export"></a>
## Export to Excel

Exports are in the official AKF layout.

- One tool: the **Export Excel** button on that tool's page (top bar), see each tool's part.
- The whole project: on the overview, the **Project workbook** bar right under the project's title
  → **Export project workbook**. One
  Excel file with a sheet for each tool that has data. It is available once Tool 1 has been
  started.

Each sheet's printed footer shows that tool's status and the date of the export; the file name
carries them too. An export always contains what is saved: if a page has changes that are not
saved yet, ESMS first asks **You have unsaved changes** with **Save and export** or **Cancel**.

<a id="project-archived"></a>
## Archived projects

An archived project is kept read-only and taken out of the project list:

- it is listed only under **Archived projects**;
- every page shows the yellow notice **Archived project — read only**, with who archived it and
  when;
- it can be opened and read, but nothing in it can be changed, not even its documents.

<a id="project-archive" data-requires="archive_project"></a>
## Archive and restore

Archive finished or stopped projects, and any project with approved work that should no longer
appear in the list.

Archive:

1. **Settings** → **Projects** (the administrator: **Users & projects**).
2. In **Projects Management**, find the project (the search box helps).
3. Press **Archive** in its row. The dialog **Archive project** asks you to confirm.

Restore: **Projects Management** → switch the list to **Archived projects** → **Restore** →
confirm in **Restore project**. The project is back in the list and can be edited again, exactly
as it was.

Both are written in the Activity log.

<a id="project-delete" data-requires="delete_project"></a>
## Delete a project

**Delete** removes a project with all its data and files, for good. It is only possible while
neither the screening nor the assessment is approved. Once something is approved, the **Delete**
button disappears: archive the project instead.

1. **Projects Management** → **Delete** in the project's row.
2. **Delete project** asks: "Are you sure…? This action cannot be undone." Press **Delete**.

The deletion is written in the Activity log.

<a id="project-purge" data-requires="purge_project"></a>
## Permanent delete

Only an archived project can be permanently deleted. It removes the project with everything in it,
approved work and files included.

1. Archive the project first.
2. **Projects Management** → **Archived projects** → **Delete permanently**.
3. Read the dialog carefully, then press **Delete permanently**.

This cannot be undone. The Activity log keeps a summary of what was deleted, even though the
project itself is gone.

# Questions to the client — who is asked what

**What this folder is:** every open question we have for the client, sorted by **who can answer
it**. The owner has three contacts, so there are three sheets:

| Sheet | Who | How | When |
|---|---|---|---|
| [MEETING_ENVIRONMENT_HEAD.md](MEETING_ENVIRONMENT_HEAD.md) | the head of the environment department, Syria (our only regular contact) | asked in the meeting | the coming meeting |
| [MEETING_SYRIA_IT.md](MEETING_SYRIA_IT.md) | the IT person of the Syria office | asked in the same meeting; what he cannot answer on the spot he sends later | the coming meeting |
| [GLOBAL_PLATFORM_TEAM.md](GLOBAL_PLATFORM_TEAM.md) | the team that runs the organisation's global platform (head-office IT) | **a file sent by email.** We have no direct contact: the head of the environment department forwards it | agreed in the meeting, sent right after |

**بالعربي:** هذا المجلد يجمع كل أسئلتنا للعميل، مرتّبة حسب **مين بيقدر يجاوب**. في الاجتماع نسأل رئيس
قسم البيئة و IT سوريا من ورقتَيهما. الأسئلة التقنية عن المنصة العالمية لا يعرفها أحد منهما، فهي في
ملف واحد بالإنكليزية يُرسل بالإيميل لفريق المنصة العالمية عن طريق رئيس قسم البيئة.

## The plan for the meeting

1. With the head of the environment department: go through his sheet (what the organisation wants
   from the global version, what comes first, the Syria go-live).
2. With the Syria IT: go through his sheet (the Syria server, for the v2 / v2.5 install).
3. Agree the hand-over of the third file: "I will send you one file; please forward it to the team
   of the global platform and ask them to answer in writing." Ask for the name and email of the
   person there (question E2).
4. After the meeting: write the answers into the sheets (the **Answer** line under each question),
   send the global file, and bring the sheets to the main chat.

## Where each answer goes

Question numbers never change. `C` numbers are the ones the v3 structure draft and the
architecture records already use ([V3_CLIENT_QUESTIONS.md](../V3_CLIENT_QUESTIONS.md) keeps their
full bilingual text); `E`, `S` and `G` numbers are new in these sheets.

| # | Question (short) | Ask | Fallback | The answer is needed by |
|---|---|---|---|---|
| C1 | How staff sign in; identity provider; multi-factor | Global team | Syria IT (S12: what Syria staff use) | v3 ADR-008 |
| C2 | What the global platform is and how it opens other tools | Global team | Environment head (E1: what he sees as a user) | v3 ADR-007, 008, 015 |
| C3 | Databases, servers, cloud, containers IT supports | Global team | Syria IT (S1–S2 for Syria's own server) | v3 ADR-002, 003, 004, 013, 016 |
| C4 | Where data may live; central or per country; Syria's place | Environment head (E4) + Global team | — | v3 ADR-002, 013, 016, 023 |
| C5 | Links to other systems | Global team | — | v3 ADR-007, 015, 022 |
| C6 | Countries, users, dates | Environment head (E5) | Global team | v3 sizing, delivery order |
| C7 | Email from the server | Syria IT (S11, for Syria) + Global team (central) | — | v2.5 phase 18 (email is out until answered), v3 ADR-014 |
| C8 | Organisation levels | Environment head (E6) | Global team | v3 structure §2, §3 |
| C9 | Tools on activities; new tools | Environment head (E8) | — | v3 ADR-012 |
| C10 | Features not discussed yet | Environment head (E9) | — | v3 structure |
| C11 | What comes first: activities or the global roll-out | Environment head (E7) | — | v3 delivery stages (§8.1) |
| C12 | Kinds of activities | Environment head (E8) | — | v3 catalogue switch |
| C13 | Reporting year; languages; who translates | Environment head (E10) | Global team | v3 periods, languages |
| C14 | Keeping and removing data | Global team | Environment head (E10) | v3 ADR-011, 018 |
| C15 | Who maintains the code; mandated platform or language | Global team | — | v3 ADR-003 (C# / .NET stays switchable until answered) |
| C16 | Security requirements, penetration test | Global team | — | v3 ADR-008, 018 |
| C17 | Availability, recovery, who is called | Global team | Syria IT (S13, for Syria) | v3 ADR-016, 017 |
| C18 | Maps and boundaries | Global team | Environment head (E10) | v3 ADR-021 |
| C19 | Countries that keep their data inside | Global team | Environment head (E4) | v3 ADR-023 |
| E1–E3 | The global platform as he knows it; the contact there; who decided "global" and when | Environment head | — | everything in the global file |
| E11–E16 | Syria go-live: v2 now or v2.5, first administrator, users and roles, existing projects, library documents, training | Environment head | — | the Syria install (v2 / v2.5) |
| S1–S10 | The Syria server: system, size, backups, name, certificate, network, antivirus, access, domain, install day | Syria IT | — | the Syria install; DECISIONS "Open items"; [IT checklist](../../deploy/IT-CHECKLIST.md) §9 |
| S14 | Could the Syria server host other countries (internet line, power, public address, staff) | Syria IT | Global team | v3 ADR-016, 023 (only if the central server is in Syria) |
| G1–G4 | Contact and process, a test environment, look and naming, what they need from us | Global team | — | v3 ADR-015, delivery |

## Rules

- Nothing in v2.5 waits for these answers except email notifications (phase 18).
- Nothing in the v3 **structure** waits for them; they confirm or change the v3 **technology**
  records (each record says which answer would change it).
- A question answered here is marked answered in this table, and the answer is copied to the
  record that needs it.

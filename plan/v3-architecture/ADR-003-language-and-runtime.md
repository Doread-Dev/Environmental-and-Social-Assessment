# ADR-003: Server platform — C# on .NET; the interface stays TypeScript

**Status:** Proposed (revised 2026-11-17 after the owner's review) — **to confirm with the client's
answers (C3, C15)**
**Date:** 2026-11-17
**Deciders:** the owner; the client's IT only if they set a standard or will maintain the code
**Draft:** §6.1 · **Related:** ADR-004, ADR-005, ADR-008, ADR-012, ADR-018

**In plain words:** the server part of v3 is written in C# on Microsoft's .NET platform, not in
JavaScript/TypeScript. The screens stay in TypeScript (ADR-005). The first version of this record
recommended TypeScript everywhere; that recommendation leaned on staying close to today's code. The
owner removed that weight ("choose the best for this kind of system, not the nearest"), and on
merit alone the answer changes.

## Why the first recommendation was revised

The first version gave real weight to two things: reusing today's JavaScript rules and tests, and
one language across server and interface. Looked at again without the wish to stay near the
current code:

- the rules and tests are **rewritten in any case** — the database, the module structure and the
  API all change, so the tests are carried over as *cases* (inputs and expected outcomes), which
  is language-independent work;
- one shared language matters when both sides run the same rules. Here they must not: the server
  owns every rule and the interface only shows state (D30). What the two sides share is a
  *contract*, and a generated contract works across languages (ADR-007).

What remains is the question an architect would ask with a free hand: which platform is the
soundest base for a long-lived, rule-heavy, audited business system with organisation sign-in.

## Context

- The system: small load, heavy on rules, permissions, history and sign-in; internet-facing;
  several countries; expected life of ten years or more; maintained by a small group.
- The security-critical parts are sign-in, sessions, password handling, a second sign-in step,
  protection against forged requests, and authorization. Mistakes there are the costly ones.
- ADR-001 needs walls between modules that hold without relying on discipline.
- ADR-018 sets a written security baseline that includes control of third-party code.
- Some countries may host their own installation, possibly on Windows servers (ADR-023).
- Who maintains the code in the long run, and whether the client's IT mandates a platform, is not
  known (C15).

## Decision

**C# on the current long-term-support release of .NET (ASP.NET Core) for the `api`, `worker` and
`migrate` roles.** The interface is React in TypeScript (ADR-005). The two meet at the generated
API contract (ADR-007). End-to-end tests stay in Playwright.

## Options considered

| | A. JavaScript as today | B. TypeScript on Node.js | **C. C# on .NET** | D. Java or Kotlin on Spring | E. Python, Go, others |
|---|---|---|---|---|---|
| Sign-in, sessions, local accounts, second step, forgery protection | Assembled from separate libraries | Assembled from separate libraries | **First-party, one vendor, one release line** | First-party (Spring Security), very mature | Assembled |
| Module walls | Convention + lint | Convention + lint (framework helps) | **Enforced by the compiler** (one assembly per module, internal types) + architecture tests | Enforced (modules, Spring Modulith verifies them) | Varies |
| Type safety for a rule-heavy domain | None | Good; types vanish at run time | Strong, present at run time, null-safety checked | Strong | Varies |
| Third-party code inside the running server | Hundreds of small packages | Hundreds of small packages | **A handful beyond the vendor's own** | Moderate | Varies |
| Support rhythm | Yearly, about 30 months each | Yearly, about 30 months each | Every two years, three years each, smooth upgrades | Long | Varies |
| Database, queue, Excel, OpenAPI, telemetry | Mature | Mature | Mature, mostly first-party | Mature | Varies |
| Runs natively on Windows servers as well as in Linux containers | Yes | Yes | **Yes, first-class on both** | Yes | Varies |
| One language with the interface | Yes | **Yes** | No (C# + TypeScript) | No | No |
| Fit if the organisation is a Microsoft shop | Neutral | Neutral | Best | Neutral | Neutral |
| Common skill for a future maintainer | Yes | Yes | Yes | Yes | Mixed |

## Trade-off analysis

**B against C** is the real comparison.

*What TypeScript on Node.js has that .NET does not:* one language end to end. Its value here is
limited to convenience for the people writing a tool, because rules are not shared across the
contract.

*What .NET has that Node.js does not, for this system:*

1. **The security-critical parts come from the platform's maker,** maintained and patched as one
   product: organisation sign-in, cookie sessions with a server-side store, local accounts with
   lockout and a second step, forgery protection, authorization policies. On Node.js each of these
   is a separate library to choose, wire together and keep in step — exactly the part of a system
   where assembling it ourselves is least wise.
2. **Walls the compiler enforces.** A module is its own assembly; what it does not make public
   cannot be referenced from another module at all. ADR-001's central rule stops depending on a
   lint rule nobody may switch off.
3. **A much smaller surface of third-party code in the running server.** The JavaScript package
   ecosystem has been the target of repeated supply-chain attacks, and a typical Node.js server
   pulls in hundreds of packages from many authors. A .NET server of this kind runs on the
   vendor's own libraries plus a handful. For a baseline like ADR-018 this is a structural
   advantage, not a detail. (The interface's build still uses that ecosystem, but it runs in the
   browser with no secrets, not next to the database.)
4. **Slower, longer support cycles,** which suit a system meant to live ten years with a small
   group looking after it.
5. **A native Windows form** at low cost, which matters if a country hosts its own installation on
   Windows servers (ADR-016, ADR-023).

**C against D:** Spring is as strong an enterprise platform as .NET and has, in Spring Modulith, a
framework made for exactly the modular-monolith shape. .NET is preferred here for three smaller
reasons: one vendor for platform, framework, data access and identity; lighter to run on a single
machine in the stand-alone shape; and a first-class life on Windows as well as Linux. If the
client's IT is a Java organisation and will own the code, D is the right choice and every other
record stands.

**The honest costs of C:** a tool crosses two languages (a C# module and a TypeScript interface
package, still one change in one repository); the contract is generated rather than shared; and
today's rules are re-expressed in another language, with the carried-over test cases as the
safety net (ADR-019).

## What would change this decision

- C15: the client's IT will maintain the code and works in Java → option D.
- C15: the client's IT will maintain the code and works only in JavaScript/TypeScript → option B;
  the design in the other records does not change, ADR-004 is rewritten.
- C3 has no effect on this record: the database and the hosting do not depend on the language.

## Consequences

- Easier: the riskiest parts are bought from the platform, not built; module walls are a compile
  error; fewer upgrades and fewer dependencies to watch; Windows hosting stays open.
- Harder: two toolchains in one repository and pipeline (ADR-006); nothing of today's server code
  is reused as code; the people steering the build read C# on the server side.
- To revisit: after C15.

## Action items

1. [ ] Owner: ask C15 (who maintains the code long term; any mandated platform).
2. [ ] Phase 3: solution layout, compiler settings (nullable checks on, warnings as errors),
   analysers, the build and type checks as required CI jobs; pin the .NET release from the
   documentation of that day.

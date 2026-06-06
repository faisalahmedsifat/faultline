# Project Evaluation: faultline

> Conducted using the Project Evaluation skill (Mom Test, JTBD, Lean Startup, Zero to One, Obviously Awesome, Crossing the Chasm, Sean Ellis PMF).
> Date: 2026-06-06
> Project stage: Defined Concept → Early MVP Build

---

## Stage

**Defined Concept — "I want to build X for Y who struggle with Z."**

faultline has a clear specification (SYSTEM.md), working partial implementation (8 of 12 PRs complete), documented backlog, and a well-defined target customer. It has not yet been put in front of real users, and there is no evidence of systematic customer discovery interviews. It is building toward MVP, not validating whether MVP should be built.

---

## The Real Problem

**When a bootstrapped SaaS product breaks in production, the founder finds out from users — not from their tools — because existing error tracking is either too expensive at scale, too complex to self-host, or both.**

The problem is not "I need error tracking." The problem is "I look unprofessional when users report my bugs before I know about them, and I can't justify $26+/month for a tool that does more than I need."

### Problem Quality Test

| Question | Evidence | Rating |
|---|---|---|
| How often does this happen? | Production errors are a daily reality for any SaaS with active users | **High frequency** |
| What do they do today? | Sentry free tier (capped at 5K errors/mo), log grepping, user reports, custom scripts | **Workarounds exist → pain confirmed** |
| Last time this hurt? | Not validated externally — founder has likely experienced this firsthand | **Unconfirmed for target market** |
| Cost of not solving? | Embarrassment, lost trust, slow bug resolution, blind spots in production | **Medium-High intensity** |

**Assessment:** The problem is real and the founder has likely experienced it personally. However, **intensity has not been validated beyond the founder's own experience.** The problem passes the smell test but lacks external triangulation. This is the single biggest risk to the project: building a product for a problem that *feels* universal but may only be intense for a narrow slice of the market.

---

## Customer (JTBD)

### Jobs-to-be-Done Statement

| Layer | Job |
|---|---|
| **Functional** | Detect production errors the moment they happen, see which ones are new vs. recurring, and get alerted through the tools I already use — without paying per-seat or per-event pricing. |
| **Emotional** | Feel confident that I know about problems before my users do. Feel in control of my application's health without a dedicated ops person. |
| **Social** | Be seen by my customers as running a reliable, professional service. Be seen by peers as someone who has their infrastructure under control. |

### Primary Customer Profile

A solo developer or 2–5 person team running a bootstrapped SaaS product with 50–500 paying customers. They deploy daily or weekly, self-host their stack (Docker Compose, VPS, or k3s), and are cost-sensitive — their entire infrastructure budget is $50–200/month. They've used Sentry's free tier but are approaching its limits, and they refuse to pay $26+/month for error tracking when their database costs less.

**One real-world archetype:** A founder who launched a B2B SaaS on Product Hunt six months ago, has 80 paying customers, self-hosts on a $40/month VPS, and currently uses a combination of Sentry free tier + grep on container logs. They discovered their last critical bug when a customer emailed them — and it was a bug that had been live for three days.

### JTBD-Consumer Fit Check

- The functional job is clear and the product design maps to it directly (ingest → inbox → alert).
- The emotional job ("feel confident") is served by the dashboard inbox + alert delivery.
- The social job ("look professional") is served by fast error detection + Slack/Discord integration.
- **Risk:** The JTBD assumes the customer's primary metric is "errors tracked per dollar." An alternative segment might value "setup time" more (indie hackers who want zero-config). faultline's current design optimizes for "simple self-host" but still requires Docker. The gap between "docker compose up" and "truly zero-config" is real.

---

## Mom Test Status

### Rating: WEAK / UNTESTED

**What we know (from the founder's own experience and design docs):**
- The founder has personally experienced the pain of error tracking being too expensive or too complex.
- The design decisions in SYSTEM.md reflect real technical frustrations (Sentry is bloated, self-hosting is complex, per-event pricing is unpredictable).
- The project's scope discipline (no APM, no tracing, no session replay) suggests real understanding of the "overkill" problem.

**What we don't know (never tested):**
- Whether 10 other indie hackers would describe the same problem with the same intensity.
- What indies hackers *currently* pay for error tracking (or what they'd pay).
- Whether "self-hosted Docker Compose" feels simple or burdensome to the target customer.
- Whether the "no auth, trust reverse proxy" decision is appealing or alarming.
- Whether error deduplication by fingerprint is the feature they care about most.
- What would make someone switch from Sentry free tier to faultline — or what would prevent the switch.

### Mom Test Violations in Current Approach

| Violation | Evidence | Risk |
|---|---|---|
| **Solution first** | Full SYSTEM.md + partial implementation before any documented customer conversations | Building for a problem that may be narrower or different than assumed |
| **No specifics from others** | All design rationale is founder-driven; no anecdotes or quotes from potential users | Designing in an echo chamber |
| **No commitment tests** | No one has been asked for a pre-order, time commitment, or referral | No signal on whether anyone actually wants this enough to act |
| **Validating with self** | The founder is both the builder and the (presumed) target user | Scratching your own itch is valid but must be triangulated |

### The Single Most Important Conversation to Have Next

Find **5 indie SaaS founders** who currently run production applications and talk to them. Do not mention faultline. Ask:

1. "Walk me through the last time you found out about a production bug. How did you discover it?"
2. "What do you use today to track errors? How's that working?"
3. "What's the most frustrating part of your current error tracking setup?"
4. "Have you tried to switch or upgrade? What happened?"
5. "When was the last time a user reported a bug you didn't know about? How did that feel?"

**If 4 out of 5 describe the pain with specific stories and visible frustration, the problem is validated. If they shrug and say "it's fine," the project should pivot or scope down dramatically.**

---

## Market Position

### Thiel Monopoly Test

faultline's framing: **"We're better than Sentry at self-hosted simplicity for indie SaaS teams."**

This is the correct framing — narrow, specific, comparative. It does not claim "error tracking for everyone." It claims a specific beachhead: cost-sensitive self-hosters who find Sentry overkill.

**However:** The beachhead may be smaller than the founder believes. How many indie SaaS founders (a) self-host their stack, (b) have outgrown Sentry free tier, (c) have Docker skills, and (d) are actively looking for an alternative? The intersection of these four filters may be in the hundreds, not thousands.

### Real Competition (Not Other Startups)

| Competitor | What They Are | Why They Win |
|---|---|---|
| **Sentry free tier** | Freemium SaaS error tracking | Free, works instantly, trusted brand, no setup |
| **Log grepping + user reports** | Manual process | $0, no tool to learn, no infrastructure to maintain |
| **GlitchTip** | Open source Sentry-compatible fork | Already exists, Sentry SDK compatible, more mature |
| **Highlight.io** | Open source session replay + errors | More features, also self-hostable, open source |
| **Doing nothing** | Living with blind spots | The default decision — no effort required |

**The biggest competitor is Sentry's free tier.** It's free. It works. It requires no Docker, no server, no maintenance. faultline must beat "free + zero effort + trusted brand." That's a harder sell than beating "Sentry's paid plan is expensive."

### Honest Market Sizing

| Frame | Estimate | Honest Assessment |
|---|---|---|
| **TAM** | Every SaaS team that handles errors | Millions of teams — irrelevant |
| **SAM** | Self-hosting SaaS teams using Docker | Perhaps 50,000–100,000 globally |
| **SOM** (12–24 months) | Self-hosting indie SaaS founders who are cost-sensitive, Docker-literate, and actively frustrated with current options | **500–2,000 teams realistically reachable via organic channels (GitHub, HN, Reddit, indie hacker communities)** |

**SOM × pricing viability check:** If faultline is free + open source (no revenue model stated in docs), SOM is meaningful as adoption, not revenue. If faultline plans a paid tier later, at 500 users × $10/month = $5K MRR — viable for a solo founder but not a venture-scale business. This is consistent with the "bootstrapped tool for bootstrapped teams" positioning.

### Beachhead Identification

**Beachhead:** Indie SaaS founders who already use Docker Compose, post on Hacker News / Indie Hackers / r/SaaS, and have publicly complained about Sentry pricing or complexity.

This beachhead is:
- **Accessible:** Reachable via Show HN, Reddit, Indie Hackers, Twitter
- **Buyable:** They have paying customers and budget for tools (if the value is clear)
- **Winnable:** No one else is targeting this exact niche with exactly this pitch
- **Referenceable:** A Show HN post from a respected indie hacker would bring adjacent users

---

## Positioning Statement

### Five-Component Positioning (Dunford Framework)

1. **Competitive Alternatives:** Sentry's free tier (capped and limited), GlitchTip (complex to set up), grep on container logs + waiting for user reports (slow and embarrassing).

2. **Unique Attributes:**
   - Three-command Docker Compose deploy (`curl` → `cp .env` → `docker compose up`)
   - No auth required — works behind any reverse proxy (Cloudflare Access, Tailscale, Nginx basic auth)
   - DSN-based ingest with zero-config SDK setup
   - Fingerprint-based deduplication keeps the inbox clean
   - Zero-dependency TypeScript SDK (< 3KB gzipped)
   - Alert delivery to Slack, Discord, and Email via BullMQ

3. **Value (the "so what?"):**
   - "Three-command deploy" → You go from zero to tracking errors in under 5 minutes, not an afternoon wrestling with Sentry's self-hosted setup
   - "No auth required" → You don't need to configure OAuth, SAML, or user management — your existing reverse proxy handles it
   - "Zero-dependency SDK" → Won't conflict with any of your other packages; safe to add to any project
   - "Fingerprint deduplication" → You see each unique error once, not 500 times — your inbox stays clean
   - "Self-hosted" → Your error data never leaves your infrastructure; no third-party has access to your stack traces

4. **Target Customer:** Indie SaaS founders who self-host their stack on Docker Compose, deploy daily, have paying customers, and care deeply about cost control and infrastructure ownership. They would rather spend an hour setting up a tool once than pay a monthly bill forever.

5. **Market Frame of Reference:** **Error inbox** — deliberately not "observability platform," "APM," or "error monitoring." The frame is: "You don't need another dashboard. You need an inbox for your production errors. Just the errors, no noise."

### One-Paragraph Positioning

> For indie SaaS founders who self-host their stack and are tired of finding out about production bugs from their users, **faultline** is an **error inbox** that deploys in three Docker Compose commands and surfaces every production error with zero noise — unlike Sentry, which is either too expensive at scale or too complex to self-host, faultline gives you error tracking that runs on your infrastructure, costs nothing to operate, and gets out of your way.

### One-Sentence Version

> **faultline: A self-hosted error inbox for people who would rather `docker compose up` than pay for Sentry.**

---

## PMF Hypothesis & Signal

### What "This Is Working" Looks Like

**The PMF hypothesis:** Bootstrapped SaaS founders will choose a self-hosted error tracker over Sentry's free tier if setup takes under 10 minutes and the product does exactly one thing well — show them errors they didn't know about.

### Pre-Launch PMF Proxies (to track from Day 1)

| Signal | What to Measure | Threshold for "Strong Signal" |
|---|---|---|
| Time-to-first-error | Minutes from `docker compose up` to first error appearing in dashboard | < 5 minutes for 80% of new instances |
| Alert configuration rate | % of projects that configure at least one alert channel | > 60% |
| Return rate | % of users who return to dashboard after 7 days | > 30% at Day 7 |
| Organic referral | Mentions on Twitter, HN, Reddit, Indie Hackers without prompting | At least 3 in first month after Show HN |
| Self-serve success | % of users who complete setup without opening a GitHub issue | > 70% |
| Retention curve flattening | Week-over-week active user retention | Flattening at 20%+ by Week 4 |

### Post-Launch PMF Test (Sean Ellis Survey)

After 30 days with at least 20 active users, ask: **"How would you feel if you could no longer use faultline?"**

- Target: **40%+ "Very disappointed"** before investing in growth
- 25–39%: Identify the "very disappointed" cohort — what's different about them? Reposition for that segment.
- < 25%: Do not scale. Return to problem discovery.

### North Star Metric

**"Errors tracked per active project per week."** Not revenue. Not signups. If projects are actively ingesting errors and users are returning to view them, the product is delivering value. If projects are created but never ingest errors, the setup is failing.

---

## Kill Conditions

These are the specific results that would tell the founder to **stop or pivot**. They are written to be falsifiable — not vague feelings, but measurable thresholds.

| Condition | Threshold | Rationale |
|---|---|---|
| **No organic adoption after Show HN** | < 10 GitHub stars and < 3 non-friend users after 2 weeks | The problem doesn't resonate widely enough to sustain a community project |
| **Setup friction kills adoption** | > 50% of users who clone the repo never see their first error in the dashboard | The self-hosted deployment model is too heavy for the target audience |
| **Sentry free tier is "good enough"** | In Mom Test conversations, > 60% of target users say they're satisfied with their current error tracking | The pain isn't intense enough to motivate switching |
| **No alert configuration** | < 20% of active projects configure alerts after 30 days | The core value prop (proactive error detection) isn't compelling |
| **Zero retention** | Week 4 retention is < 10% — users try it and never come back | The product is a novelty, not a habit |
| **Maintenance burden exceeds value** | Founder spends more time maintaining faultline than it saves users | The tool consumes more than it produces |

---

## Next 3 Experiments

Ordered by: **highest learning per unit of effort.** None of these require writing more code.

### Experiment 1: 5 Mom Test Conversations (2 weeks)

**What:** Schedule and conduct 5 structured problem-discovery conversations with indie SaaS founders. Do not mention faultline or show any code.

**Script:**
- "Walk me through the last time a production bug caught you off guard."
- "What do you use today for error tracking?"
- "What's the most frustrating part of your current setup?"
- "Have you ever paid for error tracking? Why or why not?"
- "Have you tried self-hosting anything for error tracking? What happened?"

**Success criteria:** At least 4 of 5 describe the problem with specific stories and visible frustration. At least 3 describe a current workaround they're unhappy with.

**Failure mode:** Responses are lukewarm ("it's fine," "Sentry works for me," "I don't really think about it"). If this happens, **do not build further.** The problem isn't acute enough.

### Experiment 2: Landing Page + Waitlist Smoke Test (1 week)

**What:** Ship a single-page landing site at `faultline.dev` with the positioning statement, a screenshot or mockup of the error inbox, the three-command deploy example, and an email waitlist.

**Promote it once:** A single Show HN post or Indie Hackers post. Do not promote repeatedly — the goal is to measure pull, not pump numbers.

**Success criteria:**
- > 50 waitlist signups from the single post
- > 5 people reply with specific comments about their error tracking pain
- At least 1 person asks "can I try it now?"

**Failure mode:** < 20 signups or all signups are generic "looks cool" with no specific pain described. This signals weak market pull.

### Experiment 3: Concierge MVP with 3 Design Partners (2 weeks after Experiment 1)

**What:** Find 3 founders from Experiment 1 who showed strong pain signals. Manually set up faultline on a server for them (or walk them through it synchronously). Watch them use it. Do not explain — observe.

**What to measure:**
- Time from "let's start" to first error appearing: < 10 minutes?
- What confused them during setup?
- Did they configure Slack/Discord/Email alerts?
- Did they come back to check the dashboard the next day without prompting?
- What did they ask for that the product doesn't do?

**Success criteria:** At least 2 of 3 have errors flowing into their project within 24 hours and return to the dashboard at least once without prompting.

**Failure mode:** None of them complete setup without hand-holding, or none return after the initial session. This signals that the product — even if the problem is real — isn't the right solution.

---

## Verdict

### PROCEED — WITH URGENT VALIDATION BEFORE FURTHER BUILD

**Rationale:** The product thesis is coherent, the architecture is sound, and the founder clearly understands the technical problem space. The code quality and documentation are unusually strong for a pre-launch MVP. However, **zero customer discovery has been conducted.** The entire project rests on the assumption that other indie hackers share the founder's frustration with existing error tracking. This assumption may be correct — but it has never been tested.

**The next dollar and next hour should go to Experiment 1 (Mom Test conversations), not to building the dashboard UI or finishing the backlog.** Completing the remaining 4 PRs before talking to users is building on unverified foundations. A week of conversations now could save months of building the wrong thing.

### Risk Summary

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Problem not acute for target market | Medium | **Fatal** — no one switches | Experiment 1: Mom Test conversations |
| Sentry free tier is "good enough" for most | Medium-High | **High** — caps addressable market | Validate switching triggers in Experiment 1 |
| Self-hosted Docker is too heavy for target | Medium | **High** — limits adoption | Experiment 3: Concierge onboarding observation |
| GlitchTip / Highlight already serves this niche | Low-Medium | **Medium** — fragmented market | Differentiate on simplicity, not features |
| Maintenance burden on solo founder | Medium | **Medium** — burnout risk | Limit scope ruthlessly; say no to features |
| No revenue model → sustainability problem | High | **Medium** — fine for a free tool, but limits long-term investment | Decide: is this a community project or a business? |

---

## Appendix: Framework Summary

| Framework | Assessment |
|---|---|
| **Mom Test** | WEAK — No external customer conversations documented. All validation is founder-intuition. |
| **JTBD** | CLEAR — The functional/emotional/social jobs are well-defined and the product maps to them directly. |
| **Zero to One (Thiel)** | PARTIAL — Beachhead is identified but monopoly thesis is weak. No 10x advantage over Sentry free tier. |
| **Obviously Awesome (Dunford)** | STRONG — The positioning is sharp. "Error inbox" is a deliberate, differentiating frame. |
| **Crossing the Chasm (Moore)** | PREMATURE — Still in early adopter phase. No chasm to cross yet. |
| **Sean Ellis PMF** | UNTESTED — Pre-launch. No users to survey. Leading indicators defined above. |
| **Lean Startup (Ries)** | AT RISK — Building before validating the riskiest assumption. The MVP is well-scoped, but the assumption it tests hasn't been explicitly stated. |

---

*This evaluation was conducted using the Project Evaluation skill. The frameworks applied are from The Mom Test (Rob Fitzpatrick), Competing Against Luck / JTBD (Clayton Christensen), Zero to One (Peter Thiel), Obviously Awesome (April Dunford), Crossing the Chasm (Geoffrey Moore), and Hacking Growth (Sean Ellis).*

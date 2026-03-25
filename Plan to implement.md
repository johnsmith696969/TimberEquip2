# TimberEquip – Dealer CRM + Meta Distribution System Spec

## 🎯 Objective

Build a full pipeline:

Dealer → CRM → TimberEquip.com → Meta Catalog/Ads → Buyer → Lead → CRM → Attribution

This system must:

* Use TimberEquip (Firebase) as the **source of truth**
* Distribute inventory to Meta (Facebook/Instagram)
* Drive traffic BACK to TimberEquip.com
* Capture and track leads per machine
* Prove ROI to dealers

---

# 🧠 CRITICAL RULES

1. TimberEquip is the **system of record**
2. Meta is a **distribution + demand channel**, not a database
3. ALL traffic must return to TimberEquip.com
4. Every machine must be trackable:

   * views
   * leads
   * source
   * conversion status

---

# 🔍 STEP 1 — AUDIT EXISTING SYSTEM (REQUIRED)

Codex / Claude MUST analyze the repo and determine:

## Existing (verify implementation)

* [ ] Firebase Auth (users exist?)
* [ ] Firestore collections:

  * users
  * listings (or machines)
  * inquiries (leads)
* [ ] Admin login UI
* [ ] Listing creation flow
* [ ] Image upload (Firebase Storage)
* [ ] Public listing pages
* [ ] Backend API (Express/Firebase functions)

## Missing or incomplete (identify gaps)

* [ ] Dealer role separation (multi-tenant)
* [ ] Machine publishing states (draft/published/sold)
* [ ] Lead tracking per machine
* [ ] Source attribution (FB / organic / direct)
* [ ] Meta catalog integration
* [ ] Sync job system
* [ ] Error logging for feeds
* [ ] Dealer dashboard
* [ ] CRM pipeline (lead statuses)

👉 OUTPUT REQUIRED:

* List what exists
* List what is partially built
* List what is missing
* List what needs refactoring

---

# 🧩 STEP 2 — DATA MODEL (FIRESTORE)

## Collections

### dealers

```
id
name
location
subscriptionPlan
meta:
  businessManagerId
  adAccountId
  catalogId
  pixelId
createdAt
```

### users

```
id
email
role: super_admin | dealer_admin | dealer_staff
dealerId
```

### machines (core entity)

```
id
dealerId
title
year
make
model
category
condition
hours
price
location
description
images[]
status: draft | published | sold
slug
publishedAt

meta:
  syncStatus: pending | synced | error
  metaItemId
  lastSyncAt
  lastError
```

### leads

```
id
machineId
dealerId
name
email
phone
message
source: facebook | organic | direct
campaignId
adId
status: new | contacted | qualified | won | lost
createdAt
```

### syncJobs

```
id
machineId
dealerId
type: meta_sync
status: pending | success | failed
errorMessage
createdAt
```

---

# 🔄 STEP 3 — MACHINE PUBLISH FLOW

## Required flow:

1. Dealer logs in
2. Creates machine
3. Uploads images to Firebase Storage
4. Saves as draft
5. Clicks "Publish"

## On publish:

* Save machine to Firestore
* Generate slug
* Publish to TimberEquip listing page
* Add to Meta catalog feed
* Create sync job
* Log result

---

# 🌐 STEP 4 — TIMBEREQUIP LISTING PAGE

Each machine must:

* Have unique SEO URL:
  `/equipment/{slug}`
* Display:

  * images
  * specs
  * price
  * location
* Include:

  * lead form
  * call button

## Required:

* Meta Pixel installed
* UTM tracking support

---

# 📦 STEP 5 — META (FACEBOOK) INTEGRATION

## Dealer Connection (REQUIRED)

Each dealer must connect:

* Facebook Page
* Ad Account
* Catalog
* Pixel

## Store in Firestore:

```
dealer.meta:
  pageId
  adAccountId
  catalogId
  pixelId
```

---

## Catalog Feed

System must generate:

* `/feeds/meta.xml` OR `/feeds/meta.csv`

Each machine must include:

```
id
title
description
price
link
image_link
condition
availability
```

---

## Sync Behavior

On machine publish/update:

* Update feed OR push via API
* Update sync status
* Retry failures

---

# 🎯 STEP 6 — ADS AUTOMATION

## Goal:

Each machine = ad unit

## Flow:

* Use Meta catalog
* Run dynamic ads

## Dealer controls:

* budget
* targeting radius
* categories

---

# 🧲 STEP 7 — LEAD SYSTEM (CRM CORE)

## Lead capture:

* Website form (primary)
* Optional Meta Lead Ads

## Store:

```
machineId
dealerId
source
campaignId
adId
```

## Dealer dashboard:

* new leads
* status updates
* notes

---

# 🔁 STEP 8 — ATTRIBUTION LOOP (CRITICAL)

## Required:

* Meta Pixel (frontend)
* Conversions API (backend)

## Events:

* page_view
* view_content
* lead
* qualified_lead
* sale

---

# 📊 STEP 9 — DEALER DASHBOARD

Must show per machine:

* views
* leads
* cost per lead
* source breakdown

---

# 🚀 STEP 10 — MVP PRIORITY

## Build first:

1. Dealer auth + roles
2. Machine CRUD
3. Image upload
4. Publish flow
5. Listing page
6. Lead capture

## Then:

7. Meta feed
8. Sync jobs
9. Basic ads
10. Attribution

---

# ⚠️ DO NOT BUILD

* ❌ Fake Facebook accounts
* ❌ Marketplace bots
* ❌ Meta as source of truth
* ❌ Overbuilt CRM too early

---

# 💥 END STATE

TimberEquip becomes:

* Inventory system
* Marketing engine
* Lead generator
* Data/ROI platform

---

# 🧭 FINAL TASK FOR CODEX / CLAUDE

1. Audit repo
2. Map existing features to this spec
3. Identify gaps
4. Recommend implementation steps
5. Prioritize minimal working system

OUTPUT:

* Gap analysis
* Build plan
* Suggested file structure
* Required API endpoints

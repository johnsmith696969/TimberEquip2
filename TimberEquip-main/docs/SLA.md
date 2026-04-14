# Service Level Agreement (SLA)

**TimberEquip -- Forestry Equipment Marketplace**
**Effective Date:** April 8, 2026
**Document Version:** 1.0

---

## 1. Service Level Commitment

TimberEquip commits to maintaining **99.9% monthly uptime** for all production services, measured as the percentage of total minutes in a calendar month during which the platform is available and functional.

| Metric | Value |
|---|---|
| Monthly Uptime Target | 99.9% |
| Maximum Allowed Downtime | 43.2 minutes per month |
| Measurement Period | Calendar month (UTC) |
| Measurement Method | Synthetic monitoring with 60-second polling intervals |

Uptime is calculated as:

```
Uptime % = ((Total Minutes in Month - Downtime Minutes) / Total Minutes in Month) x 100
```

Downtime begins when the platform is unreachable or materially degraded as detected by automated monitoring, and ends when service is restored and confirmed operational.

---

## 2. Service Components

TimberEquip is built on a distributed architecture. Each component carries an individual SLA from its underlying infrastructure provider.

| Component | Provider | Function | Individual SLA |
|---|---|---|---|
| Firebase Hosting | Google Cloud | Static asset delivery, CDN | 99.95% |
| Cloud Run / Express API | Google Cloud | Application server, REST API | 99.95% |
| Firestore | Google Cloud | Primary document database | 99.999% |
| PostgreSQL (Cloud SQL) | Google Cloud | Relational data, reporting | 99.95% |
| Cloud Functions | Google Cloud | Event-driven processing, webhooks | 99.95% |
| Stripe Payments | Stripe, Inc. | Payment processing, subscriptions | 99.99% |

Individual component SLAs are governed by the respective provider agreements. TimberEquip monitors each component independently and maintains redundancy where architecturally feasible.

---

## 3. Composite SLA Calculation

When services operate in series (each must be available for the platform to function), the composite SLA is the product of individual SLAs:

```
Composite SLA = SLA_Hosting x SLA_API x SLA_Firestore x SLA_CloudSQL x SLA_Functions x SLA_Stripe
```

```
Composite SLA = 0.9995 x 0.9995 x 0.99999 x 0.9995 x 0.9995 x 0.9999
              = 0.99839 (approximately 99.84%)
```

| Metric | Value |
|---|---|
| Theoretical Composite SLA | ~99.84% |
| TimberEquip Committed SLA | 99.9% |

TimberEquip bridges the gap between the theoretical composite and the committed SLA through architectural resilience measures including graceful degradation, caching layers, retry logic, and circuit breakers. Non-critical component failures (e.g., Cloud Functions processing delays) do not constitute platform downtime unless they affect core user-facing operations.

---

## 4. Incident Severity Levels

All incidents are classified into four priority levels. Response and resolution targets are measured from the time of detection or customer report, whichever occurs first.

| Priority | Severity | Description | Response Time | Resolution Target |
|---|---|---|---|---|
| **P1** | Critical | Complete platform outage; all users unable to access core functionality (listings, search, payments) | 15 minutes | 4 hours |
| **P2** | High | Major feature unavailable or severely degraded; significant subset of users affected (e.g., payment processing failure, authentication outage) | 30 minutes | 8 hours |
| **P3** | Medium | Minor feature degraded or intermittently unavailable; workaround exists (e.g., image uploads slow, email notifications delayed) | 4 hours | 24 hours |
| **P4** | Low | Cosmetic defect, minor UI inconsistency, or documentation error; no functional impact | Next business day | Best effort |

### Escalation Procedures

- **P1 incidents** immediately engage the on-call engineering lead and are escalated to senior leadership within 30 minutes if unresolved.
- **P2 incidents** are assigned to the on-call engineer and escalated to the engineering lead if unresolved within 4 hours.
- **P3 and P4 incidents** are triaged during standard business hours and scheduled into the next appropriate development cycle.

### Resolution Definition

An incident is considered resolved when:

1. The root cause has been identified and mitigated.
2. Normal service operation has been restored and confirmed via monitoring.
3. Affected users can access the impacted functionality.

---

## 5. Scheduled Maintenance

TimberEquip performs scheduled maintenance to deploy updates, apply security patches, and optimize infrastructure.

| Policy | Detail |
|---|---|
| Advance Notice | Minimum 48 hours prior to maintenance window |
| Notification Method | Email to account administrators and status page update |
| Preferred Window | Sundays, 02:00 -- 06:00 UTC |
| Maximum Duration | 4 hours per window |
| Frequency | No more than twice per month under normal conditions |

Emergency maintenance (critical security patches, zero-day vulnerability remediation) may be performed with less than 48 hours notice. In such cases, notification will be provided as early as reasonably possible.

Scheduled maintenance windows are excluded from uptime calculations as defined in Section 6.

---

## 6. Exclusions

The following events are excluded from SLA calculations and do not qualify for service credits:

1. **Scheduled Maintenance** -- Downtime during pre-announced maintenance windows conducted in accordance with Section 5.
2. **Force Majeure** -- Events beyond TimberEquip's reasonable control, including but not limited to natural disasters, acts of war or terrorism, government actions, pandemics, widespread internet outages, and failures of third-party infrastructure providers affecting multiple customers globally.
3. **Customer-Caused Issues** -- Downtime or degradation resulting from actions taken by the customer, including misconfigured API integrations, exceeding published rate limits, or unauthorized modifications to account settings.
4. **Third-Party Service Outages** -- Failures of upstream providers (e.g., Google Cloud platform-wide incidents, Stripe global outages) that are beyond TimberEquip's control, provided TimberEquip takes reasonable steps to mitigate impact.
5. **Beta and Preview Features** -- Services explicitly designated as beta, preview, or experimental are not covered by this SLA.
6. **DNS and Network Issues** -- Failures in DNS resolution, ISP routing, or network connectivity outside of TimberEquip's managed infrastructure.

---

## 7. Service Credits

If TimberEquip fails to meet the 99.9% monthly uptime commitment, affected customers are eligible for service credits applied to future invoices.

| Monthly Uptime | Credit (% of Monthly Fee) |
|---|---|
| 99.0% -- 99.9% | 10% |
| 99.0% -- 99.5% | 25% |
| Below 99.0% | 50% |

### Credit Terms

- Service credits are calculated as a percentage of the customer's monthly subscription fee for the affected service period.
- Credits are applied to the next billing cycle and are not redeemable for cash.
- Customers must submit a credit request within 30 calendar days of the end of the affected month.
- Credit requests must include the dates and times of observed downtime and a description of the impact.
- The maximum aggregate credit for any single calendar month shall not exceed 50% of the monthly fee for that month.
- Service credits are the sole and exclusive remedy for any failure to meet SLA commitments.

---

## 8. Monitoring and Observability

TimberEquip operates a multi-layered monitoring stack to detect, diagnose, and resolve incidents.

| Layer | Tool | Purpose |
|---|---|---|
| Error Tracking | Sentry | Real-time exception capture, stack traces, release tracking, and performance monitoring across frontend and backend services |
| Infrastructure Monitoring | Google Cloud Monitoring | Resource utilization, latency metrics, alert policies, and uptime checks for all Cloud Run, Cloud SQL, and Cloud Functions instances |
| Health Endpoint | `/api/health` | Publicly accessible endpoint returning real-time status of all service dependencies (database connectivity, external API availability, cache health) |
| Log Aggregation | Cloud Logging | Centralized log collection, structured query, and alerting on error rate thresholds |
| Uptime Checks | Cloud Monitoring Uptime Checks | Synthetic requests every 60 seconds from multiple global regions |

### Health Endpoint Specification

The `/api/health` endpoint returns a JSON response indicating the operational status of each service dependency:

```
GET /api/health

200 OK — All systems operational
503 Service Unavailable — One or more dependencies degraded
```

This endpoint is available for customer integration and third-party monitoring tools.

---

## 9. Communication

TimberEquip maintains transparent communication during incidents and scheduled maintenance.

### Status Page

A public status page is available at **`/status`** providing:

- Current operational status of all service components
- Active incident details and estimated resolution times
- Scheduled maintenance announcements
- Historical uptime data for the trailing 90 days

### Incident Notifications

| Event | Channel | Timing |
|---|---|---|
| P1 Critical Incident | Email to all account administrators; status page update | Within 15 minutes of detection |
| P2 High Incident | Email to affected account administrators; status page update | Within 30 minutes of detection |
| P3/P4 Incidents | Status page update | Within 4 hours / next business day |
| Incident Updates | Email and status page | Every 30 minutes during active P1; every 2 hours during active P2 |
| Post-Incident Report | Email to affected customers | Within 5 business days of P1/P2 resolution |
| Scheduled Maintenance | Email and status page | Minimum 48 hours in advance |

### Post-Incident Reports

Following any P1 or P2 incident, TimberEquip will publish a post-incident report containing:

1. Timeline of events from detection through resolution
2. Root cause analysis
3. Customer impact assessment
4. Remediation actions taken
5. Preventive measures to avoid recurrence

---

## 10. Reporting

TimberEquip provides uptime and performance reporting to support customer compliance and operational oversight requirements.

| Report | Content | Availability |
|---|---|---|
| Monthly Uptime Report | Component-level uptime percentages, incident summary, maintenance log | Available upon request within 10 business days of month end |
| Quarterly Service Review | Uptime trends, incident analysis, capacity planning, roadmap updates | Available to Enterprise-tier customers |
| Annual SLA Summary | Year-over-year performance, SLA compliance record, credit history | Available upon request |

### Requesting Reports

Customers may request reports by contacting their account representative or submitting a request through the support portal. Reports are delivered in PDF format within 10 business days of the request.

---

## 11. Agreement Review

This SLA is reviewed and updated annually, or more frequently as required by material changes to the platform architecture or service offerings. Customers will be notified of any changes to SLA terms with a minimum of 30 days advance notice.

---

**TimberEquip** -- Built for the forestry industry. Engineered for reliability.

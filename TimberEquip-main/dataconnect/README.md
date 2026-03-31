# Forestry Equipment Sales Data Connect Scaffold

This directory is the Phase 1 scaffold for moving listing governance onto Firebase Data Connect backed by Cloud SQL for PostgreSQL.

Current contents:

- `dataconnect.yaml`: service-level configuration scaffold
- `schema/listing_governance.gql`: initial Phase 1 governance schema
- `listingGovernance/connector.yaml`: connector configuration
- `listingGovernance/lifecycle.gql`: first-pass governance queries and mutations
- `../database/postgres/migrations/001_listing_governance_phase1.sql`: relational governance migration
- `../database/postgres/listing_governance_firestore_mapping.md`: Firestore-to-Postgres mapping and cutover notes

Important notes:

- This scaffold is not wired into `firebase.json` yet.
- `instanceId` in `dataconnect.yaml` is intentionally a placeholder.
- The schema and operations are implementation starters, but they now mirror the SQL table names and lowercase lifecycle vocabulary used by the migration assets.
- Phase 1 intentionally uses constrained text states instead of PostgreSQL enum types so Data Connect, JSON transition rules, and future migrations can share one state vocabulary.
- The SQL migration in `database/postgres/migrations/001_listing_governance_phase1.sql` is the relational reference while the Data Connect service is refined.

Recommended next steps:

1. Choose the actual Cloud SQL instance id and region pairing.
2. Run `firebase init dataconnect` or align this scaffold with the generated baseline.
3. Validate the connector syntax against the generated Data Connect baseline once the service is initialized locally.
4. Add authorization filters and role-aware wrappers once dealer/admin role tables are defined.
5. Wire server-owned lifecycle mutations through Cloud Run workers instead of calling them directly from clients.

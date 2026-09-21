# Role and access model

The backend is the source of truth for access. The frontend mirrors these rules
to avoid showing actions users cannot perform.

| Role | Responsibility | Access |
| --- | --- | --- |
| `ADMIN` | System owner | All modules, staff provisioning, status changes, audit records and configuration-level actions. |
| `CUSTOMER_SERVICE_OFFICER` | Customer support | Customer records, customer vehicles, appointments and customer notifications. Cannot create privileged staff, approve payments, or view audit logs. |
| `SCHEDULING_OFFICER` | Workshop capacity | View bookings and vehicles; create bays and time slots; coordinate booking status. |
| `WORKSHOP_OPERATIONS_MANAGER` | Service delivery | View bookings and vehicles; update vehicle details and progress bookings. |
| `FINANCE_OFFICER` | Financial controls | View bookings and vehicles needed for reconciliation; create, verify, refund, and manage payments. |
| `FUEL_STATION_MANAGER` | Fuel operations | Record, approve, and manage fuel-station logs. |
| `CUSTOMER` | Self service | Only their own profile, vehicles, bookings, payments, fuel logs, invoices, and notifications. |

Staff registrations remain pending until an administrator activates them. Only
the configured administrator access code can create an initial administrator.

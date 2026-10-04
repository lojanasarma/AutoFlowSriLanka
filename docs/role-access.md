# Role and access model

The backend is the source of truth for access. The frontend mirrors these rules
to avoid showing actions users cannot perform.

| Role | Responsibility | Access |
| --- | --- | --- |
| `ADMIN` | System owner | All modules, staff provisioning, status changes, audit records and configuration-level actions. |
| `CUSTOMER_SERVICE_OFFICER` | Customer support | View customer records for support, create bookings on a customer's behalf, and cancel pending/scheduled bookings. Cannot administer accounts, edit/delete vehicles, approve payments, or view audit logs. |
| `SCHEDULING_OFFICER` | Workshop capacity | View bookings and vehicles, create bays/time slots, and cancel pending/scheduled bookings. Booking slot assignment and rescheduling are not implemented. |
| `WORKSHOP_OPERATIONS_MANAGER` | Service delivery | View bookings and vehicles; move bookings through the existing in-progress/completed workflow and cancel operational bookings. Separate work orders, staff assignment, and parts tracking are not implemented. |
| `FINANCE_OFFICER` | Financial controls | View bookings and transaction history; record, verify, and refund payments. Cannot manage vehicles, fuel, schedules, or workshop status. |
| `FUEL_STATION_MANAGER` | Fuel operations | Manage station details, fuel types, station fuel availability, inventory, prices and stock adjustments; record/approve/reject dispensing logs; review stock movement history, low-stock alerts and daily/monthly summaries. Stock changes retain actor/time/reason. |
| `CUSTOMER` | Self service | Only their own profile, vehicles, bookings, payments, fuel logs, invoices, and notifications. |

Staff registrations remain pending until an administrator activates them. Only
the configured administrator access code can create an initial administrator.

The application currently has no customer inquiry/complaint workflow, schedule
rescheduling/assignment flow, or workshop work-order and staff/parts assignment
model. Fuel station staff/resources are also not represented in the data model.

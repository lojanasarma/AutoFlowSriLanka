# Legacy SQL Server materials

These files are retained for historical reference only. The active Spring Boot
application is configured for MySQL and does not run these scripts.

`tools/` contains one-off SQL Server diagnostics/migration helpers. They read
`SQLSERVER_JDBC_URL`, `SQLSERVER_USERNAME`, and `SQLSERVER_PASSWORD` from the
environment; never add credentials to the source files.

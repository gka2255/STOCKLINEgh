# StockLine Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Active Account Gate (`isActiveUser`)**: Every read and write across `stockItems`, `stockBatches`, `stockMovements`, `requisitions`, and `alerts` requires an authenticated user whose `/users/{uid}` document has `isActive == true`.
2. **Strict RBAC Hierarchy**:
   - `manager`: Complete access to all pages, user provisioning, stock management, requisitions, alerts, and settings.
   - `storekeeper`: Access to Dashboard, Stock Catalog, FIFO Batches, Movements Ledger, Requisitions processing, and Stock Alerts.
   - `staff`: Strictly scoped access. Can only view and create their own requisitions. Cannot inspect unit costs, batch supplier IDs, or stock alert logs.
3. **Immutable Audit Trail (`stockMovements`)**: Stock movement logs are append-only. Rules enforce `allow update, delete: if false;`.
4. **Soft-Delete Only**: `stockItems` and `users` are deactivated (`isActive: false`), never deleted.
5. **Secondary Firebase App Instance**: When a manager creates a new user, a secondary Firebase app instance is used (`StockLineSecondaryUserCreator`) so that the manager's auth session is not terminated.

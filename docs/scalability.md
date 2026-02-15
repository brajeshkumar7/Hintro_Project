# Scalability

This document covers horizontal scaling, WebSocket scaling considerations, database indexing and optimization, and trade-offs/assumptions of the current design.

---

## Horizontal Scaling

- **Stateless API:** The Express app does not store sessions in memory. Auth is JWT-based; each request is self-contained. So you can run multiple instances of the backend behind a load balancer for HTTP/HTTPS traffic.
- **Sticky sessions and WebSockets:** Socket.io connections are stateful. By default, a client connects to one server instance and stays there. If you run multiple backend instances, a client that joins `board:A` on instance 1 will not receive events emitted from instance 2 (e.g. after a task create on instance 2). To scale Socket.io horizontally you need to use the **Socket.io adapter** (e.g. Redis adapter) so that emit-to-room is broadcast across instances. Without it, real-time updates only work for clients connected to the same instance that handled the mutation.
- **Recommendation:** For a single instance, the current design is fine. For multiple instances, add a Redis (or other) adapter for Socket.io and ensure the load balancer supports WebSockets (and optionally sticky sessions if you do not use a shared adapter).

---

## WebSocket Scaling Considerations

- **Connection limit:** Each browser tab typically holds one Socket.io connection per origin. Server-side limits (e.g. max sockets, memory per connection) apply. Monitor connection count and memory when scaling.
- **Room size:** All viewers of a board are in one room. If a board has many concurrent viewers, each emit to that room goes to all of them. For very large rooms (e.g. thousands of sockets), consider splitting (e.g. by list or feature) or throttling/batching updates; the current implementation does not do this.
- **Reconnection:** Socket.io client reconnects automatically. After reconnect, the client must emit `join_board` again for each board they are viewing; the current frontend does this when the user is on a board view and the socket connects (or is already connected).
- **Authentication:** Each connection is authenticated with JWT. Token refresh is not implemented; long-lived connections may eventually see auth failures if the token expires and the server validates on each operation.

---

## Database Indexing and Optimization

- **Indexes in use:** See `docs/database-schema.md`. Indexes support: boards by creator and by member; lists by board and order; tasks by list, assignee, and list+order; activity by board and timestamp (and user/timestamp). These support the main read paths (list boards, list lists, list tasks, paginate activity).
- **Task search:** Task search uses a regex on title and description with `listId` in an `$in` array (board’s list IDs). It is not full-text; for large datasets, consider a dedicated search index or service.
- **Pagination:** Tasks and activity are paginated (limit, skip). For very large offsets, skip can be slow; consider cursor-based pagination for activity if the feed grows large.
- **MongoDB:** Single primary; read scaling can be improved with read replicas if needed. Connection pooling is handled by the driver (single connection from the app to the cluster).

---

## Trade-offs and Assumptions

- **Single-region:** The design does not assume multi-region deployment. Latency and WebSocket affinity are best when client and server are in the same region.
- **Eventual consistency:** Real-time updates are best-effort. If a client misses an event (e.g. disconnect, join after emit), the next full load (e.g. reopen board) will refetch from the API and show the correct state. No conflict resolution or CRDTs are used.
- **No offline support:** The frontend does not queue mutations offline or sync when back online; it assumes a live connection for real-time and refetches on load.
- **Auth storage:** The frontend stores the JWT (and user) in localStorage for persistence across refresh. This is a trade-off for convenience; for higher security, consider httpOnly cookies or short-lived tokens with refresh.
- **CORS:** Backend allows all origins. For production, restrict to the frontend origin(s) to reduce abuse.
- **Rate limiting:** Not implemented. For production, add rate limiting (e.g. per IP or per user) on auth and API routes to mitigate abuse and DoS.

No application logic was changed; this document reflects the current implementation and intended scaling approach.

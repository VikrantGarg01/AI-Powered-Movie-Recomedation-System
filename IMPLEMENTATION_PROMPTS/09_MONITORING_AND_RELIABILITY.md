# IMPLEMENTATION PROMPT: 09_MONITORING_AND_RELIABILITY

> **Priority:** RECOMMENDED (Operational Health & Failure Resilience)  
> **Order:** Step 9 in Remediation Sequence  
> **Dependencies:** None  
> **Target Subsystem:** Process Crash Protection, Log Rotation, Error Masking  

---

## 1. Project-Specific Context
CinePulse runs Winston and Morgan for structured logging in `server/config/logger.js`. The server runs inside Node.js 24 and handles incoming requests from the Vite frontend and external requests from the TMDB API and Gmail SMTP servers.

---

## 2. Exact Problems Identified During Audit
1. **Missing Process-Level Exception Handlers:**  
   `server/server.js` lacks `process.on('unhandledRejection')` and `process.on('uncaughtException')`. If an asynchronous TMDB request or SMTP network call fails without an internal try-catch block, Node.js will terminate the entire server process.
2. **Missing Log Rotation on Disk:**  
   Winston logs directly to console transports only. If file logging is enabled in production, logs accumulate without daily rotation, creating a long-term risk of disk space exhaustion.
3. **Potential Credential Leakage in Logs:**  
   Morgan request logging and Winston debug formats do not explicitly redact sensitive request body fields such as `password`, `otp`, or `token`.

---

## 3. Why the Improvement is Necessary
- Prevents unexpected server crashes and total application downtime when third-party services fail.
- Ensures logs are safely rotated and pruned over time.
- Guarantees compliance with privacy standards by preventing plain text passwords or OTPs from entering log storage.

---

## 4. Affected Files and Components
- `server/server.js`
- `server/config/logger.js`
- `server/middleware/errorMiddleware.js`

---

## 5. Required Implementation Steps

### Step 5.1: Add Process Crash Protection in `server/server.js`
- Register top-level process event listeners:
  ```javascript
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason.stack || reason}`);
    // Do not crash the process; log structured alert
  });

  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.stack || error.message}`);
    // Gracefully finish active requests before exiting if critical
  });
  ```

### Step 5.2: Configure Sensitive Field Masking Middleware
- Create a middleware that scrubs passwords and OTPs from request logging:
  ```javascript
  const maskSensitiveData = (body) => {
    if (!body || typeof body !== 'object') return body;
    const masked = { ...body };
    ['password', 'otp', 'code', 'token'].forEach(field => {
      if (field in masked) masked[field] = '********';
    });
    return masked;
  };
  ```

### Step 5.3: Add Daily File Rotation Transport in `server/config/logger.js`
- Install `winston-daily-rotate-file`:
  ```bash
  cd server && npm install winston-daily-rotate-file
  ```
- Configure file transport for production:
  - Max file size: 10MB
  - Max retention: 14 days
  - Filename pattern: `logs/cinepulse-%DATE%.log`

---

## 6. Security and Compatibility Considerations
- Sensitive field masking ensures security logs comply with GDPR/privacy guidelines.
- Daily rotation prevents server storage exhaustion.

---

## 7. Expected Behavior After Implementation
- Unhandled Promise rejections log detailed stack traces without terminating the server.
- Request logs never contain raw user passwords or 6-digit OTP codes.
- Production log files are capped at 10MB and rotated automatically.

---

## 8. Required Tests
1. Test simulated unhandled rejection: verify server logs the error and remains responsive.
2. Test login request logging: verify log outputs `password: '********'`.
3. Test daily rotate transport initialization.

---

## 9. Verification Procedure
```bash
# Trigger an intentional invalid payload
curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secretpassword123"}'
# Inspect console/logs: verify "secretpassword123" does not appear in plain text
```

---

## 10. Acceptance Criteria
- [ ] Process crash listeners (`unhandledRejection`, `uncaughtException`) are active.
- [ ] No passwords or OTPs appear in server logs.
- [ ] File rotation policy is configured with 14-day retention.

---

## 11. Documentation Updates Required
- Update `QUALITY_CHECKLIST.md` item REL-01 to `Passed`.
- Update `MEMORY.md` with monitoring details.

# IMPLEMENTATION PROMPT: 05_DEPLOYMENT_AND_CICD

> **Priority:** MANDATORY (Container Hardening & Release Safety)  
> **Order:** Step 5 in Remediation Sequence  
> **Dependencies:** `03_UNIT_TESTING_IMPLEMENTATION.md`, `04_API_AND_INTEGRATION_TESTING.md`  
> **Target Subsystem:** Docker Configuration, `.dockerignore`, CI/CD Workflows  

---

## 1. Project-Specific Context
CinePulse supports containerized deployment via `docker-compose.yml` and `server/Dockerfile`. The backend container builds a Node.js image running Express on port 5001 and mounts to a MongoDB container on port 27017.

---

## 2. Exact Problems Identified During Audit
1. **Missing `.dockerignore` Files:**  
   Neither the project root nor the `server/` directory contains a `.dockerignore` file. When `docker build` runs, `server/.env` (containing live credentials), `server/node_modules`, and uploaded media files are sent to the Docker daemon and copied into the image layers.
2. **Container Executes as `root` User:**  
   `server/Dockerfile` lacks a non-root `USER` directive, causing the Node process to run with root privileges inside the container.
3. **Missing Automated CI/CD Pipeline:**  
   No `.github/workflows/` configuration exists to automatically test, lint, and build the application on pull requests or commits to `main`.
4. **Hardcoded Secret in `docker-compose.yml`:**  
   Line 29 in `docker-compose.yml` specifies `JWT_SECRET: cinepulse_docker_production_jwt_secret_key_2026` directly in the compose file rather than sourcing from a secure environment file.

---

## 3. Why the Improvement is Necessary
- Prevents catastrophic credential leaks if Docker images are uploaded to container registries (Docker Hub, AWS ECR, etc.).
- Eliminates container escape vectors by running as an unprivileged user (`USER node`).
- Ensures broken code or failing tests are caught automatically before merging.

---

## 4. Affected Files and Components
- `.dockerignore` (to create)
- `server/.dockerignore` (to create)
- `server/Dockerfile`
- `docker-compose.yml`
- `.github/workflows/ci.yml` (to create)

---

## 5. Required Implementation Steps

### Step 5.1: Create `.dockerignore` and `server/.dockerignore`
Create `server/.dockerignore`:
```
.env
.env.*
node_modules/
npm-debug.log*
uploads/*
!uploads/.gitkeep
tests/
*.log
```
Create root `.dockerignore`:
```
.git
.github
node_modules/
dist/
.env
.env.*
*.log
ml_pipeline/__pycache__/
ml_pipeline/.ipynb_checkpoints/
```

### Step 5.2: Update `server/Dockerfile` for Non-Root Execution & Production Build
```dockerfile
# Production-ready Node.js Dockerfile
FROM node:20-alpine

# Security: Install dumb-init for proper signal forwarding
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files first for cached dependency layers
COPY package*.json ./

RUN npm ci --only=production

# Copy application source (excluding .dockerignore patterns)
COPY . .

# Ensure upload directory has correct non-root permissions
RUN mkdir -p uploads && chown -R node:node /app

# Switch to unprivileged non-root user
USER node

EXPOSE 5001

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
```

### Step 5.3: Harden `docker-compose.yml`
- Read secrets from environment variables with safe defaults:
  ```yaml
  JWT_SECRET: ${JWT_SECRET:-cinepulse_change_me_in_production}
  ```
- Bind MongoDB port only to localhost:
  ```yaml
  ports:
    - "127.0.0.1:27017:27017"
  ```

### Step 5.4: Create GitHub Actions Workflow (`.github/workflows/ci.yml`)
- Trigger on `push` and `pull_request` to `main`:
  - Step 1: Checkout repository.
  - Step 2: Setup Node.js 20.x.
  - Step 3: Install dependencies (`npm ci` and `cd server && npm ci`).
  - Step 4: Run linter and type-checks.
  - Step 5: Execute unit tests (`npm test`).
  - Step 6: Build frontend production bundle (`npm run build`).

---

## 6. Security and Compatibility Considerations
- Using `dumb-init` ensures Node.js properly handles SIGINT/SIGTERM inside Docker and terminates child processes cleanly.
- Running as `USER node` restricts file write permissions strictly to `/app/uploads`.

---

## 7. Expected Behavior After Implementation
- Building Docker image does NOT include `.env` file in image layers (`docker run cinepulse-backend ls -a` shows no `.env`).
- Running `whoami` inside container outputs `node`.
- Pushing to GitHub automatically triggers the CI workflow, validating build and test integrity.

---

## 8. Required Tests
1. Test Docker build: `docker build -t cinepulse-test ./server`.
2. Inspect Docker image contents for absence of `.env`: `docker run --rm cinepulse-test ls -la .env` (must fail/not exist).
3. Test container user ID: `docker run --rm cinepulse-test id` (must report `uid=1000(node)`).
4. Test local CI execution using `npm run build && npm test`.

---

## 9. Verification Procedure
```bash
# 1. Verify .dockerignore prevents .env copying
docker build -t cinepulse-backend-secure ./server
docker run --rm cinepulse-backend-secure id
docker run --rm cinepulse-backend-secure test -f .env || echo "PASS: .env is excluded from image"
```

---

## 10. Acceptance Criteria
- [ ] Both `.dockerignore` and `server/.dockerignore` exist and exclude `.env`, `node_modules`, and secrets.
- [ ] `server/Dockerfile` runs under unprivileged `USER node`.
- [ ] `docker-compose.yml` restricts MongoDB port binding to `127.0.0.1`.
- [ ] GitHub Actions CI workflow file is created and valid.

---

## 11. Documentation Updates Required
- Update `QUALITY_CHECKLIST.md` items DEP-01, DEP-02, DEP-03 to `Passed`.
- Update `MEMORY.md` with container security and CI/CD details.

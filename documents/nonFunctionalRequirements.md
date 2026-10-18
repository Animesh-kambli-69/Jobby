# Jobby Non-Functional Requirements

## 1. Scope

These requirements define the infrastructure, deployment, performance, security, scalability, monitoring, and operational tooling required for the Jobby platform.

## 2. Current Infrastructure

The repository currently includes:

- Node.js and Express backend
- MongoDB with Mongoose
- Docker Compose for MongoDB, backend, and frontend
- MongoDB startup index initialization through `Model.init()`
- `/api/health` health-check endpoint
- Graceful HTTP and MongoDB shutdown
- Basic smoke-test script
- Basic custom load-test script
- Cloudinary integration for media storage

## 3. Target Production Architecture

```text
Users
  |
Route 53 + CloudFront
  |
AWS WAF + Application Load Balancer
  |
ECS Fargate service
  |-- Backend task 1
  |-- Backend task 2+
  |
  |-- MongoDB Atlas
  |-- ElastiCache Redis
  |-- Amazon S3 or private Cloudinary
  |-- CloudWatch + Sentry
```

The API must be stateless so that multiple backend instances can run behind a load balancer.

## 4. Infrastructure Tools and Services

| Requirement | Recommended tool/service | Purpose |
|---|---|---|
| Local containerization | Docker and Docker Compose | Reproducible local development |
| Container registry | AWS ECR | Store versioned Docker images |
| API hosting | AWS ECS Fargate | Run backend containers without managing servers |
| Load balancing | AWS Application Load Balancer | Distribute requests across API tasks |
| Auto scaling | ECS Service Auto Scaling | Add or remove API tasks based on load |
| DNS | Amazon Route 53 | Manage production domain records |
| CDN | Amazon CloudFront | Serve frontend assets and reduce latency |
| TLS certificates | AWS Certificate Manager | Provide HTTPS certificates |
| Web firewall | AWS WAF | Block common malicious traffic |
| Database | MongoDB Atlas M10 or higher | Managed MongoDB with replication and backups |
| Cache and shared state | AWS ElastiCache for Redis | Distributed rate limits, caching, and queues |
| File storage | Amazon S3 or private Cloudinary | Store resumes and interview recordings outside MongoDB |
| Secrets | AWS Secrets Manager or SSM Parameter Store | Store JWT, database, Groq, and Cloudinary secrets |
| Logs | Pino with CloudWatch Logs | Centralized structured application logs |
| Error tracking | Sentry | Track exceptions and backend performance |
| Metrics | CloudWatch and OpenTelemetry | Monitor latency, throughput, errors, and AI calls |
| Uptime checks | CloudWatch Synthetics or Better Uptime | Monitor `/api/health` externally |
| CI/CD | GitHub Actions | Test, scan, build, publish, and deploy |
| Dependency scanning | `npm audit`, Snyk, or Dependabot | Detect vulnerable dependencies |
| Image scanning | Trivy or Amazon ECR scanning | Detect vulnerable Docker images |
| Load testing | k6 or Artillery | Test concurrent users and latency targets |
| API documentation | OpenAPI and Swagger UI | Document API contracts |

## 5. Availability and Reliability

- The API must achieve at least 99.5% monthly uptime.
- Production must run at least two backend instances when traffic requires high availability.
- MongoDB Atlas must use a replica set and automated backups.
- ECS tasks must have health checks using `/api/health`.
- Failed containers must restart automatically.
- Deployments must support rollback to the previous image version.
- The application must handle SIGTERM and close HTTP and database connections gracefully.
- Database and external-service failures must return controlled errors without exposing internal details.
- Recovery point objective: no more than one hour of data loss.
- Recovery time objective: no more than four hours.

## 6. Performance Requirements

- Normal API read requests must have p95 latency below 500 ms.
- Job search must complete within two seconds for 1,000 active jobs.
- Resume parsing should complete within 15 seconds when the AI provider is available.
- The system must be load-tested with at least 200 concurrent users.
- Database queries must use appropriate indexes and projections.
- Large resume and video buffers must not be returned in normal user or list responses.
- AI requests must use timeouts, retries with exponential backoff, and bounded concurrency.
- Slow AI and media-processing work should be moved to a queue rather than blocking an HTTP request.

## 7. Database Indexing

The existing email field must remain unique and indexed for login lookup:

```js
email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  index: true
}
```

Required production indexes include:

| Collection | Index | Purpose |
|---|---|---|
| `users` | `{ email: 1 }` unique | Login lookup and duplicate prevention |
| `users` | `{ role: 1, resumeScore: -1 }` | Recruiter candidate ranking |
| `users` | `{ role: 1, skillsNormalized: 1 }` | Candidate skill filtering |
| `jobs` | `{ status: 1, createdAt: -1 }` | Active-job listing |
| `jobs` | `{ recruiterId: 1, status: 1 }` | Recruiter-owned job queries |
| `jobs` | Text index on title, skills, company, and description | Keyword search |
| `applications` | `{ candidateId: 1, appliedAt: -1 }` | Candidate application history |
| `applications` | `{ jobId: 1, matchScore: -1 }` | Applicant ranking |
| `applications` | Unique `{ jobId: 1, candidateId: 1 }` | Prevent duplicate applications |
| `interviewrecordings` | `{ userId: 1 }` | User recording history |
| `interviewrecordings` | `{ cloudinaryPublicId: 1 }` | Recording lookup |

Indexes should be created through controlled migration scripts in production. Startup index initialization may remain enabled for development.

## 8. Rate Limiting and Abuse Protection

Rate limiting must work across all backend instances, so counters must be stored in Redis rather than process memory.

Recommended tools:

- `express-rate-limit`
- `rate-limit-redis`
- `ioredis` or the official `redis` package
- AWS ElastiCache for Redis in production

Recommended limits:

| Endpoint type | Suggested limit |
|---|---:|
| Login | 5 requests per 15 minutes per IP and email combination |
| Registration | 5 requests per hour per IP |
| Resume parsing | 10 requests per hour per authenticated user |
| Interview AI endpoints | Per-user daily quota |
| General API | 100 requests per minute per authenticated user |
| Health endpoint | Exempt or monitored separately |

Rate-limit responses must use HTTP 429 and include a retry indication. Login failures should not reveal whether an email exists.

## 9. Security Requirements

- `JWT_SECRET` must be required at startup and must not have a default value.
- Secrets must be stored in AWS Secrets Manager or SSM Parameter Store.
- HTTPS must be mandatory in production.
- CORS must allow only the configured frontend origin.
- Passwords must use bcrypt with a cost factor of at least 10.
- Login and AI endpoints must be rate-limited.
- User input must be validated at the route boundary.
- Authentication must be required for profile, resume, interview, application, and recruiter operations.
- Authorization must verify the user's role and ownership of requested resources.
- Resume and video files must be private and accessible only to authorized users.
- Raw passwords, JWTs, API keys, and resume contents must never be logged.
- Production errors must not expose stack traces or raw database errors.
- HTTP security headers should be enabled with `helmet`.
- Dependencies and Docker images must be scanned before deployment.

## 10. Observability and Monitoring

The system must provide structured, searchable logs containing:

- Timestamp
- Log level
- Request ID or correlation ID
- HTTP method and route
- Response status
- Request duration
- User ID when authenticated
- Error category

The system must measure:

- Request count and throughput
- p50, p95, and p99 latency
- 4xx and 5xx error rates
- Login success and failure counts
- Rate-limit rejections
- MongoDB query latency and connection-pool usage
- Redis availability and command latency
- Groq request latency, failures, retries, and quota usage
- Cloudinary or S3 upload failures
- ECS CPU, memory, restart count, and task health

Recommended alerts:

- 5xx errors exceed 1% for five minutes.
- p95 API latency exceeds 500 ms.
- Health checks fail repeatedly.
- MongoDB or Redis becomes unavailable.
- Groq failures exceed 10%.
- ECS task restarts increase unexpectedly.
- Disk, memory, or connection-pool usage reaches a configured threshold.

## 11. Caching and Redis Usage

Redis should be introduced only for shared, short-lived, or expensive state:

- Distributed rate-limit counters
- Frequently accessed active-job lists when needed
- Short-lived candidate or search-result cache where invalidation is defined
- AI daily usage counters
- Background job queues
- Temporary refresh-token or session state if refresh tokens are introduced

Redis must not become the source of truth for users, applications, jobs, or resumes. MongoDB remains the primary database.

## 12. Scaling Requirements

- The backend must not depend on local process memory for authentication state.
- The backend must not depend on local disk for uploaded files.
- Backend containers must be horizontally scalable.
- ECS should scale from a minimum of two tasks according to CPU, memory, request count, or latency.
- MongoDB connection pool limits must be sized for the number of backend tasks.
- Redis must be shared by all backend tasks.
- Long-running AI and media operations should use a queue and worker process.
- Large files must be uploaded directly to private object storage where practical.

## 13. Docker Requirements

Production images must:

- Use a supported Node.js LTS base image.
- Use multi-stage builds where appropriate.
- Run as a non-root user.
- Install only production dependencies in the final image.
- Pin dependency versions through lock files.
- Include a health check.
- Log to standard output and error.
- Avoid secrets in Dockerfiles and image layers.
- Set explicit resource limits in the deployment platform.
- Use separate development and production Compose configurations.

The current Compose configuration must not use a public fallback JWT secret. Production startup must fail when the secret is missing.

## 14. Testing and Quality Gates

CI must run the following before deployment:

1. Install dependencies using the lock file.
2. Run linting and formatting checks.
3. Run unit tests.
4. Run API integration tests.
5. Run the existing smoke test against a disposable environment.
6. Build backend and frontend Docker images.
7. Scan dependencies and images for vulnerabilities.
8. Run a basic health-check verification.
9. Deploy to staging.
10. Run staging smoke tests.
11. Run k6 or Artillery load tests before a major release.

Minimum behavioral coverage should include:

- Successful login
- Missing credentials
- Invalid credentials
- Expired or invalid JWT
- Rate-limit enforcement
- Role authorization
- Database failure behavior
- Health endpoint behavior
- File-access authorization

## 15. Backup and Disaster Recovery

- MongoDB Atlas continuous backup and point-in-time restore must be enabled.
- Daily snapshots should be retained for seven days.
- Weekly snapshots should be retained for four weeks.
- Cloudinary or S3 media backup must be configured separately from MongoDB backups.
- A restore drill must be performed at least quarterly.
- Restore verification must include database connectivity, health checks, and smoke tests.
- Rollback instructions must be documented in an operational runbook.

## 16. Implementation Priority

### Priority 0: Before Production

- Remove the default JWT secret.
- Add authentication and role checks to every protected write operation.
- Add rate limiting to login and AI endpoints.
- Validate and normalize emails.
- Configure private secret storage.
- Enable HTTPS and restricted CORS.
- Configure MongoDB Atlas backups.
- Add structured logs and error monitoring.
- Move large files out of MongoDB documents.

### Priority 1: Production Readiness

- Deploy containers to ECS Fargate behind an ALB.
- Add Redis-backed rate limiting.
- Add autoscaling policies.
- Add CI/CD with image and dependency scanning.
- Add k6 or Artillery load tests.
- Add dashboards and alerts.
- Add database migration scripts.

### Priority 2: Scale Optimization

- Add Redis caching where measurements justify it.
- Add background workers for AI and media processing.
- Add CloudFront for frontend delivery.
- Add distributed tracing with OpenTelemetry.
- Tune MongoDB connection pools and ECS resources using load-test results.

## 17. Acceptance Targets

The implementation is production-ready when:

- The API maintains 99.5% monthly availability.
- API read requests remain below 500 ms p95 under the agreed load.
- The system passes a 200-concurrent-user load test.
- Login and AI routes reject excessive traffic with HTTP 429.
- Multiple backend instances share rate-limit and queue state correctly.
- No production secret is stored in source code or Docker images.
- MongoDB backups and restore procedures have been verified.
- Monitoring detects elevated errors, latency, dependency failures, and container health problems.
- CI/CD can deploy and roll back a versioned container image.

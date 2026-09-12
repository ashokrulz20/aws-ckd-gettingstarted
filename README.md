# FDE Customer Deployment & Value Studio — Railway Edition

A recruiter-facing Forward Deployed AI Engineering demo showing how an enterprise AI engagement moves from discovery to measurable business value.

## Capabilities
- Customer discovery and use-case canvas
- Weighted production-readiness scoring
- GO / CONDITIONAL GO / NO-GO deployment gates
- Pilot → Canary → Production rollout planning
- ROI, annual value and payback calculation
- Executive deployment/value brief
- Health endpoint for Railway production checks

## Runtime
- Node.js 20+
- No external dependencies
- No API keys or `.env` secrets required
- Start: `node server.js`
- Health: `/health`

## Key APIs
- `GET /health`
- `GET /api/demo`
- `POST /api/readiness`
- `POST /api/roi`
- `POST /api/rollout`
- `POST /api/report`
- `GET /api/architecture`

Designed by Ashok Kumar Manohar for a Forward Deployed AI Engineering portfolio.

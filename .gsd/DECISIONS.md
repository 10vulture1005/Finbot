# DECISIONS.md — Architectural Decision Records

## ADR-001: SSE over WebSocket for Swarm Streaming
**Date**: 2026-06-09
**Status**: Accepted
**Context**: Need real-time streaming from backend swarm agents to frontend.
**Decision**: Use Server-Sent Events (SSE) instead of WebSockets.
**Rationale**: SSE is simpler (unidirectional), natively supported by browsers via EventSource, works with FastAPI's StreamingResponse, and fits the use case (server→client only). No need for bidirectional communication.

## ADR-002: Stateless Swarm (No DB Persistence)
**Date**: 2026-06-09
**Status**: Accepted
**Context**: Whether to persist swarm plans in the database.
**Decision**: Swarm is stateless — plans are generated and returned via SSE, not stored.
**Rationale**: Keeps the feature lightweight. Persistent goal tracking is a separate feature (idea.md #3). Users can screenshot or copy the plan.

## ADR-003: Groq for LLM Inference
**Date**: 2026-06-09
**Status**: Accepted
**Context**: Which LLM provider to use for the swarm agents.
**Decision**: Use Groq (already in requirements.txt).
**Rationale**: Fast inference speed is critical for streaming UX. Groq provides sub-second token generation which makes the swarm feel responsive.

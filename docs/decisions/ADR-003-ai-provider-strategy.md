# ADR-003: Support Customer-Controlled AI Providers

**Status:** Proposed  
**Date:** 2026-08-04

## Context

LabPulse may use AI for summaries, explanations, mapping suggestions, and natural-language interaction.

The founder does not want all customers to consume a single personal AI account.

## Options Considered

1. All AI usage billed through one LabPulse account
2. Each user supplies an API key
3. Each organization configures an approved provider
4. Disable external AI and use deterministic features only

## Proposed Decision

Design a provider abstraction that supports organization-controlled AI providers.

During the prototype, AI features should remain disabled or use local development configuration outside source control.

The production credential-storage mechanism must be approved before customer credentials are accepted.

## Reasons

- Avoids routing all usage through the founder's account
- Allows provider choice
- Reduces vendor coupling
- Allows AI features to be optional
- Supports organization-level controls

## Risks

- Secure credential storage is complex
- Provider APIs and billing models differ
- Customers may enter invalid credentials
- AI output may be inaccurate
- Imported content may contain prompt injection

## Consequences

- AI must be optional
- Provider code must use a common interface
- Credentials must never reach browser code
- Credentials must never be stored in plain text
- AI must not be the source of financial calculations
- Usage limits and failure handling will be required

## Conditions for Revisiting

Revisit if:

- Providers offer suitable delegated authorization
- LabPulse adopts centrally managed AI billing
- Enterprise customers require private model hosting

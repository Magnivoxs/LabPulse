# LabPulse Product Vision

**Version:** 0.1  
**Status:** Founder Draft  
**Primary User:** Lab Operations Managers

## Product Vision

LabPulse is an operations intelligence platform designed for dental laboratory organizations.

It transforms disconnected spreadsheets, financial reports, labor models, staffing records, and operational reports into standardized information, actionable recommendations, and decision-support tools.

LabPulse should help managers move beyond asking:

> What happened?

The platform should help them answer:

> Why did it happen, what is likely to happen next, and what action should I take?

## Mission

Give Lab Operations Managers a single place to monitor location performance, identify operational risks, compare offices, model staffing decisions, and understand the likely financial effect of their decisions.

## Product Positioning

LabPulse is not intended to be only a reporting dashboard.

It is intended to become a decision-support platform for dental laboratory operations.

Its primary value should come from:

- Standardizing disconnected operational data
- Comparing performance across locations
- Identifying staffing and financial risks
- Explaining changes in important metrics
- Modeling possible operational decisions
- Recommending practical next actions

## Primary MVP User

The initial MVP is designed for:

**Lab Operations Managers**

Typical responsibilities may include:

- Managing performance across multiple laboratories
- Monitoring revenue and payroll
- Reviewing overtime
- Evaluating labor-model compliance
- Identifying hiring needs
- Evaluating employee transfers
- Comparing office performance
- Supporting recruiting decisions
- Reviewing productivity
- Communicating results to leadership

## Primary MVP Outcome

The MVP should help Lab Operations Managers:

- Compare location performance
- Reduce avoidable overtime
- Improve staffing decisions
- Identify revenue and labor risks
- Standardize recurring operational reporting
- Reduce time spent manually combining spreadsheets
- Model the impact of possible decisions

## First Core Workflow

The first core workflow is:

> Compare performance across locations.

A manager should be able to select multiple locations and compare their operational and financial performance using consistent definitions.

## Core Design Principles

### 1. Actionable over informational

Every major dashboard or analysis page should help the manager understand what action may be appropriate.

### 2. Deterministic calculations before AI

Financial, payroll, staffing, overtime, and break-even calculations must be performed by tested application logic.

AI may explain results, summarize trends, or help users interact with the application, but it must not be the source of truth for calculations.

### 3. One normalized source of truth

Imported source files may use different layouts and naming conventions.

LabPulse should transform them into a standardized internal data model.

Application features should use normalized data rather than relying directly on spreadsheet formatting.

### 4. Upload once, reuse mappings

The intended import workflow is:

1. Upload a file
2. Detect columns
3. Suggest mappings
4. Let the user confirm or correct mappings
5. Validate the data
6. Save the mapping
7. Reuse the mapping during future imports

### 5. Modular architecture

Organizations may operate differently.

Modules, metrics, targets, permissions, and business rules should be configurable where practical.

### 6. Explainable recommendations

Recommendations should show:

- The data used
- The formula or rule applied
- The assumptions made
- The expected effect
- The confidence or limitation of the recommendation

## MVP Product Modules

### Executive Dashboard

Potential metrics include:

- Revenue
- Labor cost
- Labor percentage
- Overtime hours
- Overtime cost
- Technician count
- Revenue per technician
- Labor-model variance
- Open positions
- Location alerts
- Performance trends

### Location Comparison

Users should be able to compare selected locations using standardized metrics.

Potential comparison areas include:

- Revenue
- Revenue growth
- Labor cost
- Labor percentage
- Overtime
- Staffing
- Productivity
- Vacancies
- Labor-model compliance
- Training status
- Quality indicators
- Equipment risks

### Labor Model

Potential functions include:

- Expected staffing
- Actual staffing
- Staffing variance
- Labor percentage
- Revenue capacity
- Revenue per technician
- Hiring need
- Transfer opportunity
- Risk indicators

### Revenue Intelligence

Potential reporting periods include:

- Daily
- Weekly
- Monthly
- Quarterly
- Yearly
- Rolling twelve months

Potential functions include:

- Trend analysis
- Growth calculations
- Forecasting
- Variance analysis
- Location comparisons

### Overtime Intelligence

Potential functions include:

- Overtime by location
- Overtime by employee
- Overtime by department
- Overtime reason tracking
- Overtime cost
- Overtime trend analysis
- Projected overtime
- Recommended actions

### Recruiting and Staffing

Potential functions include:

- Open positions
- Position priority
- Time to fill
- Offer status
- Expected start date
- Staffing gaps
- Hiring recommendations
- Recruiting risk indicators

### Transfer Analysis

Potential functions include:

- Identify understaffed locations
- Identify potentially overstaffed locations
- Compare employee skills with location needs
- Estimate payroll effects
- Estimate overtime reduction
- Estimate travel or relocation effects
- Estimate training time
- Present transfer recommendations for manager review

## Scenario Engine

The scenario engine is a central product feature.

It should allow users to model questions such as:

- What happens if we hire one technician?
- Will the hire reduce overtime enough to justify the additional payroll?
- What happens if revenue increases by ten percent?
- What happens if revenue decreases by ten percent?
- What happens if one technician leaves?
- What happens if overtime is reduced by twenty-five percent?
- What happens if an employee transfers between two locations?
- What happens if production capacity changes?
- What happens if a location adds equipment?
- What happens if operating hours change?

Potential outputs include:

- Payroll change
- Labor-percentage change
- Overtime change
- Capacity change
- Revenue change
- Estimated break-even period
- Estimated return on investment
- Staffing variance
- Location risk
- Assumptions
- Recommended actions

## Recommendation Engine

The recommendation engine should not automatically make operational decisions.

It should provide recommendations for manager review.

Example:

> Overtime at Location 101 has exceeded its configured target for four consecutive weeks. Based on current revenue, staffing, and overtime patterns, hiring one technician may reduce overtime cost but would increase total payroll. Review the scenario model before opening a position.

Recommendations should be traceable to deterministic rules whenever possible.

## Future AI Capabilities

Potential AI-supported features include:

- Executive summaries
- Weekly operating reviews
- Plain-language explanations
- Natural-language queries
- Trend summaries
- Draft action plans
- Import mapping assistance
- Data-quality explanations

Example questions may include:

- Why did overtime increase last month?
- Which locations are above their labor target?
- Which locations may need another technician?
- What changed most significantly this week?
- What should I prioritize today?

## AI Provider Strategy

LabPulse must not require all customers to use the founder's personal AI account.

The architecture should support customer-controlled AI access.

Potential providers include:

- OpenAI
- Anthropic
- Google Gemini

The application should use a provider abstraction layer so that business logic is not tightly coupled to one AI vendor.

User or organization AI credentials must never be exposed to the browser, written to logs, committed to GitHub, or stored as plain text.

The production credential-storage design must be reviewed before AI integrations are enabled.

## Proposed Technology Direction

The current proposed stack is:

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Recharts

### Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions where appropriate
- Row-Level Security

### Development and Deployment

- GitHub
- GitHub Actions
- Vercel
- Environment-based configuration
- Automated linting, type checking, and tests

This stack is provisional and should be confirmed through architecture decision records before implementation.

## High-Level Roadmap

### Phase 0: Discovery and definition

- Define product requirements
- Define metrics
- Inventory source data
- Define users and roles
- Define business rules
- Define security requirements

### Phase 1: Prototype

- Create a synthetic-data dashboard
- Create location comparison workflows
- Create a prototype scenario engine
- Gather feedback from operations users

### Phase 2: Foundation

- Initialize the application
- Implement authentication
- Implement tenant isolation
- Implement role-based permissions
- Establish database migrations and testing

### Phase 3: Data ingestion

- Upload CSV and Excel files
- Map columns
- Validate data
- Save mapping templates
- Maintain import history
- Calculate data-quality scores

### Phase 4: Operational intelligence

- Location comparison
- Revenue analytics
- Labor-model analytics
- Overtime analytics
- Staffing analytics
- Alerts and recommendations

### Phase 5: Decision support

- Scenario modeling
- Break-even calculations
- Transfer analysis
- Hiring analysis
- Forecasting
- Explainable recommendations

### Phase 6: Production readiness

- Security review
- Performance testing
- Data retention controls
- Monitoring
- Documentation
- Customer onboarding
- Billing strategy


from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="DarkIntent API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


OPPORTUNITIES = [
    {
        "id": "DI-001",
        "company": "Northstar Cloud",
        "title": "Recurring memory pressure in production",
        "source": "GitHub",
        "technology": "Kubernetes",
        "severity": "High",
        "status": "New",
        "score": 91,
        "recency": "2 hours ago",
        "signal": "Our pods keep restarting after memory usage spikes "
                  "during traffic peaks. We are still investigating.",
        "problem": "Repeated memory spikes appear to be causing "
                   "production pod restarts.",
        "evidence": [
            "Public technical discussion describes recurring failures.",
            "The reported issue relates to infrastructure monitoring.",
            "Company and product fit require further verification.",
        ],
        "recommended_action": "Offer a short technical explanation "
                              "and ask whether they have identified "
                              "the root cause.",
    },
    {
        "id": "DI-002",
        "company": "Meridian Commerce",
        "title": "Slow database queries during peak load",
        "source": "Hacker News",
        "technology": "PostgreSQL",
        "severity": "Medium",
        "status": "Qualified",
        "score": 78,
        "recency": "1 day ago",
        "signal": "We are seeing query latency rise sharply when "
                  "our workload increases.",
        "problem": "Database performance appears to degrade "
                   "under heavier workloads.",
        "evidence": [
            "The discussion describes a performance bottleneck.",
            "Monitoring and diagnostics may be relevant.",
            "Company fit is an initial hypothesis, not confirmed intent.",
        ],
        "recommended_action": "Share a relevant database diagnostics "
                              "resource and seek more context.",
    },
    {
        "id": "DI-003",
        "company": "Atlas Developer Tools",
        "title": "Unreliable deployment pipeline",
        "source": "GitHub",
        "technology": "CI/CD",
        "severity": "Medium",
        "status": "Contacted",
        "score": 72,
        "recency": "3 days ago",
        "signal": "Our deployment jobs intermittently fail, "
                  "but rerunning them usually works.",
        "problem": "Intermittent deployment failures may be "
                   "increasing engineering overhead.",
        "evidence": [
            "The public report describes repeated pipeline failures.",
            "Developer productivity tooling may be relevant.",
            "Commercial interest has not been established.",
        ],
        "recommended_action": "Offer a practical troubleshooting checklist.",
    },
]


class ScoreRequest(BaseModel):
    severity: str
    relevance: int = Field(ge=0, le=100)
    company_fit: int = Field(ge=0, le=100)
    recency: int = Field(ge=0, le=100)


class OutreachRequest(BaseModel):
    opportunity_id: str
    product_name: str = "our technical platform"
    sender_name: str = "The DarkIntent team"
    extra_context: Optional[str] = None


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "DarkIntent API"}


@app.get("/api/opportunities")
def list_opportunities():
    return {"items": OPPORTUNITIES, "count": len(OPPORTUNITIES)}


@app.get("/api/opportunities/{opportunity_id}")
def get_opportunity(opportunity_id: str):
    for opportunity in OPPORTUNITIES:
        if opportunity["id"] == opportunity_id:
            return opportunity
    raise HTTPException(status_code=404, detail="Opportunity not found")


@app.post("/api/score")
def score_opportunity(request: ScoreRequest):
    severity_weights = {"high": 100, "medium": 65, "low": 30}
    severity_score = severity_weights.get(request.severity.lower(), 30)

    score = round(
        severity_score * 0.35
        + request.relevance * 0.30
        + request.company_fit * 0.25
        + request.recency * 0.10
    )

    return {
        "score": score,
        "label": (
            "High priority" if score >= 80
            else "Worth reviewing" if score >= 60
            else "Low priority"
        ),
        "explanation": (
            "Prototype heuristic based on severity, product relevance, "
            "company fit and recency. It does not establish buying intent."
        ),
    }


@app.post("/api/outreach")
def generate_outreach(request: OutreachRequest):
    opportunity = next(
        (
            item for item in OPPORTUNITIES
            if item["id"] == request.opportunity_id
        ),
        None,
    )

    if opportunity is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    context = (
        f"\n\nAdditional context: {request.extra_context.strip()}"
        if request.extra_context and request.extra_context.strip()
        else ""
    )

    draft = (
        "Hi there,\n\n"
        f"I came across a public discussion about "
        f"{opportunity['problem'].lower()} "
        "and thought this might be useful to share.\n\n"
        f"{request.product_name} may be relevant because "
        "it can help teams investigate technical issues like this. "
        "I don't want to assume it is a current priority for your team, "
        "but would a short, practical overview be useful?"
        f"{context}\n\n"
        f"Best,\n{request.sender_name}"
    )

    return {
        "opportunity_id": opportunity["id"],
        "draft": draft,
        "note": "Template-generated prototype draft; review before sending.",
    }

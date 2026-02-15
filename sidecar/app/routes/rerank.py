"""
POST /rerank — Rescore retrieved documents against a query
using a cross-encoder model.
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field


router = APIRouter()


class RerankRequest(BaseModel):
    query: str = Field(..., min_length=1, description="The search query")
    documents: list[str] = Field(
        ..., min_length=1, description="Candidate document chunks to rerank"
    )


class RerankResponse(BaseModel):
    scores: list[float]
    count: int


@router.post("/rerank", response_model=RerankResponse)
async def rerank(req: RerankRequest, request: Request):
    """Rerank candidate documents against the query."""
    reranker = request.app.state.reranker
    scores = reranker.rerank(req.query, req.documents)

    return RerankResponse(
        scores=scores,
        count=len(scores),
    )

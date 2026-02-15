"""
POST /embed — Generate embeddings for a batch of text chunks.
Replaces OpenAI API calls with local inference to reduce cost.
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field


router = APIRouter()


class EmbedRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, description="Text chunks to embed")


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]
    dimension: int
    count: int


@router.post("/embed", response_model=EmbedResponse)
async def embed(req: EmbedRequest, request: Request):
    """Generate embeddings for the provided text chunks."""
    embedder = request.app.state.embedder
    vectors = embedder.embed(req.texts)

    return EmbedResponse(
        embeddings=vectors,
        dimension=embedder.dimension,
        count=len(vectors),
    )

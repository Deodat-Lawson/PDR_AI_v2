"""
POST /extract-entities — Extract named entities from text chunks.
Used by the Graph RAG pipeline to build the knowledge graph.
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field


router = APIRouter()


class Entity(BaseModel):
    text: str
    label: str
    score: float


class ChunkEntities(BaseModel):
    text: str
    entities: list[Entity]


class ExtractEntitiesRequest(BaseModel):
    chunks: list[str] = Field(
        ..., min_length=1, description="Text chunks to extract entities from"
    )


class ExtractEntitiesResponse(BaseModel):
    results: list[ChunkEntities]
    total_entities: int


@router.post("/extract-entities", response_model=ExtractEntitiesResponse)
async def extract_entities(req: ExtractEntitiesRequest, request: Request):
    """Extract named entities from the provided text chunks."""
    extractor = request.app.state.entity_extractor
    raw_results = extractor.extract(req.chunks)

    results = []
    total = 0
    for item in raw_results:
        entities = [
            Entity(text=e["text"], label=e["label"], score=e["score"])
            for e in item["entities"]
        ]
        total += len(entities)
        results.append(ChunkEntities(text=item["text"], entities=entities))

    return ExtractEntitiesResponse(results=results, total_entities=total)

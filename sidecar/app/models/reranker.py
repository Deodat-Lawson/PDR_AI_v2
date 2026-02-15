"""
Reranker model wrapper.
Uses a cross-encoder to rescore query-document pairs.
"""

import os
from sentence_transformers import CrossEncoder


DEFAULT_MODEL = os.getenv(
    "RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-12-v2"
)
DEFAULT_DEVICE = os.getenv("DEVICE", "cpu")


class Reranker:
    """Wraps a cross-encoder for reranking retrieved documents."""

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,
        device: str = DEFAULT_DEVICE,
    ):
        print(f"[Reranker] Loading model {model_name} on {device}...")
        self.model = CrossEncoder(model_name, device=device)
        print("[Reranker] Ready.")

    def rerank(
        self,
        query: str,
        documents: list[str],
    ) -> list[float]:
        """
        Score each document against the query.
        Returns a list of relevance scores (higher = more relevant).
        """
        if not documents:
            return []

        pairs = [(query, doc) for doc in documents]
        scores = self.model.predict(pairs, show_progress_bar=False)
        return scores.tolist()

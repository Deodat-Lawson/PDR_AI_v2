"""
Embedding model wrapper.
Uses sentence-transformers to produce embeddings locally,
replacing OpenAI API calls to reduce cost.
"""

import os
from sentence_transformers import SentenceTransformer


DEFAULT_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-large-en-v1.5")
DEFAULT_DEVICE = os.getenv("DEVICE", "cpu")


class Embedder:
    """Wraps a sentence-transformer model for local embedding generation."""

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,
        device: str = DEFAULT_DEVICE,
    ):
        print(f"[Embedder] Loading model {model_name} on {device}...")
        self.model = SentenceTransformer(model_name, device=device)
        self.dimension = self.model.get_sentence_embedding_dimension()
        print(f"[Embedder] Ready — dimension={self.dimension}")

    def embed(self, texts: list[str]) -> list[list[float]]:
        """
        Generate embeddings for a list of texts.
        Returns a list of float vectors.
        """
        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embeddings.tolist()

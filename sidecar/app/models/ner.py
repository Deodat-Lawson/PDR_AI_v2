"""
Entity extraction model wrapper.
Uses a transformer-based NER model to extract entities and relationships
from text chunks for the Graph RAG pipeline.
"""

import os
import re
from transformers import pipeline, Pipeline


DEFAULT_MODEL = os.getenv("NER_MODEL", "dslim/bert-base-NER")
DEFAULT_DEVICE = os.getenv("DEVICE", "cpu")

# Map device string to transformers device index
DEVICE_MAP = {"cpu": -1, "cuda": 0, "cuda:0": 0, "cuda:1": 1}


class EntityExtractor:
    """Wraps a token-classification (NER) pipeline."""

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,
        device: str = DEFAULT_DEVICE,
    ):
        print(f"[EntityExtractor] Loading model {model_name} on {device}...")
        device_idx = DEVICE_MAP.get(device, -1)
        self.pipe: Pipeline = pipeline(
            "ner",
            model=model_name,
            aggregation_strategy="simple",
            device=device_idx,
        )
        print("[EntityExtractor] Ready.")

    def extract(self, texts: list[str]) -> list[dict]:
        """
        Extract entities from a list of text chunks.

        Returns a list of dicts per chunk:
        {
            "text": "<original chunk>",
            "entities": [
                {"text": "Microsoft", "label": "ORG", "score": 0.99},
                ...
            ]
        }
        """
        results: list[dict] = []

        for text in texts:
            # Truncate very long texts to avoid OOM
            truncated = text[:2048]
            raw = self.pipe(truncated)

            entities: list[dict] = []
            seen: set[str] = set()

            for ent in raw:
                word = ent["word"].strip()
                # Clean up sub-word tokens
                word = re.sub(r"^##", "", word).strip()
                if not word or len(word) < 2:
                    continue

                key = f"{word.lower()}|{ent['entity_group']}"
                if key in seen:
                    continue
                seen.add(key)

                entities.append(
                    {
                        "text": word,
                        "label": ent["entity_group"],
                        "score": round(float(ent["score"]), 4),
                    }
                )

            results.append({"text": truncated, "entities": entities})

        return results

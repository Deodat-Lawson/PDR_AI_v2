# Usage Examples

## Upload with OCR enabled

```typescript
const formData = new FormData();
formData.append("file", pdfFile);
formData.append("categoryId", selectedCategoryId);
formData.append("enableOCR", "true");

const response = await fetch("/api/uploadDocument", {
  method: "POST",
  body: formData,
});

const result = await response.json();
```

## Predictive analysis request

```typescript
const response = await fetch("/api/agents/predictive-document-analysis", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    documentId: "doc_123",
    categoryId: "cat_456",
  }),
});

const analysis = await response.json();
```

## Document Q&A request

```typescript
const response = await fetch("/api/LangChain", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    documentId: "doc_123",
    message: "What are the key compliance requirements?",
    categoryId: "cat_456",
  }),
});

const answer = await response.json();
```

## OCR provider notes

- OCR behavior is controlled through provider keys in environment variables.
- If OCR UI options are not visible, verify OCR keys are present.
- Use OCR for scanned/image-based PDFs; digital PDFs usually do not need it.

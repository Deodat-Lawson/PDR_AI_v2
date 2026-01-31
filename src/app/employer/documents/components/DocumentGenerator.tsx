import { useState } from 'react';
import { DocumentGeneratorHome } from './DocumentGeneratorHome';
import { DocumentGeneratorConfig, type DocumentConfig } from './DocumentGeneratorConfig';
import { DocumentGeneratorEditor } from './DocumentGeneratorEditor';

interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: string;
}

interface GeneratedDocument {
  id: string;
  title: string;
  template: string;
  lastEdited: string;
  content: string;
}

export function DocumentGenerator() {
  const [currentView, setCurrentView] = useState<'home' | 'config' | 'editor'>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [currentDocument, setCurrentDocument] = useState<GeneratedDocument | null>(null);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([
    {
      id: '1',
      title: 'Q4 Marketing Strategy Report',
      template: 'Business Report',
      lastEdited: '2 hours ago',
      content: `# Q4 Marketing Strategy Report

## Executive Summary

This report outlines our comprehensive marketing strategy for Q4 2025, focusing on digital transformation and customer engagement initiatives.

## Market Analysis

The current market landscape shows significant opportunities in the following areas:

- Digital advertising growth of 23% year-over-year
- Increased customer preference for personalized content
- Rising importance of social media engagement

## Strategic Objectives

1. Increase brand awareness by 40%
2. Drive 25% growth in online conversions
3. Enhance customer retention rates

## Recommended Initiatives

### Digital Campaign Expansion
We propose expanding our digital advertising budget by 30% to capitalize on emerging platforms and technologies.

### Content Marketing
Develop a comprehensive content marketing strategy focusing on thought leadership and customer education.

## Budget Allocation

Total proposed budget: $500,000
- Digital Advertising: 40%
- Content Creation: 25%
- Analytics & Tools: 20%
- Experimentation: 15%

## Timeline

- Week 1-2: Campaign planning and creative development
- Week 3-6: Implementation and launch
- Week 7-12: Monitoring and optimization

## Conclusion

This strategy positions us for significant growth in Q4 while building a foundation for continued success.`
    },
    {
      id: '2',
      title: 'Machine Learning Research Paper',
      template: 'Research Paper',
      lastEdited: '1 day ago',
      content: `# Advanced Machine Learning Techniques for Data Classification

## Abstract

This paper presents novel approaches to data classification using advanced machine learning techniques. Our research demonstrates significant improvements in accuracy and efficiency compared to traditional methods.

## Introduction

Machine learning has revolutionized how we approach data analysis and pattern recognition. This research explores cutting-edge techniques that push the boundaries of classification accuracy.

## Literature Review

Previous research in this field has established foundational principles that guide our work. Notable contributions include:

- Deep learning architectures for feature extraction
- Ensemble methods for improved prediction
- Transfer learning for domain adaptation

## Methodology

Our research employs a mixed-methods approach combining:

1. Supervised learning algorithms
2. Neural network architectures
3. Cross-validation techniques

## Results

Experimental results show a 15% improvement in classification accuracy compared to baseline models.

## Discussion

These findings have significant implications for real-world applications in healthcare, finance, and autonomous systems.

## Conclusion

This research contributes to the growing body of knowledge in machine learning and opens avenues for future investigation.`
    }
  ]);

  const handleNewDocument = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setCurrentView('config');
  };

  const handleGenerateWithConfig = (config: DocumentConfig) => {
    if (!selectedTemplate) return;

    const generatedContent = generateContentWithConfig(selectedTemplate, config);
    
    const newDoc: GeneratedDocument = {
      id: Date.now().toString(),
      title: config.title,
      template: selectedTemplate.name,
      lastEdited: 'Just now',
      content: generatedContent
    };
    
    setCurrentDocument(newDoc);
    setCurrentView('editor');
  };

  const handleOpenDocument = (document: GeneratedDocument) => {
    setCurrentDocument(document);
    setCurrentView('editor');
  };

  const handleSaveDocument = (title: string, content: string) => {
    if (!currentDocument) return;

    const updatedDoc: GeneratedDocument = {
      ...currentDocument,
      title,
      content,
      lastEdited: 'Just now'
    };

    setGeneratedDocuments(prev => {
      const existing = prev.find(doc => doc.id === currentDocument.id);
      if (existing) {
        return prev.map(doc => doc.id === currentDocument.id ? updatedDoc : doc);
      } else {
        return [...prev, updatedDoc];
      }
    });

    setCurrentDocument(updatedDoc);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setCurrentDocument(null);
  };

  const generateInitialContent = (template: DocumentTemplate): string => {
    const templates: Record<string, string> = {
      'blank': '',
      'research': `# Research Paper Title

## Abstract

Write your abstract here...

## Introduction

Provide background and context for your research...

## Literature Review

Review relevant previous research...

## Methodology

Describe your research methods...

## Results

Present your findings...

## Discussion

Analyze and interpret your results...

## Conclusion

Summarize your research and its implications...

## References

List your citations here...`,

      'report': `# Business Report

## Executive Summary

Provide a brief overview of the key findings and recommendations...

## Background

Describe the context and purpose of this report...

## Analysis

Present your detailed analysis...

### Key Findings

- Finding 1
- Finding 2
- Finding 3

## Recommendations

Based on the analysis, we recommend the following actions...

## Conclusion

Summarize the main points and next steps...`,

      'proposal': `# Project Proposal

## Project Overview

Describe the project and its objectives...

## Objectives

- Objective 1
- Objective 2
- Objective 3

## Scope of Work

Detail the specific tasks and deliverables...

## Timeline

Outline the project schedule and milestones...

## Budget

Provide cost estimates and resource requirements...

## Expected Outcomes

Describe the anticipated results and benefits...`,

      'technical': `# Technical Documentation

## Overview

Provide a high-level overview of the system or feature...

## System Architecture

Describe the technical architecture...

## Components

### Component 1
Description and specifications...

### Component 2
Description and specifications...

## API Reference

Document the available APIs and endpoints...

## Configuration

Explain configuration options and setup...

## Troubleshooting

Common issues and solutions...`,

      'meeting': `# Meeting Notes

**Date:** ${new Date().toLocaleDateString()}
**Time:** 
**Location:** 
**Attendees:** 

## Agenda

1. Item 1
2. Item 2
3. Item 3

## Discussion Points

### Topic 1
Key points discussed...

### Topic 2
Key points discussed...

## Decisions Made

- Decision 1
- Decision 2

## Action Items

- [ ] Action item 1 - Owner: [Name] - Due: [Date]
- [ ] Action item 2 - Owner: [Name] - Due: [Date]

## Next Steps

Outline the path forward...`,

      'whitepaper': `# Whitepaper Title

## Executive Summary

Provide a concise overview of the key points...

## The Challenge

Describe the problem or opportunity being addressed...

## The Solution

Present your solution or approach...

### Key Benefits

- Benefit 1
- Benefit 2
- Benefit 3

## How It Works

Explain the technical details or methodology...

## Case Studies

### Case Study 1
Real-world example and results...

## Implementation

Guide for adopting the solution...

## Conclusion

Summarize the value proposition...`,

      'case-study': `# Case Study

## Client Overview

**Company:** 
**Industry:** 
**Size:** 

## The Challenge

Describe the problem the client was facing...

## The Solution

Explain how you addressed the challenge...

## Implementation

Detail the process and timeline...

## Results

### Key Metrics

- Metric 1: [Result]
- Metric 2: [Result]
- Metric 3: [Result]

## Client Testimonial

"Quote from satisfied client..."

## Lessons Learned

Key takeaways from the project...`,

      'guide': `# How-To Guide

## Introduction

What readers will learn from this guide...

## Prerequisites

What you need before starting...

## Step 1: [First Step]

Detailed instructions for the first step...

## Step 2: [Second Step]

Detailed instructions for the second step...

## Step 3: [Third Step]

Detailed instructions for the third step...

## Tips and Best Practices

- Tip 1
- Tip 2
- Tip 3

## Troubleshooting

Common issues and how to resolve them...

## Conclusion

Summary and next steps...`,

      'policy': `# Policy Document

## Purpose

State the purpose of this policy...

## Scope

Define who this policy applies to...

## Policy Statement

Detail the policy requirements...

## Responsibilities

### Role 1
Specific responsibilities...

### Role 2
Specific responsibilities...

## Procedures

Step-by-step procedures for compliance...

## Compliance

How compliance will be monitored...

## Review and Updates

Schedule for policy review...`,

      'newsletter': `# Newsletter - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

## Editor's Note

Welcome message from the editor...

## Highlights This Month

- Highlight 1
- Highlight 2
- Highlight 3

## Featured Story

### [Story Title]

Full article content...

## Team Updates

News and updates from the team...

## Upcoming Events

- Event 1: [Date]
- Event 2: [Date]

## Resources

Helpful links and resources...`,

      'sop': `# Standard Operating Procedure

**SOP Number:** 
**Effective Date:** 
**Last Reviewed:** 

## Purpose

State the purpose of this SOP...

## Scope

Define what this procedure covers...

## Responsibilities

Who is responsible for each step...

## Procedure

### Step 1
Detailed instructions...

### Step 2
Detailed instructions...

### Step 3
Detailed instructions...

## Safety Considerations

Important safety notes...

## Quality Standards

Standards that must be met...

## Documentation Requirements

What records must be kept...

## References

Related documents and resources...`
    };

    return templates[template.id] ?? templates.blank ?? '';
  };

  const generateContentWithConfig = (template: DocumentTemplate, _config: DocumentConfig): string => {
    const initialContent = generateInitialContent(template);
    // Here you can add logic to replace placeholders in the initial content with values from the config
    // For example, if the config has a title, you can replace a placeholder in the initial content with the title
    return initialContent;
  };

  if (currentView === 'editor' && currentDocument) {
    return (
      <div className="h-full">
        <DocumentGeneratorEditor
          initialTitle={currentDocument.title}
          initialContent={currentDocument.content}
          onBack={handleBackToHome}
          onSave={handleSaveDocument}
        />
      </div>
    );
  }

  if (currentView === 'config' && selectedTemplate) {
    return (
      <div className="h-full">
        <DocumentGeneratorConfig
          template={selectedTemplate}
          onBack={handleBackToHome}
          onGenerate={handleGenerateWithConfig}
        />
      </div>
    );
  }

  return (
    <div className="h-full">
      <DocumentGeneratorHome
        onNewDocument={handleNewDocument}
        onOpenDocument={handleOpenDocument}
        generatedDocuments={generatedDocuments}
      />
    </div>
  );
}



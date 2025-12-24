"use client";

import React from "react";
import type { MissingDocument, ResolvedDocument } from "./types";

interface MissingItemProps {
  doc: MissingDocument;
  index: number;
  onSelectDocument?: (docId: number, page: number) => void;
  setPdfPageNumber: (page: number) => void;
}

export const MissingItem: React.FC<MissingItemProps> = ({ doc, index, onSelectDocument, setPdfPageNumber }) => (
  <div key={index} className="border-l-4 border-orange-400 dark:border-orange-500 pl-4 py-3 bg-orange-50 dark:bg-orange-900/20 rounded-md">
    <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between">
      {doc.documentName}
      {doc.resolvedIn && (
        <button
          onClick={() => onSelectDocument?.(doc.resolvedIn!.documentId, doc.resolvedIn!.page)}
          className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-900/50 ml-2"
        >
          View in {doc.resolvedIn.documentTitle ?? `Document ${doc.resolvedIn.documentId}`}
        </button>
      )}
    </div>
    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{doc.reason}</div>
    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
      Type: {doc.documentType} | Priority: {doc.priority}
    </div>
    <button
      onClick={() => setPdfPageNumber(doc.page)}
      className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded mt-1 hover:bg-orange-200 dark:hover:bg-orange-900/50"
    >
      Original Reference: Page {doc.page}
    </button>
    {doc.suggestedCompanyDocuments && doc.suggestedCompanyDocuments.length > 0 && (
      <div className="mt-2">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Possible Company Documents:</div>
        <div className="mt-1 space-y-1">
          {doc.suggestedCompanyDocuments.map((companyDoc, companyIndex) => (
            <div key={companyIndex} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded p-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onSelectDocument?.(companyDoc.documentId, companyDoc.page)}
                  className="text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline"
                >
                  {companyDoc.documentTitle}
                </button>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {Math.round(companyDoc.similarity * 100)}% match
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Page {companyDoc.page}: {companyDoc.snippet}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    {doc.suggestedLinks && doc.suggestedLinks.length > 0 && (
      <div className="mt-2">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">External Suggested Links:</div>
        <ul className="list-disc pl-4 mt-1 text-xs text-blue-600 dark:text-blue-400">
          {doc.suggestedLinks.map((link, linkIndex) => (
            <li key={linkIndex}>
              <a href={link.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {link.title}
              </a>
              <p className="text-gray-500 dark:text-gray-400">{link.snippet}</p>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

interface ResolvedItemProps {
  doc: ResolvedDocument;
  index: number;
  onSelectDocument?: (docId: number, page: number) => void;
  setPdfPageNumber: (page: number) => void;
}

export const ResolvedItem: React.FC<ResolvedItemProps> = ({ doc, index, onSelectDocument, setPdfPageNumber }) => (
  <div key={index} className="border-l-4 border-green-400 dark:border-green-500 pl-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-md">
    <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between">
      {doc.documentName}
      <button
        onClick={() => onSelectDocument?.(doc.resolvedDocumentId, doc.resolvedPage)}
        className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-900/50 ml-2"
      >
        View in {doc.resolvedDocumentTitle ?? `Document ${doc.resolvedDocumentId}`} (Page {doc.resolvedPage})
      </button>
    </div>
    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{doc.reason}</div>
    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
      Type: {doc.documentType} | Priority: {doc.priority}
    </div>
    <button
      onClick={() => setPdfPageNumber(doc.originalPage)}
      className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded mt-1 hover:bg-green-200 dark:hover:bg-green-900/50"
    >
      Original Reference: Page {doc.originalPage}
    </button>
  </div>
);

interface RecommendationItemProps {
  rec: string;
  index: number;
}

export const RecommendationItem: React.FC<RecommendationItemProps> = ({ rec, index }) => (
  <div key={index} className="border-l-4 border-green-400 dark:border-green-500 pl-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-md">
    <div className="text-sm text-gray-600 dark:text-gray-300">{rec}</div>
  </div>
);


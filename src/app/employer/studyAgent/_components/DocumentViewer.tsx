"use client";
import { Document } from "../page";
import { FileText, Image as ImageIcon, FileType } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import exampleImage from "figma:asset/fda7c6111510220b21dcc6995437e2114d411b89.png";

interface DocumentViewerProps {
  document: Document | null;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  if (!document) {
    return (
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4" />
          <p>Select a document to view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-900 flex flex-col">
      {/* Document Toolbar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3 text-white text-sm">
          <FileText className="w-4 h-4" />
          <span>{document.name}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300 text-xs">
          <span>1 of 1</span>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
        {document.type === "pdf" ? (
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full">
            {/* Document content */}
            {document.id === "2" ? (
              <div className="p-12 space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl mb-2">{document.name.replace('.pdf', '')}</h1>
                  <p className="text-gray-600">Document Content</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                  <p>Document preview would appear here</p>
                </div>
              </div>
            ) : (
              <div className="p-12 space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl mb-2">{document.name.replace('.pdf', '')}</h1>
                  <p className="text-gray-600">Sample Document Content</p>
                </div>
                
                <div className="space-y-4 text-gray-700">
                  <h2 className="text-xl">Introduction</h2>
                  <p className="leading-relaxed">
                    This is a sample document viewer. In a real application, this would display the actual PDF content.
                    The AI teacher can reference this material during your tutoring session.
                  </p>

                  <h2 className="text-xl mt-6">Key Concepts</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Understanding core principles and foundations</li>
                    <li>Practical applications and examples</li>
                    <li>Advanced topics and deeper analysis</li>
                    <li>Practice problems and exercises</li>
                  </ul>

                  <h2 className="text-xl mt-6">Summary</h2>
                  <p className="leading-relaxed">
                    Review the key takeaways and ensure you understand the fundamental concepts before moving forward.
                    Feel free to ask your AI teacher questions about any part of this material.
                  </p>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
                    <p className="text-blue-700">
                      <strong>Note:</strong> Ask your teacher to explain any concepts you find challenging. They can break down complex topics into easier-to-understand parts.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : document.type === "image" ? (
          <div className="bg-white rounded-lg shadow-2xl p-4 max-w-4xl">
            {document.url ? (
              <img src={document.url} alt={document.name} className="w-full h-auto rounded" />
            ) : (
              <div className="flex items-center justify-center p-12 text-gray-400">
                <ImageIcon className="w-16 h-16" />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl w-full">
            <div className="flex items-center gap-3 mb-4 text-gray-600">
              <FileType className="w-5 h-5" />
              <span>{document.name}</span>
            </div>
            <div className="text-gray-700 whitespace-pre-wrap">
              Sample text content would appear here...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { FileSearch, AlertTriangle, CheckCircle, AlertCircle, RefreshCw, Check } from "lucide-react";
import styles from "~/styles/Employer/DocumentViewer.module.css";
import type { DocumentType, PredictiveAnalysisResponse } from "./types";
import { MissingItem, ResolvedItem, RecommendationItem } from "./AnalysisItems";
import { Modal } from "./Modal";

interface PredictiveAnalysisSectionProps {
  selectedDoc: DocumentType | null;
  predictiveAnalysis: PredictiveAnalysisResponse | null;
  predictiveLoading: boolean;
  predictiveError: string;
  onRefreshAnalysis: () => void;
  onSelectDocument?: (docId: number, page: number) => void;
  setPdfPageNumber: React.Dispatch<React.SetStateAction<number>>;
  showMissingModal: boolean;
  setShowMissingModal: React.Dispatch<React.SetStateAction<boolean>>;
  showRecommendationsModal: boolean;
  setShowRecommendationsModal: React.Dispatch<React.SetStateAction<boolean>>;
  showResolvedModal: boolean;
  setShowResolvedModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PredictiveAnalysisSection: React.FC<PredictiveAnalysisSectionProps> = ({
  selectedDoc,
  predictiveAnalysis,
  predictiveLoading,
  predictiveError,
  onRefreshAnalysis,
  onSelectDocument,
  setPdfPageNumber,
  showMissingModal,
  setShowMissingModal,
  showRecommendationsModal,
  setShowRecommendationsModal,
  showResolvedModal,
  setShowResolvedModal,
}) => {
  return (
    <div className="mt-6">
      <div className={styles.docHeader}>
        <h1 className={styles.docTitle}>
          {selectedDoc ? selectedDoc.title : "All Documents"}
        </h1>
      </div>
      <div className={styles.summaryHeader}>
        <FileSearch className={styles.summaryIcon} />
        <h2 className={styles.summaryTitle}>Predictive Document Analysis</h2>
        <button
          onClick={onRefreshAnalysis}
          disabled={predictiveLoading}
          className="ml-auto bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
          title="Refresh Analysis"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>

      {predictiveLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Analyzing document...</span>
        </div>
      )}

      {predictiveError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-700 dark:text-red-300">{predictiveError}</span>
          </div>
        </div>
      )}

      {predictiveAnalysis && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 dark:border dark:border-blue-500/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {predictiveAnalysis.summary.totalMissingDocuments}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Missing Documents</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-500/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {predictiveAnalysis.summary.highPriorityItems}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">High Priority</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 dark:border dark:border-yellow-500/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {predictiveAnalysis.summary.totalRecommendations}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Recommendations</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-500/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {predictiveAnalysis.summary.totalSuggestedRelated}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Suggested Related</div>
            </div>
          </div>

          {/* Missing Documents Section */}
          {predictiveAnalysis.analysis.missingDocuments.length > 0 && (
            <div className="bg-white dark:bg-slate-800/90 border dark:border-purple-500/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                <AlertCircle className="w-5 h-5 text-orange-500 dark:text-orange-400 mr-2" />
                Missing Documents
              </h3>
              <div className="space-y-4">
                {/* Show first item inline */}
                {predictiveAnalysis.analysis.missingDocuments[0] && (
                  <MissingItem 
                    doc={predictiveAnalysis.analysis.missingDocuments[0]} 
                    index={0}
                    onSelectDocument={onSelectDocument}
                    setPdfPageNumber={setPdfPageNumber}
                  />
                )}
                {/* View All button if more */}
                {predictiveAnalysis.analysis.missingDocuments.length > 1 && (
                  <button
                    onClick={() => setShowMissingModal(true)}
                    className="text-blue-600 dark:text-blue-400 hover:underline mt-2 text-sm font-medium"
                  >
                    View All ({predictiveAnalysis.analysis.missingDocuments.length} total)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recommendations Section */}
          {predictiveAnalysis.analysis.recommendations.length > 0 && (
            <div className="bg-white dark:bg-slate-800/90 border dark:border-purple-500/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {/* Show first item inline */}
                {predictiveAnalysis.analysis.recommendations[0] && (
                  <RecommendationItem rec={predictiveAnalysis.analysis.recommendations[0]} index={0} />
                )}
                {/* View All button if more */}
                {predictiveAnalysis.analysis.recommendations.length > 1 && (
                  <button
                    onClick={() => setShowRecommendationsModal(true)}
                    className="text-blue-600 dark:text-blue-400 hover:underline mt-2 text-sm font-medium"
                  >
                    View All ({predictiveAnalysis.analysis.recommendations.length} total)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Resolved Documents Section */}
          {predictiveAnalysis.analysis.resolvedDocuments && predictiveAnalysis.analysis.resolvedDocuments.length > 0 && (
            <div className="bg-white dark:bg-slate-800/90 border dark:border-purple-500/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
                Resolved References
              </h3>
              <div className="space-y-3">
                {predictiveAnalysis.analysis.resolvedDocuments[0] && (
                  <ResolvedItem 
                    doc={predictiveAnalysis.analysis.resolvedDocuments[0]} 
                    index={0}
                    onSelectDocument={onSelectDocument}
                    setPdfPageNumber={setPdfPageNumber}
                  />
                )}
                {predictiveAnalysis.analysis.resolvedDocuments.length > 1 && (
                  <button
                    onClick={() => setShowResolvedModal(true)}
                    className="text-blue-600 dark:text-blue-400 hover:underline mt-2 text-sm font-medium"
                  >
                    View All ({predictiveAnalysis.analysis.resolvedDocuments.length} total)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Suggested Related Documents */}
          {predictiveAnalysis.analysis.suggestedRelatedDocuments && predictiveAnalysis.analysis.suggestedRelatedDocuments.length > 0 && (
            <div className="bg-white dark:bg-slate-800/90 border dark:border-purple-500/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                <FileSearch className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
                Suggested Related Documents
              </h3>
              <div className="space-y-3">
                {predictiveAnalysis.analysis.suggestedRelatedDocuments.map((doc, index) => (
                  <div key={index} className="border-l-4 border-blue-400 dark:border-blue-500 pl-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <a
                      href={doc.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {doc.title}
                    </a>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{doc.snippet}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showMissingModal && predictiveAnalysis && (
        <Modal title="All Missing Documents" onClose={() => setShowMissingModal(false)}>
          <div className="space-y-4">
            {predictiveAnalysis.analysis.missingDocuments.map((doc, index) => (
              <MissingItem 
                key={index}
                doc={doc} 
                index={index}
                onSelectDocument={onSelectDocument}
                setPdfPageNumber={setPdfPageNumber}
              />
            ))}
          </div>
        </Modal>
      )}

      {showRecommendationsModal && predictiveAnalysis && (
        <Modal title="All Recommendations" onClose={() => setShowRecommendationsModal(false)}>
          <div className="space-y-3">
            {predictiveAnalysis.analysis.recommendations.map((rec, index) => (
              <RecommendationItem key={index} rec={rec} index={index} />
            ))}
          </div>
        </Modal>
      )}

      {showResolvedModal && predictiveAnalysis?.analysis.resolvedDocuments && (
        <Modal title="All Resolved References" onClose={() => setShowResolvedModal(false)}>
          <div className="space-y-3">
            {predictiveAnalysis.analysis.resolvedDocuments.map((doc, index) => (
              <ResolvedItem 
                key={index}
                doc={doc} 
                index={index}
                onSelectDocument={onSelectDocument}
                setPdfPageNumber={setPdfPageNumber}
              />
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};


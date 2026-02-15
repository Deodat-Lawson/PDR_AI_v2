"use client";

import React, { useState, useRef, useCallback } from "react";
import { Calendar, FileText, FolderPlus, Plus, Upload, Cloud, Database, ExternalLink, AlertCircle } from "lucide-react";
import Link from "next/link";
import { UploadDropzone } from "~/app/utils/uploadthing";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { isUploadAccepted, UPLOAD_ACCEPT_STRING } from "~/lib/upload-accepted";
import styles from "~/styles/Employer/Upload.module.css";

const UNSUPPORTED_FILE_TYPE_MESSAGE =
    "Unsupported file type. Please upload a document or image.";

interface UploadFormData {
    title: string;
    category: string;
    uploadDate: string;
    fileUrl: string | null;
    fileName: string;
    fileMimeType?: string;
    enableOCR: boolean;
}

interface UploadFormProps {
    categories: { id: string; name: string }[];
    useUploadThing: boolean;
    isUploadThingConfigured: boolean;
    onToggleUploadMethod: (useUploadThing: boolean) => Promise<void>;
    isUpdatingPreference: boolean;
}

const UploadForm: React.FC<UploadFormProps> = ({ 
    categories, 
    useUploadThing, 
    isUploadThingConfigured,
    onToggleUploadMethod,
    isUpdatingPreference 
}) => {
    const { userId } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Form State ---
    const [formData, setFormData] = useState<UploadFormData>({
        title: "",
        category: "",
        uploadDate: new Date().toISOString().split("T")[0]!,
        fileUrl: null,
        fileName: "",
        enableOCR: false,
    });

    const [errors, setErrors] = useState<Partial<UploadFormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);

    // --- Handlers ---
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<UploadFormData> = {};

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        }
        if (!formData.category) {
            newErrors.category = "Category is required";
        }
        if (!formData.fileUrl) {
            newErrors.fileUrl = "Please upload a file";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle local file upload (when UploadThing is disabled)
    const handleLocalFileUpload = useCallback(async (file: File) => {
        if (!isUploadAccepted({ name: file.name, type: file.type })) {
            setErrors((prev) => ({ ...prev, fileUrl: UNSUPPORTED_FILE_TYPE_MESSAGE }));
            return;
        }
        if (file.size > 16 * 1024 * 1024) {
            setErrors((prev) => ({ ...prev, fileUrl: "File size must be less than 16MB" }));
            return;
        }

        setIsUploading(true);
        setErrors((prev) => ({ ...prev, fileUrl: undefined }));

        try {
            const formDataToUpload = new FormData();
            formDataToUpload.append("file", file);

            const response = await fetch("/api/upload-local", {
                method: "POST",
                body: formDataToUpload,
            });

            if (!response.ok) {
                const errorData = await response.json() as { error?: string };
                throw new Error(errorData.error ?? "Upload failed");
            }

            const data = await response.json() as { url: string; name: string };
            
            setFormData((prev) => ({
                ...prev,
                fileUrl: data.url,
                fileName: data.name,
                fileMimeType: file.type || undefined,
            }));
        } catch (error) {
            console.error("Upload error:", error);
            setErrors((prev) => ({
                ...prev,
                fileUrl: error instanceof Error ? error.message : "Failed to upload file",
            }));
        } finally {
            setIsUploading(false);
        }
    }, []);

    // Native file input change handler
    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            void handleLocalFileUpload(file);
        }
    }, [handleLocalFileUpload]);

    // Drag and drop handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            void handleLocalFileUpload(file);
        }
    }, [handleLocalFileUpload]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);

            // Determine storage type based on current mode
            // If UploadThing is configured and enabled, use cloud; otherwise database
            const storageType = useUploadThing && isUploadThingConfigured ? "cloud" : "database";

            const response = await fetch("/api/uploadDocument", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    documentName: formData.title,
                    category: formData.category,
                    documentUrl: formData.fileUrl,
                    storageType,
                    mimeType: formData.fileMimeType,
                }),
            });

            if (!response.ok) {
                console.error("Error uploading document");
            } else {
                router.push("/employer/documents");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle toggle change
    const handleToggleChange = useCallback(() => {
        // Clear any uploaded file when switching methods
        setFormData((prev) => ({ ...prev, fileUrl: null, fileName: "", fileMimeType: undefined }));
        void onToggleUploadMethod(!useUploadThing);
    }, [useUploadThing, onToggleUploadMethod]);

    // --- Render Upload Area ---
    const renderUploadArea = () => {
        if (formData.fileUrl) {
            return (
                <div className={styles.fileInfo}>
                    <FileText className={styles.fileIcon} />
                    <span className={styles.fileName}>{formData.fileName}</span>
                    <button
                        type="button"
                        onClick={() =>
                            setFormData((prev) => ({ ...prev, fileUrl: null, fileName: "", fileMimeType: undefined }))
                        }
                        className={styles.removeFile}
                    >
                        Remove
                    </button>
                </div>
            );
        }

        // Use UploadThing if enabled
        if (useUploadThing) {
            return (
                <UploadDropzone
                    endpoint="documentUploaderRestricted"
                    content={{
                        allowedContent: "Documents & images — up to 128MB",
                    }}
                    onClientUploadComplete={(res) => {
                        if (!res?.length) return;
                        const file = res[0]!;
                        setFormData((prev) => ({
                            ...prev,
                            fileUrl: file.url,
                            fileName: file.name,
                            fileMimeType: "type" in file && typeof file.type === "string" ? file.type : undefined,
                        }));
                    }}
                    onUploadError={(error) => {
                        console.error("Upload Error:", error);
                    }}
                    className={styles.uploadArea}
                />
            );
        }

        // Native file upload when UploadThing is disabled
        return (
            <div
                className={`${styles.uploadArea} ${isDragActive ? styles.dragActive : ""}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        fileInputRef.current?.click();
                    }
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={UPLOAD_ACCEPT_STRING}
                    onChange={handleFileInputChange}
                    className={styles.fileInput}
                />
                <Upload className={styles.uploadIcon} />
                {isUploading ? (
                    <p className={styles.uploadText}>Uploading...</p>
                ) : (
                    <>
                        <p className={styles.uploadText}>
                            Drag & drop your file here, or{" "}
                            <span className={styles.browseButton}>browse</span>
                        </p>
                        <p className={styles.uploadHint}>
                            Documents & images — up to 16MB
                        </p>
                    </>
                )}
            </div>
        );
    };

    // --- Render ---
    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {/* Storage Toggle */}
            <div className={styles.storageToggle}>
                <span className={styles.storageToggleLabel}>Upload Storage:</span>
                <div className={styles.toggleContainer}>
                    <button
                        type="button"
                        className={`${styles.toggleOption} ${useUploadThing && isUploadThingConfigured ? styles.toggleOptionActive : ""} ${!isUploadThingConfigured ? styles.toggleOptionDisabled : ""}`}
                        onClick={() => isUploadThingConfigured && !useUploadThing && handleToggleChange()}
                        disabled={isUpdatingPreference || useUploadThing || !isUploadThingConfigured}
                        title={!isUploadThingConfigured ? "UploadThing not configured" : undefined}
                    >
                        <Cloud className={styles.toggleIcon} />
                        <span>Cloud</span>
                    </button>
                    <button
                        type="button"
                        className={`${styles.toggleOption} ${!useUploadThing || !isUploadThingConfigured ? styles.toggleOptionActive : ""}`}
                        onClick={() => useUploadThing && handleToggleChange()}
                        disabled={isUpdatingPreference || !useUploadThing}
                    >
                        <Database className={styles.toggleIcon} />
                        <span>Database</span>
                    </button>
                </div>
                {isUpdatingPreference && (
                    <span className={styles.updatingText}>Updating...</span>
                )}
            </div>

            {/* UploadThing not configured message */}
            {!isUploadThingConfigured && (
                <div className={styles.configWarning}>
                    <AlertCircle className={styles.configWarningIcon} />
                    <div className={styles.configWarningContent}>
                        <span className={styles.configWarningText}>
                            Cloud storage (UploadThing) is not configured.
                        </span>
                        <Link href="/deployment" className={styles.configWarningLink}>
                            Set up in Deployment Guide <ExternalLink className={styles.configWarningLinkIcon} />
                        </Link>
                    </div>
                </div>
            )}

            {/* File Upload Area */}
            {renderUploadArea()}
            {errors.fileUrl && <span className={styles.error}>{errors.fileUrl}</span>}

            {/* Document Details */}
            <div className={styles.formFields}>
                {/* Title */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Document Title</label>
                    <div className={styles.inputWrapper}>
                        <FileText className={styles.inputIcon} />
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="Enter document title"
                        />
                    </div>
                    {errors.title && <span className={styles.error}>{errors.title}</span>}
                </div>

                {/* Category */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Category</label>
                    <div className={styles.inputWrapper}>
                        <FolderPlus className={styles.inputIcon} />
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className={styles.select}
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.category && (
                        <span className={styles.error}>{errors.category}</span>
                    )}
                </div>

                {/* Upload Date */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Upload Date</label>
                    <div className={styles.inputWrapper}>
                        <Calendar className={styles.inputIcon} />
                        <input
                            type="date"
                            name="uploadDate"
                            value={formData.uploadDate}
                            onChange={handleInputChange}
                            className={styles.input}
                        />
                    </div>
                </div>

                {/* OCR Processing */}
                <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            name="enableOCR"
                            checked={formData.enableOCR}
                            onChange={handleCheckboxChange}
                            className={styles.checkbox}
                        />
                        <span>Enable OCR Processing</span>
                    </label>
                    <p className={styles.helpText}>
                        Extract text from scanned documents or images using advanced OCR technology
                    </p>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || isUploading}
            >
                <Plus className={styles.buttonIcon} />
                {isSubmitting ? "Uploading..." : "Upload Document"}
            </button>
        </form>
    );
};

export default UploadForm;

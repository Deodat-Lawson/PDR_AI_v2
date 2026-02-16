"use client";

import React, { useState, useCallback } from "react";
import { Brain, Home } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import EmployerAuthCheck from "./EmployerAuthCheck";
import UploadForm, { type AvailableProviders } from "./UploadForm";
import styles from "~/styles/Employer/Upload.module.css";

const CategoryManagement = dynamic(() => import("./CategoryManagement"), {
    ssr: false,
});

const ThemeToggle = dynamic(
    () =>
        import("~/app/_components/ThemeToggle").then(
            (module) => module.ThemeToggle
        ),
    { ssr: false }
);

interface Category {
    id: string;
    name: string;
}

type CategoryResponse = {
    id: number;
    success: boolean;
    name: string;
}

interface CompanyData {
    id: number;
    name: string;
    useUploadThing: boolean;
}

interface UploadBootstrapResponse {
    categories: Category[];
    company: CompanyData | null;
    isUploadThingConfigured: boolean;
    availableProviders: AvailableProviders;
}

const Page: React.FC = () => {
    const router = useRouter();

    const [categories, setCategories] = useState<Category[]>([]);
    const [useUploadThing, setUseUploadThing] = useState<boolean>(true);
    const [isUploadThingConfigured, setIsUploadThingConfigured] = useState<boolean>(false);
    const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);
    const [availableProviders, setAvailableProviders] = useState<AvailableProviders>({
        azure: false,
        datalab: false,
        landingAI: false,
    });

    const fetchUploadBootstrap = useCallback(async () => {
        try {
            const res = await fetch("/api/employer/upload/bootstrap", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                throw new Error("Failed to fetch upload bootstrap data");
            }

            const data = (await res.json()) as UploadBootstrapResponse;
            setCategories(data.categories);
            setIsUploadThingConfigured(data.isUploadThingConfigured);
            setAvailableProviders(data.availableProviders);

            if (!data.isUploadThingConfigured) {
                setUseUploadThing(false);
                return;
            }

            const companyUploadPref = data.company?.useUploadThing;
            setUseUploadThing(companyUploadPref ?? true);
        } catch (error) {
            console.error("Error fetching upload bootstrap data:", error);
        }
    }, []);

    const handleAuthSuccess = useCallback(async () => {
        await fetchUploadBootstrap();
    }, [fetchUploadBootstrap]);

    const handleToggleUploadMethod = useCallback(async (newValue: boolean) => {
        setIsUpdatingPreference(true);
        try {
            const res = await fetch("/api/updateUploadPreference", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ useUploadThing: newValue }),
            });

            if (res.ok) {
                const data = await res.json() as { success: boolean; useUploadThing: boolean };
                if (data.success) {
                    setUseUploadThing(data.useUploadThing);
                }
            } else {
                console.error("Failed to update upload preference");
            }
        } catch (error) {
            console.error("Error updating upload preference:", error);
        } finally {
            setIsUpdatingPreference(false);
        }
    }, []);

    const handleAddCategory = useCallback(
        async (newCategory: string) => {
            if (!newCategory.trim()) return;
            try {
                const res = await fetch("/api/Categories/AddCategories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ CategoryName: newCategory }),
                });
                if (!res.ok) {
                    throw new Error("Failed to create category");
                }
                const rawData = await res.json() as CategoryResponse;
                
                if (rawData.success) {
                    const createdCategory = { id: rawData.id, name: rawData.name };
                    setCategories((prev) => {
                        const newCategories = [...prev, { id: createdCategory.id.toString(), name: createdCategory.name }];
                        return newCategories;
                    });
                } else {
                    console.error("Invalid category data received:", rawData);
                    alert("Error: Invalid category data format");
                }
            } catch (error) {
                console.error(error);
                alert("Error creating category. Check console for details.");
            }
        },
        [],
    );

    const handleRemoveCategory = useCallback(async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;

        try {
            const res = await fetch("/api/Categories/DeleteCategories", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) {
                throw new Error("Failed to remove category");
            }
            setCategories((prev) => prev.filter((cat) => cat.id !== id));
        } catch (error) {
            console.error(error);
            alert("Error removing category. Check console for details.");
        }
    }, []);

    return (
        <EmployerAuthCheck onAuthSuccess={handleAuthSuccess}>
            <div className={styles.mainContainer}>
                <nav className={styles.navbar}>
                    <div className={styles.navContent}>
                        <div className={styles.logoWrapper}>
                            <Brain className={styles.logoIcon} />
                            <span className={styles.logoText}>PDR AI</span>
                        </div>
                        <div className={styles.navActions}>
                            <ThemeToggle />
                            <button
                                onClick={() => router.push("/employer/home")}
                                className={styles.iconButton}
                                aria-label="Go to home"
                            >
                                <Home className={styles.iconButtonIcon} />
                            </button>
                        </div>
                    </div>
                </nav>

                <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Upload New Document</h1>
                    <p className={styles.subtitle}>Add a new document to your repository</p>
                </div>

                <UploadForm 
                    categories={categories}
                    useUploadThing={useUploadThing}
                    isUploadThingConfigured={isUploadThingConfigured}
                    onToggleUploadMethod={handleToggleUploadMethod}
                    isUpdatingPreference={isUpdatingPreference}
                    availableProviders={availableProviders}
                />

                <CategoryManagement
                    categories={categories}
                    onAddCategory={handleAddCategory}
                    onRemoveCategory={handleRemoveCategory}
                />
                </div>
            </div>
        </EmployerAuthCheck>
    );
};

export default Page;

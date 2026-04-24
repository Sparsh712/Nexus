"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FeaturesPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to home page with features section anchor
        router.replace("/#features");
    }, [router]);

    return (
        <div className="min-h-screen bg-[#030014] flex items-center justify-center">
            <div className="text-white animate-pulse">Redirecting to Features...</div>
        </div>
    );
}

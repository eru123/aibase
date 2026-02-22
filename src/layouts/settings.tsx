import { Outlet } from "react-router-dom";
import { SettingsSidebar } from "../components/SettingsSidebar";
import { Header } from "../components/header";
import { ProtectedRoute } from "../lib/auth";
import { useState, useEffect } from "react";

export function SettingsLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Handle window resize to reset sidebar state based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                // Desktop/Tablet: sidebar open by default
                setSidebarOpen(true);
            } else {
                // Mobile: sidebar closed by default
                setSidebarOpen(false);
            }
        };

        // Set initial state
        handleResize();

        // Add resize listener
        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen((prev) => !prev);
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 flex overflow-hidden">
                <SettingsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div
                    className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-0"} h-screen overflow-hidden`}
                >
                    <Header onMenuClick={toggleSidebar} />
                    <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-auto">
                        <div className="max-w-6xl mx-auto space-y-6 pb-12">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}

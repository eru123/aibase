import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";

export default function SystemSettingsConfigurationPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    System Configuration
                </h2>
                <p className="text-sm text-gray-500">
                    Manage system-level configurations and integrations.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>System configuration options will be available here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-center p-8 bg-gray-50 border border-dashed rounded-lg">
                        <p className="text-muted-foreground text-sm">Under development</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

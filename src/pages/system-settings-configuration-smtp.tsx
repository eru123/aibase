import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";

export default function SystemSettingsConfigurationSmtpPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    SMTP Configuration
                </h2>
                <p className="text-sm text-gray-500">
                    Manage email delivery settings and SMTP server details.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>SMTP Settings</CardTitle>
                    <CardDescription>Configure outgoing email delivery.</CardDescription>
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

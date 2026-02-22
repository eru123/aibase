import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    Input,
    Label,
    Switch,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

interface SmtpSettings {
    smtp_host: string;
    smtp_port: string;
    smtp_username: string;
    smtp_password: string;
    smtp_encryption: string;
    smtp_from_email: string;
    smtp_from_name: string;
    smtp_mail: boolean;
    smtp_ses: boolean;
}

const DEFAULT_SETTINGS: SmtpSettings = {
    smtp_host: "",
    smtp_port: "",
    smtp_username: "",
    smtp_password: "",
    smtp_encryption: "",
    smtp_from_email: "",
    smtp_from_name: "",
    smtp_mail: false,
    smtp_ses: false,
};

export default function SystemSettingsConfigurationSmtpPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ["systemSettingsSmtp"],
        queryFn: async () => {
            const res = await axios.get("/api/system-settings/smtp");
            return res.data?.data;
        },
        enabled: user?.role === "admin",
    });

    const [form, setForm] = useState<SmtpSettings>(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setForm((prev) => ({ ...prev, ...settings }));
        }
    }, [settings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put("/api/system-settings/smtp", { settings: form });
            toast.success("SMTP settings updated");
            queryClient.invalidateQueries({ queryKey: ["systemSettingsSmtp"] });
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || "Failed to update SMTP settings",
            );
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return null;
    }

    if (user.role !== "admin") {
        return (
            <div className="space-y-4 max-w-3xl mx-auto">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
                    <p className="text-sm text-gray-600">
                        Security policies are managed by administrators.
                    </p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-600">
                            You do not have permission to manage system settings. Please
                            contact an administrator.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                    <CardTitle>Delivery Method</CardTitle>
                    <CardDescription>
                        Choose how your application sends emails.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                        <p className="text-sm text-gray-500">Loading settings...</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Use PHP Mail()</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send emails using the local server mailer. (Overrides SMTP)
                                    </p>
                                </div>
                                <Switch
                                    checked={form.smtp_mail}
                                    onCheckedChange={(checked) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            smtp_mail: checked,
                                            smtp_ses: checked ? false : prev.smtp_ses,
                                        }))
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Use AWS SES</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send emails using AWS Simple Email Service. (Overrides SMTP)
                                    </p>
                                </div>
                                <Switch
                                    checked={form.smtp_ses}
                                    onCheckedChange={(checked) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            smtp_ses: checked,
                                            smtp_mail: checked ? false : prev.smtp_mail,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>SMTP Settings</CardTitle>
                    <CardDescription>
                        Configure outgoing email delivery via an external SMTP server.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                        <p className="text-sm text-gray-500">Loading settings...</p>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="smtp_host">SMTP Host</Label>
                                <Input
                                    id="smtp_host"
                                    placeholder="smtp.gmail.com"
                                    value={form.smtp_host}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            smtp_host: event.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtp_port">SMTP Port</Label>
                                <Input
                                    id="smtp_port"
                                    placeholder="587"
                                    value={form.smtp_port}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            smtp_port: event.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtp_encryption">Encryption</Label>
                                <Input
                                    id="smtp_encryption"
                                    placeholder="tls, ssl, or none"
                                    value={form.smtp_encryption}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            smtp_encryption: event.target.value,
                                        }))
                                    }
                                />
                            </div>

                            {/* Empty div for grid alignment */}
                            <div className="hidden md:block"></div>

                            <div className="space-y-2">
                                <Label htmlFor="smtp_username">Username</Label>
                                <Input
                                    id="smtp_username"
                                    placeholder="your-email@example.com"
                                    value={form.smtp_username}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            smtp_username: event.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtp_password">Password</Label>
                                <Input
                                    id="smtp_password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={form.smtp_password}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            smtp_password: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sender Details</CardTitle>
                    <CardDescription>
                        Configure the default "From" address and name.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                        <p className="text-sm text-gray-500">Loading settings...</p>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="smtp_from_name">From Name</Label>
                                <Input
                                    id="smtp_from_name"
                                    placeholder="Company Name"
                                    value={form.smtp_from_name}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            smtp_from_name: event.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtp_from_email">From Email</Label>
                                <Input
                                    id="smtp_from_email"
                                    type="email"
                                    placeholder="hello@example.com"
                                    value={form.smtp_from_email}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            smtp_from_email: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <Button onClick={handleSave} disabled={saving || isLoading}>
                            {saving ? "Saving..." : "Save settings"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

import { useEffect, useState } from "react";
import axios from "axios";
import { goeyToast as toast } from "goey-toast";
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
  Modal,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

  // Test and save modal state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm((prev) => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleTestAndSave = async () => {
    if (!testEmail) {
      toast.error("Please enter an email address to send the test to.");
      return;
    }
    setSaving(true);
    setTesting(true);
    try {
      await axios.put("/api/system-settings/smtp", {
        settings: form,
        email: testEmail,
      });
      toast.success("SMTP settings tested and saved successfully.");
      queryClient.invalidateQueries({ queryKey: ["systemSettingsSmtp"] });
      setTestModalOpen(false);
      setTestEmail("");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to test and save SMTP settings.",
      );
    } finally {
      setSaving(false);
      setTesting(false);
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
            <form
              className="grid gap-5 md:grid-cols-2"
              onSubmit={(e) => e.preventDefault()}
            >
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
                <Select
                  value={form.smtp_encryption || "none"}
                  onValueChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      smtp_encryption: val === "none" ? "" : val,
                    }))
                  }
                >
                  <SelectTrigger id="smtp_encryption">
                    <SelectValue placeholder="Select encryption" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Port 25)</SelectItem>
                    <SelectItem value="ssl">
                      SSL / Implicit (Port 465)
                    </SelectItem>
                    <SelectItem value="tls">
                      TLS / STARTTLS (Port 587)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Use <b>SSL</b> for port 465, or <b>TLS</b> for port 587.{" "}
                  <br />
                  Mismatched settings will cause connection timeouts!
                </p>
              </div>

              {/* Empty div for grid alignment */}
              <div className="hidden md:block"></div>

              <div className="space-y-2">
                <Label htmlFor="smtp_username">Username</Label>
                <Input
                  id="smtp_username"
                  placeholder="your-email@example.com"
                  value={form.smtp_username}
                  autoComplete="username"
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
                <div className="relative">
                  <Input
                    id="smtp_password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={form.smtp_password}
                    autoComplete="current-password"
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        smtp_password: event.target.value,
                      }))
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </form>
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

          <div className="pt-4 flex flex-wrap items-center gap-3 border-t mt-6">
            <Button
              onClick={() => setTestModalOpen(true)}
              disabled={saving || isLoading}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing & Saving...
                </>
              ) : (
                "Test & Save Settings"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal show={testModalOpen} onClose={() => setTestModalOpen(false)} sm>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Test & Save SMTP Settings
            </h3>
            <p className="text-sm text-gray-600">
              Enter an email recipient to validate the current form credentials.
              Settings will only be saved after a successful test.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test_email">Recipient Email</Label>
            <Input
              id="test_email"
              type="email"
              placeholder="tester@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              disabled={testing}
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => setTestModalOpen(false)}
              disabled={testing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTestAndSave}
              disabled={testing || !testEmail}
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test & Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

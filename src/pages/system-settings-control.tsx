import { useEffect, useState } from "react";
import axios from "axios";
import { goeyToast as toast } from "goey-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  useSystemSettings,
  type SystemSettings,
} from "@/hooks/useSystemSettings";

const DEFAULT_SETTINGS: SystemSettings = {
  enable_ip_check: true,
  auto_approve_invited_users: false,
  require_email_verifications: false,
  allow_registration: false,
  allow_mail_sending: false,
  debug_enabled: false,
  show_ui_components: false,
  company_name: "OpenSys",
  company_logo_url: "",
  company_email: "",
  company_phone: "",
  company_website: "",
  company_address: "",
};

export default function SystemSettingsControlPage() {
  const { user } = useAuth();
  const { data: settings, isLoading } = useSystemSettings();
  const [form, setForm] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleSaveSecurity = async () => {
    setSavingSecurity(true);
    try {
      await axios.put("/api/system-settings/security", {
        settings: {
          enable_ip_check: form.enable_ip_check,
          auto_approve_invited_users: form.auto_approve_invited_users,
          require_email_verifications: form.require_email_verifications,
          allow_registration: form.allow_registration,
          allow_mail_sending: form.allow_mail_sending,
        },
      });
      toast.success("Settings updated");
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update system settings",
      );
    } finally {
      setSavingSecurity(false);
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
          System Control
        </h2>
        <p className="text-sm text-gray-500">
          Control security features that apply to every account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading settings...</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Enable IP Check
                  </p>
                  <p className="text-xs text-gray-500">
                    Block logins when suspicious IP activity is detected.
                  </p>
                </div>
                <Switch
                  checked={form.enable_ip_check}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, enable_ip_check: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Auto approve invited users
                  </p>
                  <p className="text-xs text-gray-500">
                    Automatically approve invited users after they accept their
                    invitation.
                  </p>
                </div>
                <Switch
                  checked={form.auto_approve_invited_users}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      auto_approve_invited_users: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Require email verification on sign up
                  </p>
                  <p className="text-xs text-gray-500">
                    Send a one-time code and create the user only after
                    verification.
                  </p>
                </div>
                <Switch
                  checked={form.require_email_verifications}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      require_email_verifications: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Enable user sign up
                  </p>
                  <p className="text-xs text-gray-500">
                    Allow new users to register for an account (public).
                  </p>
                </div>
                <Switch
                  checked={form.allow_registration}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      allow_registration: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Allow Mail Sending
                  </p>
                  <p className="text-xs text-gray-500">
                    Enable sending of emails (OTPs, invitations, notifications).
                  </p>
                </div>
                <Switch
                  checked={form.allow_mail_sending}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      allow_mail_sending: checked,
                    }))
                  }
                />
              </div>

              <div className="pt-2">
                <Button onClick={handleSaveSecurity} disabled={savingSecurity}>
                  {savingSecurity ? "Saving..." : "Save security changes"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

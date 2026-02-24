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

export default function SystemSettingsDeveloperPage() {
  const { user } = useAuth();
  const { data: settings, isLoading } = useSystemSettings();
  const [form, setForm] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [savingDeveloper, setSavingDeveloper] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleSaveDeveloper = async () => {
    setSavingDeveloper(true);
    try {
      await axios.put("/api/system-settings/security", {
        settings: {
          debug_enabled: form.debug_enabled,
          show_ui_components: form.show_ui_components,
        },
      });
      toast.success("Developer settings updated");
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update developer settings",
      );
    } finally {
      setSavingDeveloper(false);
    }
  };

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Developer Settings
        </h2>
        <p className="text-sm text-gray-500">
          Tools and flags for application development.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Development Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading settings...</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Enable debug mode
                  </p>
                  <p className="text-xs text-gray-500">
                    Include request payload and diagnostics in API debug logs.
                  </p>
                </div>
                <Switch
                  checked={form.debug_enabled}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, debug_enabled: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Show UI Components page
                  </p>
                  <p className="text-xs text-gray-500">
                    Expose the UI Components reference page in the admin
                    sidebar.
                  </p>
                </div>
                <Switch
                  checked={form.show_ui_components}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      show_ui_components: checked,
                    }))
                  }
                />
              </div>
              <div className="pt-2">
                <Button
                  onClick={handleSaveDeveloper}
                  disabled={savingDeveloper}
                >
                  {savingDeveloper ? "Saving..." : "Save developer settings"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

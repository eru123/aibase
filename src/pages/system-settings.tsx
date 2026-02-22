import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
  Input,
  Textarea,
  Label,
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
  company_name: "AIBase",
  company_logo_url: "",
  company_email: "",
  company_phone: "",
  company_website: "",
  company_address: "",
};

export default function SystemSettingsPage() {
  const { user } = useAuth();
  const { data: settings, isLoading } = useSystemSettings();
  const [form, setForm] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [savingDeveloper, setSavingDeveloper] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
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

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    try {
      await axios.put("/api/system-settings/company", {
        settings: {
          company_name: form.company_name,
          company_logo_url: form.company_logo_url,
          company_email: form.company_email,
          company_phone: form.company_phone,
          company_website: form.company_website,
          company_address: form.company_address,
        },
      });
      toast.success("Company settings updated");
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update company settings",
      );
    } finally {
      setSavingCompany(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post("/api/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const previewUrl =
        response.data?.preview_url ?? response.data?.data?.preview_url;
      if (!previewUrl) {
        throw new Error("Upload did not return a preview URL");
      }
      setForm((prev) => ({ ...prev, company_logo_url: previewUrl }));
      toast.success("Logo uploaded");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to upload logo",
      );
    } finally {
      setUploadingLogo(false);
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
          Settings
        </h2>
        <p className="text-sm text-gray-500">
          Control security features that apply to every account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading settings...</p>
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company name</Label>
                  <Input
                    id="company_name"
                    placeholder="AIBase"
                    value={form.company_name}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        company_name: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_website">Website</Label>
                  <Input
                    id="company_website"
                    placeholder="https://example.com"
                    value={form.company_website}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        company_website: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_email">Primary email</Label>
                  <Input
                    id="company_email"
                    type="email"
                    placeholder="hello@example.com"
                    value={form.company_email}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        company_email: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_phone">Phone</Label>
                  <Input
                    id="company_phone"
                    placeholder="+1 (555) 010-0000"
                    value={form.company_phone}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        company_phone: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company_logo_url">Logo URL (optional)</Label>
                  <Input
                    id="company_logo_url"
                    placeholder="https://example.com/logo.png"
                    value={form.company_logo_url}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        company_logo_url: event.target.value,
                      }))
                    }
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploadingLogo}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          handleLogoUpload(file);
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                    {form.company_logo_url ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, company_logo_url: "" }))
                        }
                      >
                        Remove logo
                      </Button>
                    ) : null}
                  </div>
                  {uploadingLogo ? (
                    <p className="text-xs text-gray-500">Uploading logo...</p>
                  ) : null}
                  {form.company_logo_url ? (
                    <div className="mt-3 flex items-center gap-3 rounded-md border border-dashed border-gray-200 bg-gray-50 p-3">
                      <img
                        src={form.company_logo_url}
                        alt={form.company_name || "Company logo"}
                        className="h-10 w-auto max-w-[160px] object-contain"
                      />
                      <span className="text-xs text-gray-500">
                        Logo preview
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company_address">Address</Label>
                  <Textarea
                    id="company_address"
                    rows={3}
                    placeholder="123 Market Street, San Francisco, CA"
                    value={form.company_address}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        company_address: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={handleSaveCompany} disabled={savingCompany}>
                  {savingCompany ? "Saving..." : "Save company details"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Control</CardTitle>
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
                    Allow new users to register for an account (public_data).
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

      <Card>
        <CardHeader>
          <CardTitle>Developer Settings</CardTitle>
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

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
  company_name: "OpenSys",
  company_logo_url: "",
  company_email: "",
  company_phone: "",
  company_website: "",
  company_address: "",
};

export default function SystemSettingsCompanyPage() {
  const { user } = useAuth();
  const { data: settings, isLoading } = useSystemSettings();
  const [form, setForm] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [savingCompany, setSavingCompany] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

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
          Company Profile
        </h2>
        <p className="text-sm text-gray-500">
          Manage your company details and public branding.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
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
                    placeholder="OpenSys"
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
    </div>
  );
}

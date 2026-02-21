import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Input,
  Avatar,
} from "@/components/ui";
import { PhoneInput } from "@/components/ui/phone-input"; // Import PhoneInput
import { Camera } from "lucide-react";
import { Organization } from "../../hooks/useOrganization";
import { useState, useEffect } from "react"; // Import React hooks

export default function OrganizationSettingsPage() {
  const { organization, refresh } = useOutletContext<{
    organization: Organization;
    refresh: () => void;
  }>();
  const { slug } = useParams();
  const navigate = useNavigate();

  // Controlled state for phone since PhoneInput is a controlled component
  const [contactPhone, setContactPhone] = useState(
    organization.contact_phone || "",
  );

  // Sync state when organization data updates
  useEffect(() => {
    setContactPhone(organization.contact_phone || "");
  }, [organization.contact_phone]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Settings
        </h2>
        <p className="text-sm text-gray-500">
          Update your organization's profile and general information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b">
            <Avatar
              src={organization.avatar_url}
              fallback={organization.name}
              size="xl"
            />
            <div className="space-y-2">
              <h4 className="font-medium">Organization Avatar</h4>
              <p className="text-sm text-gray-500">
                Update your organization's profile picture.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="relative cursor-pointer"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Change Avatar
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const formData = new FormData();
                      formData.append("file", file);

                      try {
                        const uploadRes = await axios.post(
                          "/api/uploads",
                          formData,
                        );
                        const avatarUrl = uploadRes.data.preview_url;
                        await axios.put(`/api/organizations/${slug}`, {
                          avatar_url: avatarUrl,
                        });
                        toast.success("Avatar updated");
                        refresh();
                      } catch (err: any) {
                        toast.error(
                          err.response?.data?.message ||
                            "Failed to update avatar",
                        );
                      }
                    }}
                  />
                </Button>
                {organization.avatar_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={async () => {
                      try {
                        await axios.put(`/api/organizations/${slug}`, {
                          avatar_url: "",
                        });
                        toast.success("Avatar removed");
                        refresh();
                      } catch (err: any) {
                        toast.error("Failed to remove avatar");
                      }
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <form
            className="space-y-4 max-w-md pt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get("name") as string,
                slug: formData.get("slug") as string,
                contact_phone: contactPhone, // Use controlled state
                contact_email: formData.get("contact_email") as string,
              };

              try {
                await axios.put(`/api/organizations/${slug}`, data);
                toast.success("Settings updated");
                if (data.slug !== slug) {
                  navigate(`/org/${data.slug}/settings`);
                  refresh();
                } else {
                  refresh();
                }
              } catch (err: any) {
                toast.error(
                  err.response?.data?.message || "Failed to update settings",
                );
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="settingsName">Organization Name</Label>
              <Input
                id="settingsName"
                name="name"
                defaultValue={organization.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settingsSlug">URL Slug</Label>
              <Input
                id="settingsSlug"
                name="slug"
                defaultValue={organization.slug}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="settingsPhone">Contact Phone</Label>
                <PhoneInput
                  id="settingsPhone"
                  value={contactPhone}
                  onChange={setContactPhone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settingsEmail">Contact Email</Label>
                <Input
                  id="settingsEmail"
                  name="contact_email"
                  type="email"
                  defaultValue={organization.contact_email || ""}
                />
              </div>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

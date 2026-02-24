import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Avatar,
} from "@/components/ui";
import { toast } from "sonner";
import type { User } from "@/types";
import { Camera, Shield, User as UserIcon, Settings, Lock } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import * as React from "react";

export default function Profile() {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const { user: authUser } = useAuth();

  const isAdmin = authUser?.role === "admin";
  const isMe =
    !paramUsername || (authUser && authUser.username === paramUsername);
  const canEdit = isMe || isAdmin;

  const [profile, setProfile] = React.useState<
    (User & { avatar_url?: string | null }) | null
  >(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [passwordForm, setPasswordForm] = React.useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [generalForm, setGeneralForm] = React.useState({
    display_name: "",
    timezone: "UTC",
    currency: "USD",
  });

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = isMe ? "/api/profile" : `/api/u/${paramUsername}`;
      const response = await axios.get(endpoint);
      const data = response.data.data;
      setProfile(data);
      setGeneralForm({
        display_name: data.display_name || "",
        timezone: data.timezone || "UTC",
        currency: data.currency || "USD",
      });
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [isMe, paramUsername]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleUpdateProfile = async (updates: any) => {
    setSaving(true);
    try {
      const endpoint = isMe ? "/api/profile" : `/api/users/${profile?.id}`;
      const response = await axios.put(endpoint, updates);
      const data = response.data;
      // Backend UserController returns user directly, ProfileController returns { success, data }
      setProfile(isMe ? data.data : data);
      toast.success("Profile updated");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error("Passwords do not match");
    }

    setSaving(true);
    try {
      await axios.put("/api/profile/password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success("Password updated successfully");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white rounded-xl shadow-sm border">
        <div className="relative group">
          <Avatar
            src={profile?.avatar_url}
            fallback={profile?.display_name || profile?.username || "?"}
            size="xl"
          />
          {canEdit && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full cursor-pointer">
              <Camera className="text-white h-6 w-6" />
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setUploading(true);
                  const formData = new FormData();
                  formData.append("file", file);

                  try {
                    const res = await axios.post("/api/uploads", formData);
                    await handleUpdateProfile({
                      avatar_url: res.data.preview_url,
                    });
                  } catch (err) {
                    toast.error("Avatar upload failed");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </div>
        <div className="text-center md:text-left space-y-1">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {profile?.display_name || profile?.username}
          </h2>
          {(isMe || isAdmin) && (
            <p className="text-sm text-gray-500">{profile?.email}</p>
          )}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary uppercase">
              {profile?.role}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              @{profile?.username}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-6">
          <TabsTrigger
            value="general"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-6 h-auto"
          >
            <UserIcon className="h-4 w-4 mr-2" /> General
          </TabsTrigger>
          {isMe && (
            <>
              <TabsTrigger
                value="security"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-6 h-auto"
              >
                <Shield className="h-4 w-4 mr-2" /> Security
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-6 h-auto"
              >
                <Settings className="h-4 w-4 mr-2" /> Preferences
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateProfile({
                    display_name: generalForm.display_name,
                  });
                }}
                className="space-y-4 max-w-md"
              >
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={generalForm.display_name}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        display_name: e.target.value,
                      })
                    }
                    placeholder="Your full name"
                    disabled={!canEdit}
                  />
                </div>
                {(isMe || isAdmin) && (
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      value={profile?.email}
                      disabled
                      className="bg-gray-50"
                    />
                    {isMe && (
                      <p className="text-xs text-gray-500">
                        Email cannot be changed here. Contact support to update.
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={profile?.username}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                {canEdit && (
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleUpdatePassword}
                className="space-y-4 max-w-md"
              >
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        current_password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        new_password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirm_password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <Button type="submit" disabled={saving} variant="default">
                  {saving ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Regional & System</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateProfile({
                    timezone: generalForm.timezone,
                    currency: generalForm.currency,
                  });
                }}
                className="space-y-4 max-w-md"
              >
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={generalForm.timezone}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        timezone: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Affects how dates and times are displayed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={generalForm.currency}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        currency: e.target.value.toUpperCase(),
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Used for billing and reporting.
                  </p>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

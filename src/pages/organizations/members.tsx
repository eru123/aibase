import { useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Modal,
  Label,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  confirmModal,
  Badge,
  DropdownMenuItem,
  Avatar,
} from "@/components/ui";
import {
  MoreHorizontal,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  Trash2,
  Edit,
} from "lucide-react";
import { Organization, OrganizationMember } from "../../hooks/useOrganization";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";

export default function OrganizationMembersPage() {
  const { organization, refresh } = useOutletContext<{
    organization: Organization;
    refresh: () => void;
  }>();
  const { slug } = useParams();
  const { user: currentUser } = useAuth();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<OrganizationMember | null>(null);
  const [inviting, setInviting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [inviteData, setInviteData] = useState({ email: "", role: "viewer" });
  const [newRole, setNewRole] = useState<string>("viewer");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.email) return;

    setInviting(true);
    try {
      await axios.post(`/api/organizations/${slug}/invite`, inviteData);
      toast.success("User invited successfully");
      setInviteModalOpen(false);
      setInviteData({ email: "", role: "viewer" });
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    const confirmed = await confirmModal({
      title: "Remove User",
      message:
        "Are you sure you want to remove this user from the organization?",
      confirmText: "Remove",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      await axios.delete(`/api/organizations/${slug}/users/${userId}`);
      toast.success("User removed");
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove user");
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setUpdating(true);
    try {
      await axios.put(`/api/organizations/${slug}/users/${selectedMember.id}`, {
        role: newRole,
      });
      toast.success("Role updated");
      setRoleModalOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update role");
    } finally {
      setUpdating(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "User",
        cell: (user: OrganizationMember) => {
          const isSystemAdmin = currentUser?.role === "admin";
          return (
            <div className="flex items-center gap-3">
              <Avatar
                src={user.avatar_url}
                fallback={user.username || user.email}
                size="sm"
              />
              <div>
                {isSystemAdmin ? (
                  <Link to={`/u/${user.username}`} className="group">
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {user.username || user.email}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-primary/70">
                      {user.email}
                    </div>
                  </Link>
                ) : (
                  <>
                    <div className="font-medium text-gray-900">
                      {user.username || user.email}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </>
                )}
              </div>
            </div>
          );
        },
      },
      {
        header: "Role",
        cell: (user: OrganizationMember) => {
          const roleColors: Record<string, "solid" | "subtle" | "outline"> = {
            owner: "solid",
            admin: "subtle",
            viewer: "outline",
          };

          return (
            <Badge variant={roleColors[user.organization_role]}>
              {user.organization_role}
            </Badge>
          );
        },
      },
      {
        header: "Joined",
        cell: (user: OrganizationMember) => {
          return (
            <div className="text-sm text-gray-500">
              {new Date(user.joined_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          );
        },
      },
    ],
    [currentUser],
  );

  const tableActions = (user: OrganizationMember) => {
    if (user.organization_role === "owner") return null;

    return (
      <>
        <DropdownMenuItem
          onClick={() => {
            setSelectedMember(user);
            setNewRole(user.organization_role);
            setRoleModalOpen(true);
          }}
        >
          <Edit className="mr-2 h-4 w-4" /> Change role
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => handleRemoveUser(user.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Members
          </h2>
          <p className="text-sm text-gray-500">
            Manage your organization's members and their roles.
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <DataTable
            data={organization.users}
            columns={columns}
            limit={10}
            searchKey="email"
            actions={tableActions}
          />
        </CardContent>
      </Card>

      <Modal show={inviteModalOpen} onClose={() => setInviteModalOpen(false)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h3 className="text-lg font-medium">Invite Member</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInviteModalOpen(false)}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="colleague@example.com"
                value={inviteData.email}
                onChange={(e) =>
                  setInviteData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteRole">Role</Label>
              <Select
                value={inviteData.role}
                onValueChange={(val) =>
                  setInviteData((prev) => ({ ...prev, role: val as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setInviteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviting}>
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal show={roleModalOpen} onClose={() => setRoleModalOpen(false)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h3 className="text-lg font-medium">Change Role</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRoleModalOpen(false)}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Select a new role for{" "}
            <span className="font-semibold">
              {selectedMember?.username || selectedMember?.email}
            </span>
            .
          </p>
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="changeRole">Organization Role</Label>
              <Select
                value={newRole}
                onValueChange={(val) => setNewRole(val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRoleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Saving..." : "Update Role"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

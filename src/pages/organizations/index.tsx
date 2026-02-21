import * as React from "react";
import { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Input,
  Modal,
  Label,
  DropdownMenuItem,
  Avatar,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { usePaginatedApi } from "@/hooks/usePaginatedApi";
import {
  Building,
  Plus,
  X,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Users,
  ChevronRight,
  Search,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/ui/phone-input";

interface Organization {
  id: number;
  name: string;
  slug: string;
  avatar_url?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  members_count?: number | string;
  created_at: string;
}

const FloatingCopy = ({ text, label }: { text: string; label: string }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
      }}
      className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white shadow-sm border border-gray-200 rounded p-1 text-gray-500 hover:text-primary hover:border-primary/30 z-10 h-6 w-6 flex items-center justify-center"
      title={`Copy ${label}`}
    >
      <Copy className="h-3 w-3" />
    </button>
  );
};

const OrganizationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"table" | "cards">(() => {
    return (
      (localStorage.getItem("organization_view_mode") as "table" | "cards") ||
      "cards"
    );
  });

  React.useEffect(() => {
    localStorage.setItem("organization_view_mode", viewMode);
  }, [viewMode]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    avatar_url: "",
    contact_phone: "",
    contact_email: "",
  });

  const {
    data: organizations,
    loading,
    pagination,
    handlePageChange,
    handleLimitChange,
    handleSearch,
    params,
    refresh,
  } = usePaginatedApi<Organization>("/api/organizations", {
    initialLimit: 5,
  });

  const columns = useMemo(
    () => [
      {
        header: "Name",
        cell: (org: Organization) => (
          <div className="flex items-center gap-3">
            <Avatar src={org.avatar_url} fallback={org.name} size="sm" />
            <Link
              to={`/org/${org.slug}`}
              className="font-medium text-gray-900 hover:text-primary transition-colors flex flex-col"
            >
              <div>
                {org.name}{" "}
                <span title="Members count">({org.members_count || 0})</span>
              </div>
              <code
                className="rounded bg-gray-50 text-gray-600 text-xs font-mono"
                title={`Organization slug: /org/${org.slug}`}
              >
                /{org.slug}
              </code>
            </Link>
          </div>
        ),
      },
      {
        header: "Contact",
        cell: (org: Organization) => (
          <div className="space-y-0.5 min-w-[140px]">
            <div className="group relative flex items-center pr-7 h-5">
              <div
                className="text-sm font-medium text-gray-900 truncate"
                title={org.contact_email || ""}
              >
                {org.contact_email || "-"}
              </div>
              {org.contact_email && (
                <FloatingCopy text={org.contact_email} label="Email" />
              )}
            </div>
            <div className="group relative flex items-center pr-7 h-5">
              <div
                className="text-xs text-gray-500 truncate"
                title={org.contact_phone || ""}
              >
                {org.contact_phone || "-"}
              </div>
              {org.contact_phone && (
                <FloatingCopy text={org.contact_phone} label="Phone" />
              )}
            </div>
          </div>
        ),
      },
      {
        header: "Created",
        cell: (org: Organization) =>
          new Date(org.created_at).toLocaleDateString(),
      },
    ],
    [],
  );

  const tableActions = (org: Organization) => (
    <>
      <DropdownMenuItem onClick={() => navigate(`/org/${org.slug}`)}>
        Manage
      </DropdownMenuItem>
    </>
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) return;

    setCreating(true);
    try {
      const response = await axios.post("/api/organizations", formData);
      toast.success("Organization created");
      setCreateModalOpen(false);
      setFormData({
        name: "",
        slug: "",
        avatar_url: "",
        contact_phone: "",
        contact_email: "",
      });
      refresh();
      navigate(`/org/${response.data.data.slug}`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create organization",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Organizations
          </h2>
          <p className="text-sm text-gray-500">
            Overview and management of your teams and organizations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200",
                viewMode === "table"
                  ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
              )}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200",
                viewMode === "cards"
                  ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
              )}
              title="Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <Card className="border-gray-200/60 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <DataTable
              data={organizations}
              columns={columns}
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              onPageChange={handlePageChange}
              onPageSizeChange={handleLimitChange}
              searchKey="search"
              searchValue={params.search}
              onSearchChange={handleSearch}
              actions={tableActions}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search organizations..."
                className="pl-9 bg-white border-gray-200 focus:ring-primary/20"
                value={params.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
              <span>Show</span>
              <Select
                value={pagination.limit.toString()}
                onValueChange={(val) => handleLimitChange(parseInt(val))}
              >
                <SelectTrigger className="w-20 h-9 bg-white border-gray-200 focus:ring-primary/20">
                  <SelectValue placeholder={pagination.limit.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>items</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 p-6 h-48 animate-pulse shadow-sm"
                />
              ))}
            </div>
          ) : organizations.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 bg-gray-50/50 border-dashed border-2">
              <div className="bg-white p-4 rounded-full shadow-sm border mb-4">
                <Building className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No organizations found
              </h3>
              <p className="text-gray-500 text-center max-w-sm mt-1">
                {params.search
                  ? `We couldn't find any results for "${params.search}".`
                  : "You don't have any organizations yet. Create your first one to get started."}
              </p>
              {params.search && (
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => handleSearch("")}
                >
                  Clear search
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((org) => (
                <Card
                  key={org.id}
                  className="group hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden border-primary/10 flex flex-col h-full bg-white"
                >
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <Avatar
                        src={org.avatar_url}
                        fallback={org.name}
                        size="lg"
                        className="ring-4 ring-white shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge
                        variant="subtle"
                        className="bg-gray-100/5 text-gray-500 text-[10px] uppercase tracking-wider font-bold border-transparent"
                      >
                        {org.members_count} Members
                      </Badge>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors line-clamp-1">
                          {org.name}
                        </h3>
                        <p className="text-xs font-mono text-gray-500">
                          /{org.slug}
                        </p>
                      </div>

                      <div className="space-y-1.5 py-3 border-y border-gray-50">
                        <div className="group relative flex items-center text-xs text-gray-600 gap-2 pr-7 h-5">
                          <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span
                            className="truncate"
                            title={org.contact_email || ""}
                          >
                            {org.contact_email || "No email set"}
                          </span>
                          {org.contact_email && (
                            <FloatingCopy
                              text={org.contact_email}
                              label="Email"
                            />
                          )}
                        </div>
                        <div className="group relative flex items-center text-xs text-gray-600 gap-2 pr-7 h-5">
                          <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span title={org.contact_phone || ""}>
                            {org.contact_phone || "No phone set"}
                          </span>
                          {org.contact_phone && (
                            <FloatingCopy
                              text={org.contact_phone}
                              label="Phone"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2">
                      <Button
                        variant="default"
                        className="group/manage w-full border-transparent shadow-none font-semibold text-sm h-9 transition-all duration-300"
                        onClick={() => navigate(`/org/${org.slug}`)}
                      >
                        Manage{" "}
                        <ChevronRight className="ml-1 h-3 w-3 transition-all duration-300 group-hover/manage:translate-x-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Simple Card Pagination if total > limit */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-between border-t pt-6">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                organizations
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    pagination.page >=
                    Math.ceil(pagination.total / pagination.limit)
                  }
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal show={createModalOpen} onClose={() => setCreateModalOpen(false)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Create Organization
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-2">
              <Avatar
                src={formData.avatar_url}
                fallback={formData.name || "?"}
                size="xl"
              />
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  className="shadow-sm"
                >
                  {uploading ? "Uploading..." : "Upload Avatar"}
                </Button>
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setUploading(true);
                    const uploadData = new FormData();
                    uploadData.append("file", file);

                    try {
                      const res = await axios.post("/api/uploads", uploadData);
                      setFormData((prev) => ({
                        ...prev,
                        avatar_url: res.data.preview_url,
                      }));
                    } catch (err) {
                      toast.error("Avatar upload failed");
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgName" className="text-sm font-semibold">
                Organization Name
              </Label>
              <Input
                id="orgName"
                placeholder="Acme Corp"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
                  setFormData((prev) => ({
                    ...prev,
                    name,
                    slug: prev.name ? prev.slug : slug,
                  }));
                }}
                required
                className="bg-gray-50/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgSlug" className="text-sm font-semibold">
                URL Slug
              </Label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-mono">
                  /
                </span>
                <Input
                  id="orgSlug"
                  className="rounded-l-none bg-gray-50/50"
                  placeholder="acme-corp"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-sm font-semibold">
                  Contact Phone
                </Label>
                <PhoneInput
                  id="contactPhone"
                  value={formData.contact_phone}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, contact_phone: value }))
                  }
                  className="bg-gray-50/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-sm font-semibold">
                  Contact Email
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contact_email: e.target.value,
                    }))
                  }
                  className="bg-gray-50/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreateModalOpen(false)}
                className="shadow-none"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating} className="shadow-sm">
                {creating ? "Creating..." : "Create Organization"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default OrganizationsPage;

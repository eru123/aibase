import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { goeyToast as toast } from "goey-toast";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
  Textarea,
  confirmModal,
  EmailPreviewModal,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Save, Trash, Eye, Play } from "lucide-react";

type TemplateForm = {
  name: string;
  description: string;
  subject: string;
  body_html: string;
  body_text: string;
  sample_data: string;
  is_active: boolean;
};

const DEFAULT_SAMPLE_DATA = `{
  "company": "Acme Corp",
  "contact_name": "Jordan Lee",
  "invoice_number": "INV-2026-001",
  "total": "$1,250.00",
  "due_date": "February 15, 2026"
}`;

const EMPTY_FORM: TemplateForm = {
  name: "",
  description: "",
  subject: "",
  body_html: "",
  body_text: "",
  sample_data: DEFAULT_SAMPLE_DATA,
  is_active: true,
};

export default function EmailTemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const isNew = !id;

  useEffect(() => {
    if (!isNew && id && isAdmin) {
      loadTemplate(id);
    }
  }, [id, isNew, isAdmin]);

  const loadTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/email-templates/${templateId}`);
      const data = response.data;
      setForm({
        name: data.name ?? "",
        description: data.description ?? "",
        subject: data.subject ?? "",
        body_html: data.body_html ?? "",
        body_text: data.body_text ?? "",
        sample_data: data.sample_data ?? DEFAULT_SAMPLE_DATA,
        is_active: Boolean(data.is_active ?? true),
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load template");
      navigate("/email-templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.subject) {
      toast.error("Name and Subject are required");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      subject: form.subject,
      body_html: form.body_html,
      body_text: form.body_text || null,
      sample_data: form.sample_data || null,
      is_active: form.is_active,
    };

    try {
      if (isNew) {
        const response = await axios.post("/api/email-templates", payload);
        toast.success("Template created");
        // Navigate to edit page of the new template or back to list?
        // Usually back to list or stay. Let's go to list for now as per "open as a page" flow.
        navigate(`/email-templates/${response.data.id}`);
      } else {
        await axios.put(`/api/email-templates/${id}`, payload);
        toast.success("Template updated");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    const confirmed = await confirmModal({
      title: "Delete template",
      message:
        "Are you sure you want to delete this template? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });
    if (!confirmed) return;

    try {
      await axios.delete(`/api/email-templates/${id}`);
      toast.success("Template deleted");
      navigate("/email-templates");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete template");
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      // If new, we can't preview easily unless backend supports ad-hoc preview without ID.
      // Usually preview endpoint requires ID.
      // If the backend has a stateless preview endpoint, we should use it.
      // Looking at previous code: `/api/email-templates/${selectedId}/preview`
      // It seems it relies on ID.
      // If isNew, maybe we need to save first? Or assume user saves first.

      let endpoint = `/api/email-templates/${id}/preview`;
      if (isNew) {
        // Create a temporary preview or warn user.
        // Let's see if we can use a generic preview endpoint or just mock it locally?
        // Actually, typically preview renders handlebars.
        // Let's assume we need to save first for now, or just send data if backend supports it.
        // Re-reading previous code: it sends data/subject/body in the body of POST request.
        // So maybe the ID is just for route structure? If it accepts full payload, maybe ID doesn't matter or we can use a dummy one?
        // Let's try to usage the ID if available, otherwise we might need to warn.
        toast.error("Please save the template first to generate a preview.");
        return;
      }

      const response = await axios.post(endpoint, {
        data: form.sample_data,
        subject: form.subject,
        body_html: form.body_html,
        body_text: form.body_text,
      });
      setPreviewHtml(response.data?.html ?? "");
      setPreviewSubject(response.data?.subject ?? "");
      setIsPreviewModalOpen(true);
      toast.success("Preview generated");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to preview template",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {/* ... Access Denied UI ... */}
        <div>Access Denied</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading template...</div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/email-templates")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isNew ? "Create Template" : "Edit Template"}
            </h2>
            <p className="text-sm text-gray-500">
              {isNew
                ? "Design a new email template"
                : `Editing template: ${form.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>
              Basic information and configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Invoice Reminder"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Input
                id="template-description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional internal note"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Active Status</Label>
                <p className="text-xs text-gray-500">
                  Inactive templates cannot be used.
                </p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm({ ...form, is_active: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Preview & Data</CardTitle>
              <CardDescription>
                Test your template with sample data.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={previewLoading || isNew}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewLoading ? "Rendering..." : "View Preview"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="template-sample">Sample JSON Data</Label>
              <Textarea
                id="template-sample"
                rows={8}
                value={form.sample_data}
                onChange={(e) =>
                  setForm({ ...form, sample_data: e.target.value })
                }
                className="font-mono text-xs"
              />
            </div>

            {isNew && (
              <p className="text-sm text-gray-500 text-center italic py-4">
                Save the template to enable preview
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Content</CardTitle>
          <CardDescription>Subject and body content (HTML).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-subject">Subject Line</Label>
            <Input
              id="template-subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Your invoice {{invoice_number}} is ready"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-html">HTML Body</Label>
            <Textarea
              id="template-html"
              rows={12}
              value={form.body_html}
              onChange={(e) => setForm({ ...form, body_html: e.target.value })}
              className="font-mono text-xs"
              placeholder="<h1>Hello {{contact_name}}</h1>"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-text">Text Fallback (Optional)</Label>
            <Textarea
              id="template-text"
              rows={4}
              value={form.body_text}
              onChange={(e) => setForm({ ...form, body_text: e.target.value })}
              className="font-mono text-xs"
              placeholder="Hello {{contact_name}}, your invoice is ready."
            />
          </div>
        </CardContent>
      </Card>

      <EmailPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        htmlContent={previewHtml || ""}
        subject={previewSubject || ""}
      />
    </div>
  );
}

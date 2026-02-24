import { useEffect, useMemo, useState } from "react";
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
  Dropdown,
  Input,
  Label,
  Textarea,
  EmailPreviewModal,
  type DropdownOption,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { Eye } from "lucide-react";

type EmailTemplate = {
  id: number;
  name: string;
  subject: string;
  description?: string | null;
  sample_data?: string | null;
  is_active?: boolean | number;
};

type Attachment = {
  id: string;
  name: string;
  size: number;
};

const normalizeRecipients = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(", ");

export default function EmailSendTemplatePage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [recipients, setRecipients] = useState("");
  const [dataJson, setDataJson] = useState("{\n  \n}");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  const loadTemplates = async () => {
    if (!isAdmin) return;
    setTemplatesLoading(true);
    try {
      const response = await axios.get("/api/email-templates", {
        params: { limit: 100 },
      });
      const data = response.data.data || [];
      setTemplates(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load templates");
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [isAdmin]);

  const templateOptions = useMemo<DropdownOption[]>(
    () =>
      templates.map((template) => ({
        value: String(template.id),
        label: template.name,
        description: template.subject,
        disabled: template.is_active === false || template.is_active === 0,
      })),
    [templates],
  );

  const activeTemplate = useMemo(
    () =>
      templates.find(
        (template) => String(template.id) === selectedTemplateId,
      ) || null,
    [selectedTemplateId, templates],
  );

  useEffect(() => {
    if (activeTemplate?.sample_data) {
      setDataJson(activeTemplate.sample_data);
    } else {
      setDataJson("{\n  \n}");
    }
    setPreviewHtml(null);
    setPreviewSubject(null);
  }, [activeTemplate]);

  const handlePreview = async () => {
    if (!selectedTemplateId) {
      toast.error("Select a template first.");
      return;
    }
    setPreviewLoading(true);
    try {
      const response = await axios.post(
        `/api/email-templates/${selectedTemplateId}/preview`,
        {
          data: dataJson,
        },
      );
      setPreviewHtml(response.data?.html ?? "");
      setPreviewSubject(response.data?.subject ?? "");
      setIsPreviewModalOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to render preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: Attachment[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post("/api/uploads", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploaded.push({
          id: response.data.id,
          name: response.data.original_name || file.name,
          size: response.data.size || file.size,
        });
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to upload attachment",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSend = async () => {
    if (!selectedTemplateId) {
      toast.error("Select a template first.");
      return;
    }
    if (!recipients.trim()) {
      toast.error("Please add at least one recipient.");
      return;
    }
    setSending(true);
    try {
      const response = await axios.post("/api/emails/send-template", {
        template_id: Number(selectedTemplateId),
        recipients: normalizeRecipients(recipients),
        data: dataJson,
        attachments: attachments.map((item) => item.id),
      });
      const sent = response.data?.sent ?? 0;
      toast.success(`Email sent to ${sent} recipient${sent === 1 ? "" : "s"}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Send Templated Email
          </h2>
          <p className="text-sm text-gray-600">
            Only administrators can send templated emails.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">
              You do not have permission to access this page. Please contact an
              administrator.
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
          Send Templated Email
        </h2>
        <p className="text-sm text-gray-500">
          Send a Handlebars template with JSON data.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
            <CardDescription>
              Select a template and define recipients.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Template</Label>
              <Dropdown
                options={templateOptions}
                value={selectedTemplateId}
                onChange={(value) => setSelectedTemplateId(String(value))}
                placeholder={
                  templatesLoading
                    ? "Loading templates..."
                    : "Select a template"
                }
                searchable
              />
              {activeTemplate && (
                <p className="text-xs text-gray-500">
                  {activeTemplate.subject}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients</Label>
              <Textarea
                id="recipients"
                rows={4}
                value={recipients}
                onChange={(event) => setRecipients(event.target.value)}
                placeholder={`One per line\nName <email@domain.com>`}
              />
              <p className="text-xs text-gray-500">
                One recipient per line. Formats like{" "}
                <code>Name &lt;email@domain.com&gt;</code> are supported.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="json-data">JSON data</Label>
              <Textarea
                id="json-data"
                rows={8}
                value={dataJson}
                onChange={(event) => setDataJson(event.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              <Input type="file" multiple onChange={handleUpload} />
              {uploading && (
                <p className="text-xs text-gray-500">Uploading...</p>
              )}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{file.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {Math.round(file.size / 1024)} KB
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter(
                              (attachment) => attachment.id !== file.id,
                            ),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={handleSend}
                disabled={sending}
                className="min-w-[120px]"
              >
                {sending ? "Sending..." : "Send email"}
              </Button>
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={previewLoading || !selectedTemplateId}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewLoading ? "Rendering..." : "Preview & Test"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <EmailPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        htmlContent={previewHtml || ""}
        subject={previewSubject || ""}
      />
    </div>
  );
}

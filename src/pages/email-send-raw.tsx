import { useState } from "react";
import axios from "axios";
import { goeyToast as toast } from "goey-toast";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  EmailPreviewModal,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { Eye } from "lucide-react";

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

export default function EmailSendRawPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [recipients, setRecipients] = useState("");
  const [html, setHtml] = useState("<p>Hello!</p>");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const isAdmin = user?.role === "admin";

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
    if (!subject.trim()) {
      toast.error("Subject is required.");
      return;
    }
    if (!recipients.trim()) {
      toast.error("Please add at least one recipient.");
      return;
    }
    if (!html.trim()) {
      toast.error("HTML content is required.");
      return;
    }
    setSending(true);
    try {
      const response = await axios.post("/api/emails/send-raw", {
        subject,
        html,
        recipients: normalizeRecipients(recipients),
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
      <div className="space-y-4 max-w-3xl mx-auto">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Send Raw Email
          </h2>
          <p className="text-sm text-gray-600">
            Only administrators can send raw emails.
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
          Send Raw Email
        </h2>
        <p className="text-sm text-gray-500">
          Send custom HTML without a template.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
            <CardDescription>
              Define subject, recipients, and HTML content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="raw-subject">Subject</Label>
              <Input
                id="raw-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Invoice reminder"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="raw-recipients">Recipients</Label>
              <Textarea
                id="raw-recipients"
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
              <Label htmlFor="raw-html">HTML content</Label>
              <Textarea
                id="raw-html"
                rows={10}
                value={html}
                onChange={(event) => setHtml(event.target.value)}
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

            <div className="flex gap-3">
              <Button
                onClick={handleSend}
                disabled={sending}
                className="min-w-[120px]"
              >
                {sending ? "Sending..." : "Send email"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsPreviewModalOpen(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview & Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <EmailPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        htmlContent={html}
        subject={subject}
      />
    </div>
  );
}

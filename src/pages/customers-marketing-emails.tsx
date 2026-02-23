import { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button, Card, CardContent, Input, Textarea, DataTable } from "@/components/ui";
import { usePaginatedApi } from "@/hooks/usePaginatedApi";

type Template = {
  id: number;
  name: string;
  subject: string;
  body_html: string;
};

type Group = { id: number; name: string };

export default function CustomersMarketingEmailsPage() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p>Hello {{name}}</p>");
  const [queueTemplateId, setQueueTemplateId] = useState(0);
  const [groupId, setGroupId] = useState(0);

  const templatesApi = usePaginatedApi<Template>("/api/customers/marketing-templates", { initialLimit: 10 });
  const groupsApi = usePaginatedApi<Group>("/api/customers/groups", { initialLimit: 100 });

  const createTemplate = async () => {
    await axios.post("/api/customers/marketing-templates", { name, subject, body_html: bodyHtml });
    toast.success("Template created");
    setName("");
    setSubject("");
    templatesApi.refresh();
  };

  const queue = async () => {
    if (!queueTemplateId || !groupId) {
      toast.error("Select a template and group");
      return;
    }
    await axios.post("/api/customers/marketing-emails/queue", {
      template_id: queueTemplateId,
      group_id: groupId,
    });
    toast.success("Email request queued");
  };

  const columns = useMemo(() => [{ header: "Name", accessorKey: "name" as const }, { header: "Subject", accessorKey: "subject" as const }], []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Marketing Email</h2>
        <p className="text-sm text-gray-500">Create templates and queue marketing emails.</p>
      </div>
      <Card><CardContent className="p-6 space-y-3">
        <div className="grid gap-3"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" />
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
        <Textarea rows={6} value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} />
        <Button onClick={createTemplate}>Create Template</Button></div>
      </CardContent></Card>

      <Card><CardContent className="p-6 space-y-3">
        <p className="text-sm font-medium">Queue Email Send</p>
        <div className="grid md:grid-cols-3 gap-3">
          <Input type="number" value={queueTemplateId || ""} onChange={(e) => setQueueTemplateId(Number(e.target.value))} placeholder="Template ID" />
          <Input type="number" value={groupId || ""} onChange={(e) => setGroupId(Number(e.target.value))} placeholder="Group ID" />
          <Button onClick={queue}>Queue Send</Button>
        </div>
        {groupsApi.data.length > 0 && (
          <p className="text-xs text-gray-500">Available groups: {groupsApi.data.map((g) => `${g.id}:${g.name}`).join(", ")}</p>
        )}
      </CardContent></Card>

      <Card><CardContent className="p-6">
        <DataTable data={templatesApi.data} columns={columns} isLoading={templatesApi.loading} page={templatesApi.pagination.page} total={templatesApi.pagination.total} onPageChange={templatesApi.handlePageChange} onSearchChange={templatesApi.handleSearch} />
      </CardContent></Card>
    </div>
  );
}

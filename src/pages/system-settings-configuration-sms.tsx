import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui";

export default function SystemSettingsConfigurationSmsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          SMS Configuration
        </h2>
        <p className="text-sm text-gray-500">
          Manage SMS gateway settings and integration options.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SMS Settings</CardTitle>
          <CardDescription>Configure SMS delivery options.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center p-8 bg-gray-50 border border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm">Under development</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

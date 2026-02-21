import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { Link } from "react-router-dom";
import { User, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Account overview
        </h2>
        <p className="text-sm text-gray-500">
          Manage your profile, security, and access preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Profile</CardTitle>
            <User className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Update your display name, timezone, and preferences.
            </p>
            <Link to="/profile">
              <Button variant="outline" size="sm">
                Go to profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Settings</CardTitle>
            <Settings className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Configure account access, roles, and policy settings.
            </p>
            {isAdmin ? (
              <Link to="/system-settings">
                <Button variant="outline" size="sm">
                  Manage settings
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Admin only
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

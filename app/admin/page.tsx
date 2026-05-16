import { createClient } from "@/lib/supabase/auth-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, GitBranch, Clock, CheckCircle2, XCircle, Building2, User } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get statistics
  const { count: totalConfigs } = await supabase
    .from("configurations")
    .select("*", { count: "exact", head: true });

  const { count: recentConfigs } = await supabase
    .from("configurations")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const { count: totalMappings } = await supabase
    .from("hubspot_field_mappings")
    .select("*", { count: "exact", head: true });

  const { count: activeMappings } = await supabase
    .from("hubspot_field_mappings")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Get HubSpot sync stats
  const { count: hubspotSynced } = await supabase
    .from("configurations")
    .select("*", { count: "exact", head: true })
    .not("hubspot_contact_id", "is", null);

  const { count: hubspotFailed } = await supabase
    .from("configurations")
    .select("*", { count: "exact", head: true })
    .is("hubspot_contact_id", null);

  // Get recent configurations
  const { data: recentSubmissions } = await supabase
    .from("configurations")
    .select("reference, company, email, created_at, status, hubspot_contact_id, hubspot_company_id")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-stone-600 mt-1">
          Overview of your FarmDroid configurator
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">
              Total Configurations
            </CardTitle>
            <FileText className="h-4 w-4 text-stone-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalConfigs || 0}</div>
            <p className="text-xs text-stone-500 mt-1">All time submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">
              This Week
            </CardTitle>
            <Clock className="h-4 w-4 text-stone-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recentConfigs || 0}</div>
            <p className="text-xs text-stone-500 mt-1">New configurations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">
              HubSpot Synced
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{hubspotSynced || 0}</div>
            <p className="text-xs text-stone-500 mt-1">
              {hubspotFailed || 0} not synced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">
              Field Mappings
            </CardTitle>
            <GitBranch className="h-4 w-4 text-stone-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMappings || 0}</div>
            <p className="text-xs text-stone-500 mt-1">
              {activeMappings || 0} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Configurations</CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>Latest configuration submissions from the configurator</span>
            <span className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3 text-green-500" /> Contact
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3 text-green-500" /> Company
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-400" /> Not synced
              </span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentSubmissions && recentSubmissions.length > 0 ? (
            <div className="space-y-4">
              {(recentSubmissions as any[]).map((config) => {
                const hasContact = !!config.hubspot_contact_id;
                const hasCompany = !!config.hubspot_company_id;
                const hubspotConnected = hasContact || hasCompany;

                return (
                  <div
                    key={config.reference}
                    className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">
                        {config.company}
                      </p>
                      <p className="text-sm text-stone-500">{config.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* HubSpot Status */}
                      <div className="flex items-center gap-2">
                        {hubspotConnected ? (
                          <>
                            <div className="flex items-center gap-1" title={hasContact ? `Contact ID: ${config.hubspot_contact_id}` : "No contact created"}>
                              <User className={`h-4 w-4 ${hasContact ? "text-green-500" : "text-stone-300"}`} />
                            </div>
                            <div className="flex items-center gap-1" title={hasCompany ? `Company ID: ${config.hubspot_company_id}` : "No company created"}>
                              <Building2 className={`h-4 w-4 ${hasCompany ? "text-green-500" : "text-stone-300"}`} />
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1" title="Not synced to HubSpot">
                            <XCircle className="h-4 w-4 text-red-400" />
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-stone-600">
                          {config.reference}
                        </p>
                        <p className="text-xs text-stone-400">
                          {new Date(config.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-stone-500 text-center py-8">
              No configurations yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

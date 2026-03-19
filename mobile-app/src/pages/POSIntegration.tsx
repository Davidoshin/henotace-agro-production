import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";

export default function POSIntegration() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold">POS Integrations</h1>
        <p className="text-muted-foreground mt-2">Configure OPAY and Moniepoint integrations so your merchant POS can accept payments and push transactions back to Henotace.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 border rounded">
            <h3 className="font-semibold">OPAY</h3>
            <p className="text-sm mt-2">Webhook endpoint: <code>/api/external/webhooks/opay/</code></p>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-semibold">Moniepoint</h3>
            <p className="text-sm mt-2">Webhook endpoint: <code>/api/external/webhooks/moniepoint/</code></p>
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={() => window.location.href = '/business/settings'}>Configure Credentials</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

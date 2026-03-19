import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BusinessDeliveryManagement from '@/components/delivery/BusinessDeliveryManagement';

export default function BusinessDeliveriesPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-background border-b p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Delivery Management</h1>
      </div>
      
      <BusinessDeliveryManagement />
    </div>
  );
}

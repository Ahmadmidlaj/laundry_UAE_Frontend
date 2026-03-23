import { MapPin, Package, ChevronRight } from 'lucide-react';
import { type SanitizedOrder } from '@/utils/data-mappers';

interface Props {
  stop: {
    customerName: string;
    address: string;
    orders: SanitizedOrder[];
  };
}

export const CustomerStopCard = ({ stop }: Props) => {
  const totalItems = stop.orders.reduce((sum, o) => sum + o.itemCount, 0);

  return (
    <div className="bg-white rounded-premium shadow-soft border border-slate-100 overflow-hidden mb-4">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">{stop.customerName}</h3>
          <div className="flex items-center text-slate-500 text-sm">
            <MapPin size={14} className="mr-1" /> {stop.address}
          </div>
        </div>
        <div className="text-right">
          <span className="block text-xs font-bold text-brand-primary uppercase">Stop Summary</span>
          <span className="text-sm font-medium text-slate-600">{stop.orders.length} Orders • {totalItems} Items</span>
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {stop.orders.map((order) => (
          <div key={order.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50">
            <div>
              <p className="text-sm font-bold text-slate-800">{order.displayId}</p>
              <p className="text-xs text-slate-500">Scheduled: {order.rawDate}</p>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>
        ))}
      </div>

      <div className="p-4 bg-white">
        <button className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-dark transition-colors shadow-lg shadow-brand-primary/20">
          Confirm Collection from Customer
        </button>
      </div>
    </div>
  );
};
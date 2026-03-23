import React, { useState } from 'react';
import { Banknote, CreditCard, MessageSquare } from 'lucide-react';

export const DeliveryCollection = ({ order, onDeliver, isSubmitting }: any) => {
  const [amount, setAmount] = useState(order.estimated_price);
  const [method, setMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [notes, setNotes] = useState('');

  return (
    <div className="p-6 bg-white rounded-3xl shadow-xl space-y-6">
      <div className="text-center">
        <p className="text-slate-400 text-sm uppercase font-bold tracking-wider">Total Amount to Collect</p>
        <h2 className="text-4xl font-black text-slate-900">AED {order.estimated_price}</h2>
      </div>

      {/* Payment Method Toggle */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setMethod('CASH')}
          className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
            method === 'CASH' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-slate-100 text-slate-400'
          }`}
        >
          <Banknote size={24} />
          <span className="font-bold">Cash</span>
        </button>
        <button
          onClick={() => setMethod('CARD')}
          className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
            method === 'CARD' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-slate-100 text-slate-400'
          }`}
        >
          <CreditCard size={24} />
          <span className="font-bold">Card/Online</span>
        </button>
      </div>

      {/* Received Amount Input */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Received Amount (AED)</label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full p-4 mt-1 bg-slate-50 border-none rounded-xl text-lg font-bold focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {/* Notes */}
      <div className="relative">
        <MessageSquare className="absolute left-4 top-4 text-slate-300" size={20} />
        <textarea 
          placeholder="Delivery notes (optional)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-4 pl-12 bg-slate-50 border-none rounded-xl min-h-[100px] text-sm"
        />
      </div>

      <button
        disabled={isSubmitting || amount <= 0}
        onClick={() => onDeliver({ received_amount: amount, payment_method: method, notes })}
        className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-all"
      >
        Complete Delivery
      </button>
    </div>
  );
};
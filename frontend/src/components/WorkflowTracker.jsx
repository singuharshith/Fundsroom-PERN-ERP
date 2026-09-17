import React from 'react';
import { ClipboardList, FileText, ShoppingBag, Lock, Truck, CheckCircle2 } from 'lucide-react';

export default function WorkflowTracker({ currentStep = 1 }) {
  const steps = [
    { number: 1, title: 'Enquiry', desc: 'Customer Requirement', icon: ClipboardList },
    { number: 2, title: 'Quotation', desc: 'Pricing & GST Calculation', icon: FileText },
    { number: 3, title: 'Sales Order', desc: 'Accepted Deal Conversion', icon: ShoppingBag },
    { number: 4, title: 'Stock Reservation', desc: 'Atomic Inventory Lock', icon: Lock },
    { number: 5, title: 'Dispatch', desc: 'Fulfillment & Outbound', icon: Truck },
  ];

  return (
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">Core ERP Pipeline Status</h2>
          <p class="text-sm font-semibold text-slate-800">End-to-End Industrial Supply Chain Flow</p>
        </div>
        <span class="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 font-semibold">
          Step {currentStep} of 5
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <div
              key={step.number}
              class={`p-3 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200 opacity-60'
              }`}
            >
              <div class="flex items-center justify-between mb-1.5">
                <span
                  class={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    isCurrent
                      ? 'bg-white text-blue-600'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 class="w-4 h-4" /> : step.number}
                </span>
                <Icon class={`w-4 h-4 ${isCurrent ? 'text-blue-100' : isDone ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <div class="font-bold text-xs">{step.title}</div>
              <div class={`text-[10px] mt-0.5 ${isCurrent ? 'text-blue-100' : isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                {step.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

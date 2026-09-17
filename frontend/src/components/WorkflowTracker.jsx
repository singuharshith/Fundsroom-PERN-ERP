import React from 'react';
import { ClipboardList, FileText, ShoppingBag, Lock, Truck, Check } from 'lucide-react';

export default function WorkflowTracker({ currentStep = 1 }) {
  const steps = [
    { number: 1, title: '1. Enquiry', desc: 'Customer Requirement', icon: ClipboardList },
    { number: 2, title: '2. Quotation', desc: 'Pricing & GST Calculation', icon: FileText },
    { number: 3, title: '3. Sales Order', desc: 'Deal Conversion', icon: ShoppingBag },
    { number: 4, title: '4. Reservation', desc: 'Stock Lock', icon: Lock },
    { number: 5, title: '5. Dispatch', desc: 'Outbound Fulfillment', icon: Truck },
  ];

  return (
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">ERP Workflow Guide</span>
          <h2 class="text-base font-bold text-slate-900">Core Industrial Business Pipeline</h2>
        </div>
        <span class="text-xs font-bold font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
          Step {currentStep} of 5 Active
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
              class={`p-3.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
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
                  {isDone ? <Check class="w-3.5 h-3.5 stroke-[3]" /> : step.number}
                </span>
                <Icon class={`w-4 h-4 ${isCurrent ? 'text-white' : isDone ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <div class="font-bold text-xs">{step.title}</div>
              <div class={`text-[11px] mt-0.5 ${isCurrent ? 'text-blue-100' : isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                {step.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

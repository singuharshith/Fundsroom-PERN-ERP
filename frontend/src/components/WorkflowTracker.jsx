import React from 'react';

export default function WorkflowTracker({ currentStep = 1 }) {
  const stages = [
    { number: 1, label: 'ENQ', name: 'Enquiry' },
    { number: 2, label: 'QUO', name: 'Quotation' },
    { number: 3, label: 'SO', name: 'Sales Order' },
    { number: 4, label: 'RES', name: 'Reservation' },
    { number: 5, label: 'DISP', name: 'Dispatch' },
  ];

  return (
    <div class="bg-[#23282C] border border-[#3A4145] p-4 mb-5">
      <div class="flex items-center justify-between text-xs mb-3 font-mono">
        <span class="text-[#8F9799] uppercase">Pipeline routing stamp</span>
        <span class="text-[#8F9799]">
          Stage <span class="text-[#D99A3D] font-bold">{currentStep}</span> of 5
        </span>
      </div>

      <div class="relative flex items-center justify-between">
        {/* Horizontal connecting line */}
        <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-[#3A4145] z-0"></div>

        {stages.map((stage) => {
          const isDone = stage.number < currentStep;
          const isCurrent = stage.number === currentStep;

          return (
            <div key={stage.number} class="relative z-10 bg-[#23282C] px-2 text-center">
              <div
                class={`font-mono text-xs font-semibold pb-1 transition-colors ${
                  isCurrent
                    ? 'text-[#E9E6DF] border-b-2 border-[#D99A3D]'
                    : isDone
                    ? 'text-[#5A9E7A] border-b-2 border-[#5A9E7A]'
                    : 'text-[#8F9799]'
                }`}
              >
                {stage.label}
              </div>
              <span class="block text-[11px] text-[#8F9799] mt-1 font-sans">
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

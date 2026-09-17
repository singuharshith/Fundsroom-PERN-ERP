import React from 'react';

export default function WorkflowTracker({ currentStep = 1 }) {
  const steps = [
    { number: 1, name: 'Enquiry' },
    { number: 2, name: 'Quotation' },
    { number: 3, name: 'Sales Order' },
    { number: 4, name: 'Reservation' },
    { number: 5, name: 'Dispatch' },
  ];

  return (
    <div className="text-xs font-medium text-[#667085] my-1.5 flex items-center gap-1.5 flex-wrap font-sans">
      {steps.map((step, idx) => {
        const isCurrent = step.number === currentStep;
        return (
          <React.Fragment key={step.number}>
            <span
              className={
                isCurrent
                  ? 'font-semibold text-[#1F5C73]'
                  : 'text-[#667085]'
              }
            >
              {step.name}
            </span>
            {idx < steps.length - 1 && <span className="text-[#667085] mx-0.5">→</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

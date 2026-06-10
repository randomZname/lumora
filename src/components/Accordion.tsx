"use client";

import { useState } from "react";

type AccordionItem = {
  question: string;
  answer: string;
};

type AccordionProps = {
  items: AccordionItem[];
};

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className="glass rounded-xl border border-white/10 transition hover:border-neon-blue/60"
          >
            <button
              aria-expanded={isOpen}
              aria-controls={`accordion-${index}`}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-slate-100"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{item.question}</span>
              <span
                className={`text-sm transition-transform duration-200 ${isOpen ? "rotate-45 text-neon-blue" : "text-slate-400"}`}
              >
                +
              </span>
            </button>
            <div
              id={`accordion-${index}`}
              className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="min-h-0 px-5 pb-4 text-sm text-slate-300">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


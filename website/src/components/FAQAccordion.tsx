"use client";

import { useState } from "react";

import type { FAQItem } from "@/lib/faq-data";

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <article key={item.question} className="glass-card rounded-2xl">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <h3 className="text-base font-semibold">{item.question}</h3>
              <span className="text-primary">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="border-t border-border/60 px-5 pb-4 pt-2">
                <p className="text-sm leading-relaxed text-text-muted">{item.answer}</p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

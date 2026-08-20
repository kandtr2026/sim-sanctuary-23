"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { faqData } from '@/data/faqData';

const FAQSection = () => {
  return (
    <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
      <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
        <span className="w-1 h-8 bg-primary rounded-full"></span>
        Câu Hỏi Thường Gặp
      </h2>
      
      <Accordion type="single" collapsible className="space-y-2">
        {faqData.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border border-border rounded-lg px-4 data-[state=open]:bg-background-secondary"
          >
            <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary hover:no-underline py-4">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4 whitespace-pre-line">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default FAQSection;

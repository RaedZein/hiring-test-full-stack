import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
  Users,
  CheckCircle2,
  Calendar,
  TrendingUp,
  type LucideIcon
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion';
import { Button } from '../../../components/ui/button';
import type { ProjectPlan } from '../types';

interface ProjectPlanPreviewProps {
  plan: ProjectPlan;
}

const WORKSTREAM_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const DELIVERABLE_ICONS: LucideIcon[] = [FileText, Target, Users, CheckCircle2, Calendar, TrendingUp];

export function ProjectPlanPreview({ plan }: ProjectPlanPreviewProps) {
  const allWorkstreamIds = plan.workstreams.map((_, i) => `workstream-${i}`);
  const [expandedItems, setExpandedItems] = useState<string[]>(allWorkstreamIds);

  const allExpanded = expandedItems.length === plan.workstreams.length;

  const toggleAll = () => {
    setExpandedItems(allExpanded ? [] : allWorkstreamIds);
  };

  return (
    <div className="project-plan-preview border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between p-4 border-b bg-background/50">
        <h3 className="font-semibold text-base">Project Workstreams</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAll}
          className="h-8 text-xs gap-1"
        >
          {allExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Expand All
            </>
          )}
        </Button>
      </div>

      <div className="p-4">
        <Accordion
          type="multiple"
          value={expandedItems}
          onValueChange={setExpandedItems}
          className="space-y-2"
        >
          {plan.workstreams.map((workstream, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <AccordionItem
                value={`workstream-${index}`}
                className="border rounded-md bg-background"
              >
                <AccordionTrigger className="px-4 hover:no-underline group">
                  <div className="flex items-start gap-3 text-left w-full">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                      {WORKSTREAM_LETTERS[index]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium group-hover:text-primary transition-colors">
                        {workstream.title}
                      </div>
                      {workstream.description && (
                        <div className="text-sm text-muted-foreground mt-1 font-normal">
                          {workstream.description}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-9 space-y-3 mt-2"
                    >
                      <div className="font-semibold text-sm">Deliverables</div>
                      <div className="space-y-3">
                        {workstream.deliverables.map((deliverable, deliverableIndex) => {
                          const Icon = DELIVERABLE_ICONS[deliverableIndex % DELIVERABLE_ICONS.length];
                          return (
                            <motion.div
                              key={deliverableIndex}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: deliverableIndex * 0.05 }}
                              className="flex items-start gap-3"
                            >
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-muted mt-0.5">
                                <Icon className="h-3 w-3 text-muted-foreground" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">
                                  {deliverable.title}
                                </div>
                                {deliverable.description && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {deliverable.description}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Badge } from '../../../components/ui/badge';

/**
 * Project Plan Skeleton Component
 *
 * Shimmer skeleton shown while project plan JSON is streaming.
 * Displays animated placeholders for workstreams until the complete
 * JSON block is received and validated.
 */
export function ProjectPlanSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="project-plan-skeleton border rounded-lg p-4 bg-muted/30"
    >
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="secondary">Generating Project Plan...</Badge>
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border rounded-md p-4 animate-pulse bg-background"
          >
            <div className="h-5 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted/60 rounded w-2/3" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

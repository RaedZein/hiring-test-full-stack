import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 px-4 py-3 bg-muted/50 rounded-lg w-fit">
      <motion.span
        className="w-2 h-2 bg-foreground/60 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0,
        }}
      />
      <motion.span
        className="w-2 h-2 bg-foreground/60 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0.2,
        }}
      />
      <motion.span
        className="w-2 h-2 bg-foreground/60 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0.4,
        }}
      />
    </div>
  );
}

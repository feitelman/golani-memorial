"use client";

import { motion, useReducedMotion } from "framer-motion";

// App-Router template remounts on every navigation, giving each route a
// cinematic enter transition: a brief fade + settle. We deliberately avoid a
// `filter: blur` here — over the full-screen WebGL map the heavy init janks the
// animation and can leave a residual blur frozen on the page. Opacity/transform
// are GPU-cheap and never get visually stuck.
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

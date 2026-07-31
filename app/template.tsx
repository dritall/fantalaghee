"use client";
import { motion } from "framer-motion";

/**
 * Transizione fra le pagine.
 *
 * Niente `filter` animato: un filtro diverso da `none` resta applicato inline
 * anche a fine animazione e crea uno stacking context, che intrappola sotto di
 * sé qualsiasi overlay in position:fixed dichiarato dentro la pagina.
 * Opacità e spostamento danno lo stesso effetto senza quel prezzo.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

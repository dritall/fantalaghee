"use client";
import { motion } from "framer-motion";

/**
 * Transizione fra le pagine — l'apertura.
 *
 * La pagina entra salendo e mettendo a fuoco. Niente `filter` animato né scala
 * che resti a riposo: un transform diverso da `none` a fine animazione crea uno
 * stacking context che intrappolerebbe gli overlay in position:fixed dichiarati
 * dentro la pagina (la barra di lettura della Gazzetta, per esempio). `y` torna
 * a 0 e framer ripulisce il transform, quindi resta solo opacità + spostamento.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

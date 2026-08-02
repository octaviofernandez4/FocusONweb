import { useEffect } from 'react';

// Bloquea el scroll del body mientras `locked` es true — para overlays a
// pantalla completa (drawers, paneles) donde si no, el touch/scroll dentro
// del overlay termina scrolleando la página de atrás.
export const useBodyScrollLock = (locked) => {
  useEffect(() => {
    if (!locked) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked]);
};

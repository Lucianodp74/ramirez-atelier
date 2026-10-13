'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NAVIGAZIONE } from './contenuti';

const focusAnello =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pa-antracite)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pa-avorio)]';

export function Intestazione() {
  const [aperto, setAperto] = useState(false);
  const pulsante = useRef<HTMLButtonElement>(null);
  const primoLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!aperto) return;
    primoLink.current?.focus();
    const chiudiConEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAperto(false);
        pulsante.current?.focus();
      }
    };
    document.addEventListener('keydown', chiudiConEsc);
    return () => document.removeEventListener('keydown', chiudiConEsc);
  }, [aperto]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--pa-linea)] bg-[var(--pa-avorio)]/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-6 px-5 sm:h-20 sm:px-8">
        <Link
          href="#inizio"
          aria-label="Ramirez Atelier — inizio pagina"
          className={`flex min-h-11 shrink-0 items-center gap-3 rounded-sm ${focusAnello}`}
        >
          <Image
            src="/logo-monogramma.png"
            alt=""
            width={666}
            height={487}
            priority
            className="h-9 w-auto sm:h-10"
          />
          <span className="font-serif text-[1.05rem] tracking-[0.02em] text-[var(--pa-antracite)]">
            Ramirez Atelier
          </span>
        </Link>

        <nav aria-label="Navigazione principale" className="hidden lg:block">
          <ul className="flex items-center gap-9 text-sm text-[var(--pa-grigio)]">
            {NAVIGAZIONE.map((voce) => (
              <li key={voce.href}>
                <a
                  href={voce.href}
                  className={`relative rounded-sm py-2 pa-colore after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-[var(--pa-bronzo)] after:transition-transform after:duration-200 after:ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[var(--pa-antracite)] hover:after:scale-x-100 ${focusAnello}`}
                >
                  {voce.etichetta}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/progetti"
            className={`hidden h-11 items-center rounded-full bg-[var(--pa-antracite)] px-6 text-sm font-medium text-[var(--pa-avorio)] pa-premi hover:bg-[var(--pa-noce)] sm:inline-flex ${focusAnello}`}
          >
            Richiedi un progetto
          </Link>
          <button
            ref={pulsante}
            type="button"
            aria-expanded={aperto}
            aria-controls="menu-mobile"
            onClick={() => setAperto((v) => !v)}
            className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-[var(--pa-linea)] text-[var(--pa-antracite)] pa-premi hover:bg-[var(--pa-avorio-2)] lg:hidden ${focusAnello}`}
          >
            {aperto ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
            <span className="sr-only">{aperto ? 'Chiudi il menu' : 'Apri il menu'}</span>
          </button>
        </div>
      </div>

      <div
        id="menu-mobile"
        hidden={!aperto}
        className="pa-comparsa border-t border-[var(--pa-linea)] bg-[var(--pa-avorio)] lg:hidden"
      >
        <nav
          aria-label="Navigazione principale (mobile)"
          className="mx-auto max-w-[1320px] px-5 py-6 sm:px-8"
        >
          <ul className="divide-y divide-[var(--pa-linea)]">
            {NAVIGAZIONE.map((voce, i) => (
              <li key={voce.href}>
                <a
                  ref={i === 0 ? primoLink : undefined}
                  href={voce.href}
                  onClick={() => setAperto(false)}
                  className={`flex min-h-14 items-center justify-between rounded-sm font-serif text-2xl font-light text-[var(--pa-antracite)] ${focusAnello}`}
                >
                  {voce.etichetta}
                  <span aria-hidden="true" className="text-base text-[var(--pa-bronzo)]">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <Link
            href="/progetti"
            onClick={() => setAperto(false)}
            className={`mt-6 flex h-12 items-center justify-center rounded-full bg-[var(--pa-antracite)] text-sm font-medium text-[var(--pa-avorio)] ${focusAnello}`}
          >
            Richiedi un progetto
          </Link>
        </nav>
      </div>
    </header>
  );
}

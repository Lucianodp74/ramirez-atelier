import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { TipoProgettoConfigurazione } from '../src/lib/tipo-progetto-schema';
import { calcolaHashPassword } from '../src/lib/identity/password';
import { sincronizzaPermessiCatalogo } from '../src/server/services/ruolo-service';

// Prisma 7: anche qui serve il driver adapter esplicito, come in src/server/db.ts.
// Il seed usa DIRECT_URL (non DATABASE_URL) perché gira una tantum da riga di
// comando, non come parte dell'app a runtime - non ha bisogno del pooler.
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Nota: questo script è funzionalmente equivalente a prisma/seed.sql (già verificato
 * eseguendolo direttamente contro Postgres in fase di sviluppo, dato che questo
 * sandbox non ha accesso di rete a binaries.prisma.sh per generare il Prisma Client).
 * In un ambiente con accesso di rete normale, questo è lo script ufficiale da eseguire.
 */

const configurazioneCucina: TipoProgettoConfigurazione = {
  step: [
    {
      chiave: 'dimensioni',
      titolo: 'Le dimensioni del tuo spazio',
      sottotitolo: 'Anche solo indicative: le perfezioneremo insieme.',
      campi: [
        {
          chiave: 'larghezzaCm',
          etichetta: 'Larghezza (cm)',
          tipo: 'numero',
          obbligatorio: false,
          pesoCompletezza: 15,
          chiavePricing: 'larghezzaCm', // valore grezzo (cm), non una fascia pre-calcolata - le condizioni delle Regole di pricing usano operatori di intervallo direttamente su questo numero
        },
        {
          chiave: 'profonditaCm',
          etichetta: 'Profondità (cm)',
          tipo: 'numero',
          obbligatorio: false,
          pesoCompletezza: 10,
        },
        {
          chiave: 'misureNonNote',
          etichetta: 'Non conosco ancora le misure esatte',
          tipo: 'select',
          obbligatorio: false,
          pesoCompletezza: 5,
          opzioni: [
            { valore: 'si', etichetta: 'È corretto, mi serve un sopralluogo' },
            { valore: 'no', etichetta: 'Le misure sopra sono affidabili' },
          ],
        },
      ],
    },
    {
      chiave: 'materiali',
      titolo: 'Il materiale che ti rappresenta',
      campi: [
        {
          chiave: 'materiale',
          etichetta: 'Materiale',
          tipo: 'select_immagine',
          obbligatorio: false,
          pesoCompletezza: 20,
          chiavePricing: 'materiale', // valore grezzo (slug della Finitura, es. 'rovere'), le Regole di pricing lo confrontano con 'in'/'uguale'
          fonteOpzioni: 'finitura', // Catalogo Tecnico (ADR-0006) - non più opzioni statiche duplicate qui
        },
      ],
    },
    {
      chiave: 'stile',
      titolo: 'Lo stile del progetto',
      campi: [
        {
          chiave: 'stile',
          etichetta: 'Stile',
          tipo: 'select_immagine',
          obbligatorio: false,
          pesoCompletezza: 15,
          opzioni: [
            { valore: 'minimal', etichetta: 'Minimal' },
            { valore: 'moderno', etichetta: 'Moderno' },
            { valore: 'classico', etichetta: 'Classico' },
            { valore: 'contemporaneo', etichetta: 'Contemporaneo' },
            { valore: 'luxury', etichetta: 'Luxury' },
          ],
        },
      ],
    },
    {
      chiave: 'ferramenta',
      titolo: 'Dettagli che fanno la differenza',
      campi: [
        {
          chiave: 'ferramenta',
          etichetta: 'Ferramenta preferita',
          tipo: 'select',
          obbligatorio: false,
          pesoCompletezza: 10,
          fonteOpzioni: 'ferramenta',
        },
      ],
    },
    {
      chiave: 'budget_tempi',
      titolo: 'Budget e tempistiche',
      campi: [
        {
          chiave: 'fasciaBudgetId',
          etichetta: 'Fascia di budget indicativa',
          tipo: 'select',
          obbligatorio: false,
          pesoCompletezza: 15,
          fonteOpzioni: 'fascia_budget',
          aiutoTesto:
            'Solo per orientarci: nessun impegno, la stima finale dipenderà dal progetto reale.',
        },
        {
          chiave: 'budgetDichiarato',
          etichetta: 'Note aggiuntive sul budget (facoltativo)',
          tipo: 'testo',
          obbligatorio: false,
          pesoCompletezza: 5,
          placeholder: 'es. flessibile se il risultato ne vale la pena',
        },
        {
          chiave: 'dataDesiderata',
          etichetta: 'Quando vorresti iniziare i lavori?',
          tipo: 'data',
          obbligatorio: false,
          pesoCompletezza: 5,
        },
      ],
    },
    {
      chiave: 'racconta',
      titolo: 'Raccontaci il tuo progetto',
      sottotitolo: 'Con parole tue: più dettagli ci dai, più precisa sarà la nostra proposta.',
      campi: [
        {
          chiave: 'messaggioLibero',
          etichetta: 'Descrizione libera',
          tipo: 'testo_lungo',
          obbligatorio: false,
          pesoCompletezza: 5,
        },
      ],
    },
    {
      chiave: 'contatti',
      titolo: 'Come possiamo ricontattarti',
      sottotitolo: 'Ci servono solo pochi dati per condividere con te la prima proposta.',
      campi: [
        {
          chiave: 'clienteNome',
          etichetta: 'Nome e cognome',
          tipo: 'testo',
          obbligatorio: true,
          pesoCompletezza: 10,
        },
        {
          chiave: 'clienteEmail',
          etichetta: 'Email',
          tipo: 'testo',
          obbligatorio: true,
          pesoCompletezza: 10,
          validazione: {
            pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            messaggioPattern: 'Inserisci un indirizzo email valido.',
          },
        },
        {
          chiave: 'clienteTelefono',
          etichetta: 'Telefono (facoltativo)',
          tipo: 'testo',
          obbligatorio: false,
          pesoCompletezza: 5,
        },
        {
          chiave: 'clienteTipo',
          etichetta: 'Chi sei',
          tipo: 'select',
          obbligatorio: false,
          pesoCompletezza: 5,
          opzioni: [
            { valore: 'PRIVATO', etichetta: 'Privato' },
            { valore: 'ARCHITETTO', etichetta: 'Architetto / Interior designer' },
            { valore: 'IMPRESA', etichetta: 'Impresa' },
            { valore: 'STUDIO_TECNICO', etichetta: 'Studio tecnico' },
          ],
        },
      ],
    },
  ],
};

const configurazioneArmadio: TipoProgettoConfigurazione = {
  step: [
    {
      chiave: 'dimensioni',
      titolo: 'Lo spazio a disposizione',
      campi: [
        {
          chiave: 'larghezzaCm',
          etichetta: 'Larghezza (cm)',
          tipo: 'numero',
          obbligatorio: false,
          pesoCompletezza: 20,
          chiavePricing: 'larghezzaCm', // valore grezzo (cm), non una fascia pre-calcolata - le condizioni delle Regole di pricing usano operatori di intervallo direttamente su questo numero
        },
        {
          chiave: 'altezzaCm',
          etichetta: 'Altezza (cm)',
          tipo: 'numero',
          obbligatorio: false,
          pesoCompletezza: 10,
        },
      ],
    },
    {
      chiave: 'materiali',
      titolo: 'Materiale e finitura',
      campi: [
        {
          chiave: 'materiale',
          etichetta: 'Materiale',
          tipo: 'select_immagine',
          obbligatorio: false,
          pesoCompletezza: 20,
          chiavePricing: 'materiale',
          fonteOpzioni: 'finitura',
        },
      ],
    },
    {
      chiave: 'interni',
      titolo: 'Come vuoi organizzarlo internamente',
      campi: [
        {
          chiave: 'configurazioneInterna',
          etichetta: 'Configurazione interna',
          tipo: 'select',
          obbligatorio: false,
          pesoCompletezza: 20,
          fonteOpzioni: 'accessorio',
        },
      ],
    },
    {
      chiave: 'budget_tempi',
      titolo: 'Budget e tempistiche',
      campi: [
        {
          chiave: 'fasciaBudgetId',
          etichetta: 'Fascia di budget indicativa',
          tipo: 'select',
          obbligatorio: false,
          pesoCompletezza: 20,
          fonteOpzioni: 'fascia_budget',
        },
        {
          chiave: 'dataDesiderata',
          etichetta: 'Quando vorresti iniziare?',
          tipo: 'data',
          obbligatorio: false,
          pesoCompletezza: 10,
        },
      ],
    },
    {
      chiave: 'contatti',
      titolo: 'Come possiamo ricontattarti',
      sottotitolo: 'Ci servono solo pochi dati per condividere con te la prima proposta.',
      campi: [
        {
          chiave: 'clienteNome',
          etichetta: 'Nome e cognome',
          tipo: 'testo',
          obbligatorio: true,
          pesoCompletezza: 10,
        },
        {
          chiave: 'clienteEmail',
          etichetta: 'Email',
          tipo: 'testo',
          obbligatorio: true,
          pesoCompletezza: 10,
          validazione: {
            pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            messaggioPattern: 'Inserisci un indirizzo email valido.',
          },
        },
        {
          chiave: 'clienteTelefono',
          etichetta: 'Telefono (facoltativo)',
          tipo: 'testo',
          obbligatorio: false,
          pesoCompletezza: 5,
        },
      ],
    },
  ],
};

async function main() {
  // Tenant "well-known" (id fisso, creato dalla migrazione Identity & Security).
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'ramirez-atelier' } });
  if (!tenant) {
    throw new Error(
      'Tenant "ramirez-atelier" non trovato: eseguire prima la migrazione 20260717160000_identity_security.',
    );
  }
  const tenantId = tenant.id;

  const cucina = await prisma.tipoProgetto.upsert({
    where: { tenantId_chiave: { tenantId, chiave: 'cucina' } },
    // Bug corretto: `update: {}` lasciava le righe già esistenti congelate alla
    // configurazione della prima esecuzione del seed - qualunque modifica al
    // wizard (es. l'aggiunta della fascia di budget dinamica) non veniva mai
    // applicata al database di sviluppo già popolato. Il seed deve aggiornare
    // la configurazione ad ogni esecuzione, non solo crearla la prima volta.
    update: {
      nome: 'Cucina su misura',
      descrizione:
        'Progetta la cucina dei tuoi sogni, pensata attorno al tuo spazio e al tuo modo di vivere la casa.',
      configurazione: configurazioneCucina,
    },
    create: {
      tenantId,
      chiave: 'cucina',
      nome: 'Cucina su misura',
      descrizione:
        'Progetta la cucina dei tuoi sogni, pensata attorno al tuo spazio e al tuo modo di vivere la casa.',
      ordinamento: 1,
      configurazione: configurazioneCucina,
    },
  });

  const armadio = await prisma.tipoProgetto.upsert({
    where: { tenantId_chiave: { tenantId, chiave: 'armadio' } },
    update: {
      nome: 'Armadio e cabina armadio su misura',
      descrizione:
        'Ogni centimetro pensato per il tuo spazio, il tuo guardaroba, la tua quotidianità.',
      configurazione: configurazioneArmadio,
    },
    create: {
      tenantId,
      chiave: 'armadio',
      nome: 'Armadio e cabina armadio su misura',
      descrizione:
        'Ogni centimetro pensato per il tuo spazio, il tuo guardaroba, la tua quotidianità.',
      ordinamento: 2,
      configurazione: configurazioneArmadio,
    },
  });

  // Motore di Pricing (Incremento 7): sostituisce la vecchia RegolaPrezzo
  // (mai realmente interrogata) con regole vere del Rule Engine generico,
  // contesto "preventivo_pricing". Nessuna formula nel codice: gli intervalli
  // e i prezzi sono interamente dati in queste righe. Priorità decrescente =
  // regole più specifiche valutate per prime (fermaAlPrimoMatch le rende
  // reciprocamente esclusive - vince la prima che matcha).
  const regolePricingEsistenti = await prisma.regola.findMany({
    where: { tenantId, contesto: 'preventivo_pricing' },
  });
  if (regolePricingEsistenti.length === 0) {
    const regolePricing = [
      {
        nome: 'Cucina grande, materiale pietra',
        priorita: 40,
        condizioni: {
          operatoreLogico: 'E',
          figli: [
            { campo: 'richiesta.tipoProgettoChiave', operatore: 'uguale', valore: 'cucina' },
            { campo: 'richiesta.larghezzaCm', operatore: 'maggiore', valore: 400 },
            { campo: 'richiesta.materiale', operatore: 'uguale', valore: 'pietra' },
          ],
        },
        azioni: [{ tipo: 'imposta_fascia_prezzo', parametri: { min: 35000, max: 50000 } }],
      },
      {
        nome: 'Cucina media, materiale premium (rovere o laccato)',
        priorita: 30,
        condizioni: {
          operatoreLogico: 'E',
          figli: [
            { campo: 'richiesta.tipoProgettoChiave', operatore: 'uguale', valore: 'cucina' },
            { campo: 'richiesta.larghezzaCm', operatore: 'tra', valore: [250, 400] },
            { campo: 'richiesta.materiale', operatore: 'in', valore: ['rovere', 'laccato_opaco'] },
          ],
        },
        azioni: [{ tipo: 'imposta_fascia_prezzo', parametri: { min: 18000, max: 26000 } }],
      },
      {
        nome: 'Cucina media, materiale standard',
        priorita: 20,
        condizioni: {
          operatoreLogico: 'E',
          figli: [
            { campo: 'richiesta.tipoProgettoChiave', operatore: 'uguale', valore: 'cucina' },
            { campo: 'richiesta.larghezzaCm', operatore: 'tra', valore: [250, 400] },
          ],
        },
        azioni: [{ tipo: 'imposta_fascia_prezzo', parametri: { min: 12000, max: 18000 } }],
      },
      {
        nome: 'Cucina piccola',
        priorita: 15,
        condizioni: {
          operatoreLogico: 'E',
          figli: [
            { campo: 'richiesta.tipoProgettoChiave', operatore: 'uguale', valore: 'cucina' },
            { campo: 'richiesta.larghezzaCm', operatore: 'minore', valore: 250 },
          ],
        },
        azioni: [{ tipo: 'imposta_fascia_prezzo', parametri: { min: 8000, max: 12000 } }],
      },
      {
        nome: 'Cucina, stima generica (larghezza non indicata)',
        priorita: 5,
        condizioni: {
          campo: 'richiesta.tipoProgettoChiave',
          operatore: 'uguale',
          valore: 'cucina',
        },
        azioni: [{ tipo: 'imposta_fascia_prezzo', parametri: { min: 10000, max: 20000 } }],
      },
      {
        nome: 'Armadio, larghezza ampia',
        priorita: 20,
        condizioni: {
          operatoreLogico: 'E',
          figli: [
            { campo: 'richiesta.tipoProgettoChiave', operatore: 'uguale', valore: 'armadio' },
            { campo: 'richiesta.larghezzaCm', operatore: 'maggiore_uguale', valore: 300 },
          ],
        },
        azioni: [{ tipo: 'imposta_fascia_prezzo', parametri: { min: 4000, max: 7000 } }],
      },
      {
        nome: 'Armadio, stima generica',
        priorita: 5,
        condizioni: {
          campo: 'richiesta.tipoProgettoChiave',
          operatore: 'uguale',
          valore: 'armadio',
        },
        azioni: [{ tipo: 'imposta_fascia_prezzo', parametri: { min: 3000, max: 5000 } }],
      },
    ];

    for (const regola of regolePricing) {
      await prisma.regola.create({
        data: {
          tenantId,
          contesto: 'preventivo_pricing',
          nome: regola.nome,
          priorita: regola.priorita,
          condizioni: regola.condizioni,
          azioni: regola.azioni,
        },
      });
    }
  }

  // Fasce di budget - dati di configurazione amministrabili (Decisione 2), non
  // valori hardcoded nell'interfaccia. `ordinamento` funge anche da "livello"
  // leggibile dalle condizioni delle regole (es. "fascia >= 4").
  const fasceEsistenti = await prisma.fasciaBudget.findMany({ where: { tenantId } });
  if (fasceEsistenti.length === 0) {
    await prisma.fasciaBudget.createMany({
      data: [
        { tenantId, nome: '0 - 3.000 €', minimo: 0, massimo: 3000, ordinamento: 1 },
        { tenantId, nome: '3.000 - 6.000 €', minimo: 3000, massimo: 6000, ordinamento: 2 },
        { tenantId, nome: '6.000 - 10.000 €', minimo: 6000, massimo: 10000, ordinamento: 3 },
        { tenantId, nome: '10.000 - 20.000 €', minimo: 10000, massimo: 20000, ordinamento: 4 },
        { tenantId, nome: '20.000 € e oltre', minimo: 20000, massimo: null, ordinamento: 5 },
      ],
    });
  }

  // Catalogo Tecnico (ADR-0006) - Incremento 1: Finiture reali, raggruppate per
  // categoria. Gli slug 'rovere', 'laccato_opaco', 'laminato', 'pietra' sono
  // preservati esattamente: le Regole di pricing esistenti (sotto) li referenziano
  // già e non vanno riscritte solo perché il catalogo si arricchisce.
  const finitureEsistenti = await prisma.finitura.findMany({ where: { tenantId } });
  if (finitureEsistenti.length === 0) {
    await prisma.finitura.createMany({
      data: [
        // Legno
        {
          tenantId,
          categoria: 'legno',
          slug: 'rovere',
          nome: 'Rovere Naturale',
          descrizione: 'Caldo, autentico, senza tempo',
          coloreHex: '#B08558',
          texture: 'legno',
          ordinamento: 1,
        },
        {
          tenantId,
          categoria: 'legno',
          slug: 'noce_canaletto',
          nome: 'Noce Canaletto',
          descrizione: 'Venature decise, carattere deciso',
          coloreHex: '#5C3A28',
          texture: 'legno',
          ordinamento: 2,
        },
        {
          tenantId,
          categoria: 'legno',
          slug: 'frassino_tinto_grigio',
          nome: 'Frassino Tinto Grigio',
          descrizione: 'Contemporaneo, dalla venatura marcata',
          coloreHex: '#8A8680',
          texture: 'legno',
          ordinamento: 3,
        },
        // Laccato
        {
          tenantId,
          categoria: 'laccato',
          slug: 'laccato_opaco',
          nome: 'Laccato Bianco Opaco',
          descrizione: 'Pulito, contemporaneo, materico',
          coloreHex: '#F2F0EC',
          texture: 'liscio',
          ordinamento: 1,
        },
        {
          tenantId,
          categoria: 'laccato',
          slug: 'laccato_antracite',
          nome: 'Laccato Antracite Opaco',
          descrizione: 'Deciso, elegante, moderno',
          coloreHex: '#3B3D3E',
          texture: 'liscio',
          ordinamento: 2,
        },
        {
          tenantId,
          categoria: 'laccato',
          slug: 'laccato_verde_salvia',
          nome: 'Laccato Verde Salvia Opaco',
          descrizione: 'Naturale, morbido, distintivo',
          coloreHex: '#8A9A82',
          texture: 'liscio',
          ordinamento: 3,
        },
        // Laminato
        {
          tenantId,
          categoria: 'laminato',
          slug: 'laminato',
          nome: 'Laminato Tecnico Bianco',
          descrizione: 'Resistente, versatile, accessibile',
          coloreHex: '#EDEDE8',
          texture: 'liscio',
          ordinamento: 1,
        },
        {
          tenantId,
          categoria: 'laminato',
          slug: 'laminato_effetto_cemento',
          nome: 'Laminato Effetto Cemento',
          descrizione: 'Industriale, materico, di tendenza',
          coloreHex: '#9C9A94',
          texture: 'pietra',
          ordinamento: 2,
        },
        // Pietra e Marmo
        {
          tenantId,
          categoria: 'pietra_marmo',
          slug: 'pietra',
          nome: 'Effetto Pietra Grigia',
          descrizione: 'Luxury, scenico, importante',
          coloreHex: '#6E6C68',
          texture: 'pietra',
          ordinamento: 1,
        },
        {
          tenantId,
          categoria: 'pietra_marmo',
          slug: 'marmo_calacatta',
          nome: 'Marmo Calacatta',
          descrizione: 'Venature dorate su fondo chiaro, massima eleganza',
          coloreHex: '#E8E4DA',
          texture: 'pietra',
          ordinamento: 2,
        },
        // Metallo
        {
          tenantId,
          categoria: 'metallo',
          slug: 'acciaio_spazzolato',
          nome: 'Acciaio Spazzolato',
          descrizione: 'Tecnico, essenziale, contemporaneo',
          coloreHex: '#A8ACAE',
          texture: 'metallo',
          ordinamento: 1,
        },
      ],
      skipDuplicates: true,
    });
  }

  // Catalogo Tecnico (ADR-0006) - Incremento 3: Ferramenta reale, raggruppata
  // per categoria (cerniera, guida, sistema_apertura, maniglia).
  const ferramentaEsistente = await prisma.ferramenta.findMany({ where: { tenantId } });
  if (ferramentaEsistente.length === 0) {
    await prisma.ferramenta.createMany({
      data: [
        {
          tenantId,
          categoria: 'cerniera',
          slug: 'cerniera_standard',
          nome: 'Cerniera Standard',
          descrizione: 'Apertura semplice, affidabile',
          ordinamento: 1,
        },
        {
          tenantId,
          categoria: 'cerniera',
          slug: 'cerniera_softclose',
          nome: 'Cerniera Soft-Close',
          descrizione: 'Chiusura ammortizzata, senza rumore',
          ordinamento: 2,
        },
        {
          tenantId,
          categoria: 'sistema_apertura',
          slug: 'pushpull',
          nome: 'Push-Pull (senza maniglia)',
          descrizione: 'Apertura a pressione, superficie continua',
          ordinamento: 1,
        },
        {
          tenantId,
          categoria: 'maniglia',
          slug: 'maniglia_gola_alluminio',
          nome: 'Maniglia a Gola Alluminio',
          descrizione: 'Incassata, minimale',
          ordinamento: 1,
        },
        {
          tenantId,
          categoria: 'maniglia',
          slug: 'maniglia_pomolo_ottone',
          nome: 'Maniglia a Pomolo Ottone',
          descrizione: 'Classica, materica',
          ordinamento: 2,
        },
      ],
      skipDuplicates: true,
    });
  }

  // Catalogo Tecnico (ADR-0006) - Incremento 3: Accessori reali, raggruppati
  // per categoria (interni_cabina, illuminazione, elettrodomestico).
  const accessorioEsistente = await prisma.accessorio.findMany({ where: { tenantId } });
  if (accessorioEsistente.length === 0) {
    await prisma.accessorio.createMany({
      data: [
        {
          tenantId,
          categoria: 'interni_cabina',
          slug: 'cassettiera_interna',
          nome: 'Cassettiera Interna',
          descrizione: 'Per biancheria e accessori piccoli',
          ordinamento: 1,
        },
        {
          tenantId,
          categoria: 'interni_cabina',
          slug: 'scarpiera_estraibile',
          nome: 'Scarpiera Estraibile',
          descrizione: 'Ripiani inclinati salvaspazio',
          ordinamento: 2,
        },
        {
          tenantId,
          categoria: 'illuminazione',
          slug: 'illuminazione_led_interna',
          nome: 'Illuminazione LED Interna',
          descrizione: "Si accende all'apertura dell'anta",
          ordinamento: 1,
        },
      ],
      skipDuplicates: true,
    });
  }

  // Catalogo Tecnico (ADR-0006 §3.7) - Incremento 4: Stili di partenza reali,
  // agganciati direttamente a TipoProgetto (Modello non ancora costruito).
  const variantiEsistenti = await prisma.variantePreimpostata.findMany({ where: { tenantId } });
  if (variantiEsistenti.length === 0) {
    await prisma.variantePreimpostata.create({
      data: {
        tenantId,
        tipoProgettoId: cucina.id,
        nome: 'Stile Classico Rovere',
        descrizione: 'Caldo, senza tempo, per chi ama il legno naturale',
        scelte: { materiale: 'rovere', ferramenta: 'maniglia_pomolo_ottone' },
        ordinamento: 1,
      },
    });
    await prisma.variantePreimpostata.create({
      data: {
        tenantId,
        tipoProgettoId: cucina.id,
        nome: 'Stile Contemporaneo Laccato',
        descrizione: 'Pulito, essenziale, superfici continue',
        scelte: { materiale: 'laccato_opaco', ferramenta: 'pushpull' },
        ordinamento: 2,
      },
    });
    await prisma.variantePreimpostata.create({
      data: {
        tenantId,
        tipoProgettoId: armadio.id,
        nome: 'Cabina Armadio Completa',
        descrizione: 'Cassettiera, scarpiera e illuminazione già pensate per te',
        scelte: { materiale: 'laccato_opaco', configurazioneInterna: 'cassettiera_interna' },
        ordinamento: 1,
      },
    });
  }

  // Regola dimostrativa - primo caso d'uso reale del Rule Engine generico
  // (ADR-0003). Una sola regola per questo contesto in questo incremento:
  // la risoluzione dei conflitti tra regole sovrapposte non è ancora stata
  // affrontata (v. src/lib/rule-engine/motore.ts), quindi si evita
  // deliberatamente di introdurre il problema prima che serva davvero.
  const regolaEsistente = await prisma.regola.findMany({
    where: { tenantId, contesto: 'richiesta_priorita_commerciale' },
  });
  if (regolaEsistente.length === 0) {
    await prisma.regola.create({
      data: {
        tenantId,
        contesto: 'richiesta_priorita_commerciale',
        nome: 'Priorità alta per budget elevato e richiesta ben compilata',
        descrizione:
          'Se il cliente ha indicato una fascia di budget alta (livello 4 o 5) e la richiesta è compilata per almeno il 70%, la segnala come priorità commerciale alta.',
        priorita: 10,
        condizioni: {
          operatoreLogico: 'E',
          figli: [
            { campo: 'richiesta.fasciaBudgetOrdinamento', operatore: 'maggiore_uguale', valore: 4 },
            { campo: 'richiesta.indiceCompletezza', operatore: 'maggiore_uguale', valore: 70 },
          ],
        },
        azioni: [{ tipo: 'imposta_priorita_commerciale', parametri: { priorita: 'ALTA' } }],
      },
    });
  }

  // ===================== Identity & Security (Incremento 5) =====================

  // Ruolo di sistema "Proprietario": accesso completo a tutti i moduli.
  // RBAC come dati (Principio 5): questo è un seed di comodo, non un privilegio
  // hard-coded - il Ruolo può essere modificato/duplicato dal pannello.
  let ruoloProprietario = (
    await prisma.ruolo.findMany({ where: { tenantId, nome: 'Proprietario' } })
  )[0];
  if (!ruoloProprietario) {
    ruoloProprietario = await prisma.ruolo.create({
      data: {
        tenantId,
        nome: 'Proprietario',
        descrizione: 'Accesso completo',
        templateSistema: true,
      },
    });
  }
  // Sincronizza SEMPRE i permessi del catalogo (non solo alla prima creazione):
  // un modulo aggiunto in un incremento successivo (es. "kpi" qui) deve
  // propagarsi anche su un Tenant già seminato in precedenza, senza duplicare
  // i permessi già assegnati.
  const permessiAggiunti = await sincronizzaPermessiCatalogo(ruoloProprietario.id);
  if (permessiAggiunti > 0) {
    console.log(`Sincronizzati ${permessiAggiunti} nuovi permessi sul Ruolo "Proprietario".`);
  }

  // Utente amministratore iniziale, con Membership attiva verso Ramirez Atelier.
  const emailAdmin = 'titolare@ramirezatelier.it';
  let utenteAdmin = await prisma.utente.findUnique({ where: { email: emailAdmin } });
  if (!utenteAdmin) {
    utenteAdmin = await prisma.utente.create({
      data: {
        email: emailAdmin,
        nome: 'Marco Ramirez',
        passwordHash: await calcolaHashPassword('CambiamiSubito123'),
      },
    });
  }

  const membershipEsistente = (
    await prisma.membership.findMany({ where: { utenteId: utenteAdmin.id, tenantId } })
  )[0];
  if (!membershipEsistente) {
    const membership = await prisma.membership.create({
      data: { utenteId: utenteAdmin.id, tenantId, stato: 'ATTIVA' },
    });
    await prisma.membershipRuolo.create({
      data: { membershipId: membership.id, ruoloId: ruoloProprietario.id },
    });
  }

  console.log('Seed completato:', {
    cucina: cucina.chiave,
    armadio: armadio.chiave,
    tenant: tenant.slug,
    utenteAdmin: emailAdmin,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

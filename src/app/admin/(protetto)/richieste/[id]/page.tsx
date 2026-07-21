import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dettaglioRichiesta } from '@/server/services/richieste-service';
import { esecuzioniPerEntita } from '@/server/services/regole-service';
import { richiediContesto } from '@/server/identity/contesto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ControlloCambioStato } from '@/components/admin/ControlloCambioStato';
import { AzionePuntoDiPartenza } from '@/components/admin/AzionePuntoDiPartenza';
import { NoteInterne } from '@/components/admin/NoteInterne';
import { TimelineEventi } from '@/components/admin/TimelineEventi';
import { RiepilogoRichiesta } from '@/components/wizard/RiepilogoRichiesta';
import { TipoProgettoConfigurazioneSchema } from '@/lib/tipo-progetto-schema';
import { datiFormPiatti } from '@/lib/richiesta-fatti';
import { formattaDimensione } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ETICHETTA_TIPO_CLIENTE: Record<string, string> = {
  PRIVATO: 'Privato',
  ARCHITETTO: 'Architetto / Interior designer',
  IMPRESA: 'Impresa',
  STUDIO_TECNICO: 'Studio tecnico',
};

const ETICHETTA_ESITO_REGOLA: Record<string, string> = {
  CONDIZIONE_VERA: 'Applicata',
  CONDIZIONE_FALSA: 'Non applicabile',
  ERRORE: 'Errore',
};

export default async function DettaglioRichiestaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
  const { id } = await params;
  const [richiesta, esecuzioniRegole] = await Promise.all([
    dettaglioRichiesta(contesto.tenantId, id),
    esecuzioniPerEntita('richiesta_progetto', id),
  ]);
  if (!richiesta || !richiesta.tipoProgetto) notFound();

  const consultazioniCliente = (richiesta.eventi ?? []).filter(
    (e) => e.tipo === 'STATO_CONSULTATO_DAL_CLIENTE',
  ).length;

  const configurazione = TipoProgettoConfigurazioneSchema.parse(
    richiesta.tipoProgetto.configurazione,
  );
  const datiForm: Record<string, unknown> = {
    ...datiFormPiatti(richiesta),
    // Il campo è un "select" guidato da fonteOpzioni (fasce di budget dinamiche):
    // qui mostriamo direttamente il nome già risolto invece dell'id, così il
    // riepilogo generico (che cerca l'opzione per valore) mostra comunque il
    // testo corretto anche senza rieseguire la risoluzione dinamica in questa pagina.
    fasciaBudgetId: richiesta.fasciaBudget?.nome ?? null,
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/admin/richieste"
        className="mb-6 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Torna all&apos;elenco
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {richiesta.clienteId ? (
              <Link href={`/admin/clienti/${richiesta.clienteId}`} className="hover:underline">
                {richiesta.clienteNome ?? 'Senza nome'}
              </Link>
            ) : (
              (richiesta.clienteNome ?? 'Senza nome')
            )}
          </h1>
          <p className="text-muted-foreground">{richiesta.tipoProgetto.nome}</p>
        </div>
        <AzionePuntoDiPartenza richiestaId={richiesta.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Cliente e Contatti */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente e contatti</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="text-sm">{richiesta.clienteNome ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{richiesta.clienteEmail ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefono</p>
                <p className="text-sm">{richiesta.clienteTelefono ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo cliente</p>
                <p className="text-sm">
                  {ETICHETTA_TIPO_CLIENTE[richiesta.clienteTipo] ?? richiesta.clienteTipo}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tipologia progetto + Dati inseriti + Documenti/Foto (riuso del riepilogo dell'Incremento 2) */}
          <Card>
            <CardHeader>
              <CardTitle>Il progetto</CardTitle>
            </CardHeader>
            <CardContent>
              <RiepilogoRichiesta
                configurazione={configurazione}
                datiForm={datiForm}
                documenti={richiesta.documenti ?? []}
              />
              {richiesta.documenti && richiesta.documenti.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Dettaglio allegati
                  </p>
                  <ul className="space-y-1">
                    {richiesta.documenti.map((d) => (
                      <li key={d.id} className="flex items-center justify-between text-sm">
                        <span>{d.nomeFileOriginale}</span>
                        <span className="text-xs text-muted-foreground">
                          <Badge variant="outline">{d.categoria}</Badge> ·{' '}
                          {formattaDimensione(d.dimensioneByte)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Note interne */}
          <Card>
            <CardHeader>
              <CardTitle>Note interne</CardTitle>
            </CardHeader>
            <CardContent>
              <NoteInterne richiestaId={richiesta.id} commenti={richiesta.commenti ?? []} />
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Cronologia</CardTitle>
              {consultazioniCliente > 0 && (
                <p className="text-xs text-muted-foreground">
                  Il cliente ha consultato lo stato {consultazioniCliente}{' '}
                  {consultazioniCliente === 1 ? 'volta' : 'volte'} tramite il link diretto
                  (esperimento Portale Cliente).
                </p>
              )}
            </CardHeader>
            <CardContent>
              <TimelineEventi eventi={richiesta.eventi ?? []} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Stato / Workflow */}
          <Card>
            <CardHeader>
              <CardTitle>Stato</CardTitle>
            </CardHeader>
            <CardContent>
              <ControlloCambioStato richiestaId={richiesta.id} statoCorrente={richiesta.stato} />
            </CardContent>
          </Card>

          {/* Completezza e prezzo */}
          <Card>
            <CardHeader>
              <CardTitle>Completezza e prezzo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Livello di completezza</p>
                <p className="text-lg font-semibold">{richiesta.indiceCompletezza}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fascia di budget dichiarata</p>
                <p className="text-sm">{richiesta.fasciaBudget?.nome ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fascia di prezzo (preventivo)</p>
                <p className="text-sm">
                  {richiesta.fasciaPrezzoMin !== null && richiesta.fasciaPrezzoMax !== null
                    ? `${Number(richiesta.fasciaPrezzoMin).toLocaleString('it-IT')} – ${Number(richiesta.fasciaPrezzoMax).toLocaleString('it-IT')} €`
                    : 'Non ancora calcolata (motore di pricing non sviluppato, v. ADR-0003)'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ricevuta il</p>
                <p className="text-sm">{new Date(richiesta.createdAt).toLocaleString('it-IT')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Priorità commerciale - calcolata dal Rule Engine, mai assegnata manualmente in questo incremento */}
          <Card>
            <CardHeader>
              <CardTitle>Priorità commerciale</CardTitle>
            </CardHeader>
            <CardContent>
              {richiesta.prioritaCommerciale ? (
                <Badge variant={richiesta.prioritaCommerciale === 'ALTA' ? 'accent' : 'outline'}>
                  {richiesta.prioritaCommerciale}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Non ancora valutata (nessuna regola attiva ha prodotto un risultato per questa
                  richiesta).
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tracciabilità Rule Engine - Requisito esplicito: quale regola, quando, quale risultato */}
          <Card>
            <CardHeader>
              <CardTitle>Regole applicate</CardTitle>
            </CardHeader>
            <CardContent>
              {esecuzioniRegole.length > 0 ? (
                <ul className="space-y-3">
                  {esecuzioniRegole.map((e) => (
                    <li key={e.id} className="text-sm">
                      <p className="font-medium">{e.regola?.nome ?? e.regolaId}</p>
                      <p className="text-xs text-muted-foreground">
                        {ETICHETTA_ESITO_REGOLA[e.esito] ?? e.esito} ·{' '}
                        {new Date(e.eseguitaIl).toLocaleString('it-IT')}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nessuna regola ancora valutata su questa richiesta.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { DatiPreventivoPdf } from '@/server/services/preventivo-pdf-service';
import { testiPreventivo } from './testi-preventivo';
import { formattaEuro, formattaEuroPreciso, formattaData, dataScadenza } from './formattatori-preventivo';

const colori = { avorio: '#F7F3ED', carbone: '#2A2622', tortora: '#DCD3C4', rovere: '#8B6E4E', muted: '#6B6255' };
const stili = StyleSheet.create({
  pagina: { backgroundColor: '#FFFFFF', color: colori.carbone, padding: 48, fontSize: 10, fontFamily: 'Helvetica' },
  intestazione: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 16, borderBottom: `1pt solid ${colori.tortora}` },
  nomeAtelier: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 4 }, datiAtelier: { fontSize: 8, color: colori.muted, lineHeight: 1.5 },
  numeroBox: { alignItems: 'flex-end' }, numeroPreventivo: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: colori.rovere }, dataEmissione: { fontSize: 8, color: colori.muted, marginTop: 2 },
  sezione: { marginBottom: 20 }, titoloSezione: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: colori.rovere, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }, paragrafo: { lineHeight: 1.6, marginBottom: 8 },
  tabella: { borderTop: `1pt solid ${colori.tortora}` }, rigaTabella: { flexDirection: 'row', paddingVertical: 6, borderBottom: `1pt solid ${colori.tortora}` }, celleEtichetta: { width: '35%', color: colori.muted }, celleValore: { width: '65%', fontFamily: 'Helvetica-Bold' },
  boxImporto: { backgroundColor: colori.avorio, padding: 16, marginTop: 8, marginBottom: 20 }, rigaImporto: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }, etichettaImporto: { fontSize: 9, color: colori.muted }, valoreImportoSecondario: { fontSize: 9, fontFamily: 'Helvetica-Bold' }, separatoreImporto: { borderTop: `1pt solid ${colori.tortora}`, marginVertical: 5 }, etichettaTotale: { fontSize: 10, fontFamily: 'Helvetica-Bold' }, valoreTotale: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: colori.rovere }, notaImporto: { fontSize: 8, color: colori.muted, marginTop: 8 },
  chiusura: { marginTop: 24, paddingTop: 16, borderTop: `1pt solid ${colori.tortora}` }, contatti: { fontSize: 8, color: colori.muted, marginTop: 12, textAlign: 'center' },
});

export function PreventivoDocument({ dati }: { dati: DatiPreventivoPdf }) {
  const specifiche: { etichetta: string; valore: string }[] = [];
  if (dati.stile) specifiche.push({ etichetta: testiPreventivo.etichettaStile, valore: dati.stile });
  if (dati.materiale) specifiche.push({ etichetta: testiPreventivo.etichettaMateriale, valore: dati.materiale });
  if (dati.ferramenta) specifiche.push({ etichetta: testiPreventivo.etichettaFerramenta, valore: dati.ferramenta });
  if (dati.larghezzaCm && dati.profonditaCm) specifiche.push({ etichetta: testiPreventivo.etichettaDimensioni, valore: `${dati.larghezzaCm} x ${dati.profonditaCm} cm` });
  const prezzo = dati.preventivoCommerciale;

  return <Document><Page size="A4" style={stili.pagina}>
    <View style={stili.intestazione}>
      <View><Text style={stili.nomeAtelier}>{dati.atelier.nome}</Text><Text style={stili.datiAtelier}>{[dati.atelier.indirizzo, dati.atelier.partitaIva && testiPreventivo.partitaIva(dati.atelier.partitaIva)].filter(Boolean).join('\n')}</Text></View>
      <View style={stili.numeroBox}><Text style={stili.numeroPreventivo}>{testiPreventivo.numeroPreventivo(dati.numeroPreventivo)}</Text><Text style={stili.dataEmissione}>{formattaData(dati.dataEmissione)}</Text></View>
    </View>
    <View style={stili.sezione}><Text style={stili.titoloSezione}>{testiPreventivo.etichettaPer}</Text><Text style={stili.paragrafo}>{dati.cliente.nome}{dati.cliente.azienda ? ` — ${dati.cliente.azienda}` : ''}</Text></View>
    <View style={stili.sezione}><Text style={stili.paragrafo}>{testiPreventivo.introduzione(dati.tipoProgettoNome)}{dati.messaggioLibero ? testiPreventivo.messaggioCliente(dati.messaggioLibero) : ''}</Text></View>
    {specifiche.length > 0 && <View style={stili.sezione}><Text style={stili.titoloSezione}>{testiPreventivo.titoloScelte}</Text><View style={stili.tabella}>{specifiche.map((s) => <View key={s.etichetta} style={stili.rigaTabella}><Text style={stili.celleEtichetta}>{s.etichetta}</Text><Text style={stili.celleValore}>{s.valore}</Text></View>)}</View></View>}
    {prezzo ? <View style={stili.boxImporto}>
      <Text style={stili.titoloSezione}>{testiPreventivo.titoloRiepilogoEconomico}</Text>
      <View style={stili.rigaImporto}><Text style={stili.etichettaImporto}>{testiPreventivo.etichettaImponibile}</Text><Text style={stili.valoreImportoSecondario}>{formattaEuroPreciso(prezzo.imponibile)} €</Text></View>
      <View style={stili.rigaImporto}><Text style={stili.etichettaImporto}>{testiPreventivo.etichettaIva} {prezzo.ivaPercentuale}%</Text><Text style={stili.valoreImportoSecondario}>{formattaEuroPreciso(prezzo.iva)} €</Text></View>
      <View style={stili.separatoreImporto}/><View style={stili.rigaImporto}><Text style={stili.etichettaTotale}>{testiPreventivo.etichettaTotale}</Text><Text style={stili.valoreTotale}>{formattaEuroPreciso(prezzo.totale)} €</Text></View>
      <Text style={stili.notaImporto}>{testiPreventivo.notaPrezzo}</Text>
    </View> : dati.fasciaPrezzoMin !== null && dati.fasciaPrezzoMax !== null ? <View style={stili.boxImporto}><Text style={stili.etichettaImporto}>{testiPreventivo.etichettaStima}</Text><Text style={stili.valoreTotale}>{formattaEuro(dati.fasciaPrezzoMin)} - {formattaEuro(dati.fasciaPrezzoMax)} EUR</Text><Text style={stili.notaImporto}>{testiPreventivo.notaStima}</Text></View> : null}
    <View style={stili.sezione}><Text style={stili.paragrafo}>{testiPreventivo.validita(dataScadenza(dati.dataEmissione, dati.giorniValidita))}</Text></View>
    <View style={stili.chiusura}><Text style={stili.contatti}>{[dati.atelier.telefono, dati.atelier.emailPubblica].filter(Boolean).join('  ·  ')}</Text></View>
  </Page></Document>;
}

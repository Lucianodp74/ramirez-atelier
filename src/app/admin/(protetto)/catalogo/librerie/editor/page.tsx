import { richiediContesto } from '@/server/identity/contesto';
import { EditorComposizioneParete } from './EditorComposizioneParete';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Editor pareti attrezzate | Ramirez Atelier' };

export default async function EditorParetiPage() {
  await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
  return <EditorComposizioneParete />;
}

import { PreventivatoreModulare } from '@/components/preventivatore/PreventivatoreModulare';
import { PreventivatoreInspiration } from '@/components/preventivatore/PreventivatoreInspiration';

export const metadata = {
  title: 'Preventivatore | Ramirez Atelier',
  description: 'Configura il tuo arredo su misura e ottieni una stima indicativa.',
};

export default function PreventivatorePage() {
  return (
    <>
      <PreventivatoreInspiration />
      <PreventivatoreModulare />
    </>
  );
}

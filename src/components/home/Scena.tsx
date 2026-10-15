'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import { EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react';
import * as THREE from 'three';
import { ARREDI, BASE, FINITURE, PASSO, type IdFinitura } from './contenuti';

const PARETE_Z = -0.35;
const COLORE_PARETE = '#2b2622';
const SFONDO = '#1b1816';

type Props = {
  tappa: number | null;
  finiture: Record<number, IdFinitura>;
  led: boolean;
  esplorazioneLibera: boolean;
  movimentoRidotto: boolean;
  attiva: boolean;
  onPronta: () => void;
  /** Su schermo verticale: fascia libera sopra la scheda, in frazioni dell'altezza (0 = alto). */
  areaLibera: AreaLibera | null;
};

export type AreaLibera = { alto: number; basso: number };

// ingombro di ogni arredo (larghezza, altezza, profondità del centro in metri)
const MISURE: [number, number, number][] = [
  [1.9, 0.8, 0.1],
  [3.0, 2.75, -0.1],
  [4.4, 2.6, 1.15],
  [3.0, 2.7, 0.2],
  [3.25, 2.82, -0.25],
];
const FOV = 38;
const FOV_VERTICALE = 55;
// direzione di osservazione su schermo verticale: un po' da sinistra e dall'alto
const DIREZIONE_VERTICALE = new THREE.Vector3(-0.18, 0.16, 1).normalize();

/** Inquadratura di ogni arredo: posizione della camera e punto guardato (metri). */
function posa(tappa: number | null): [THREE.Vector3, THREE.Vector3] {
  if (tappa === null) {
    // vista d'insieme in diagonale: le cinque nicchie in prospettiva
    return [new THREE.Vector3(-2.4, 3.6, 10.5), new THREE.Vector3(2.1 * PASSO, 0.7, -0.6)];
  }
  const x = tappa * PASSO;
  // l'arredo sta a destra del centro: a sinistra c'è la scheda
  if (tappa === 0)
    return [new THREE.Vector3(x - 1.5, 1.3, 3.3), new THREE.Vector3(x - 0.45, 0.55, PARETE_Z)];
  // la cucina ha l'isola davanti: vista più ampia e più alta
  if (tappa === 2)
    return [new THREE.Vector3(x - 2.6, 2.1, 7.4), new THREE.Vector3(x - 0.8, 1.0, 0.6)];
  return [new THREE.Vector3(x - 2.0, 1.65, 6.0), new THREE.Vector3(x - 0.75, 1.3, PARETE_Z)];
}

/**
 * Su schermo verticale la scheda copre la parte bassa: l'arredo va centrato nella fascia libera
 * e intero in larghezza. Lo spostamento usa setViewOffset (proiezione decentrata, nessuna
 * deformazione); la distanza è quella che fa stare l'arredo nella fascia.
 */
function posaVerticale(
  tappa: number | null,
  larghezza: number,
  altezza: number,
  area: AreaLibera,
): [THREE.Vector3, THREE.Vector3] {
  const s = scalaVista(area);
  const pxPerTan = (s * altezza) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV_VERTICALE / 2)));
  const fascia = (area.basso - area.alto) * altezza;
  if (tappa === null) {
    // vista d'insieme lungo la fila delle nicchie, come un corridoio
    return [new THREE.Vector3(-3.2, 2.7, 6.2), new THREE.Vector3(2.2 * PASSO, 0.9, -0.4)];
  }
  const [w, h, zc] = MISURE[tappa];
  const d = Math.max((w * pxPerTan) / (0.86 * larghezza), (h * pxPerTan) / (0.84 * fascia));
  const punto = new THREE.Vector3(tappa * PASSO, h / 2, zc);
  return [punto.clone().addScaledVector(DIREZIONE_VERTICALE, d), punto];
}

/** Fattore della vista virtuale che porta il centro della proiezione nella fascia libera. */
function scalaVista(area: AreaLibera) {
  const cy = (area.alto + area.basso) / 2;
  return Math.max(1, 2 * (1 - cy), 2 * cy);
}

function Arredo({
  indice,
  finitura,
  led,
}: {
  indice: number;
  finitura: IdFinitura | null;
  led: boolean;
}) {
  const { scene } = useGLTF(ARREDI[indice].file, false, true);
  const [rovere, noce, rovereN, noceN] = useTexture([
    `${BASE}/texture/rovere.jpg`,
    `${BASE}/texture/noce.jpg`,
    `${BASE}/texture/rovere-normale.jpg`,
    `${BASE}/texture/noce-normale.jpg`,
  ]);
  const gruppo = useRef<THREE.Group>(null);

  // copia indipendente: finiture e luci di un arredo non toccano gli altri
  const copia = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (['finitura', 'schienale', 'led'].includes(m.name)) mesh.material = m.clone();
      // i metalli in una galleria buia riflettono poco: più luce d'ambiente solo per bronzo e acciaio
      if (m.name === 'bronzo' || m.name === 'acciaio') {
        const metallo = m.clone();
        metallo.envMapIntensity = 3.2;
        mesh.material = metallo;
      }
    });
    return c;
  }, [scene]);

  // allinea l'arredo: centrato sulla sua "stanza", a terra, addossato alla parete
  useLayoutEffect(() => {
    copia.position.set(0, 0, 0);
    copia.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(copia);
    const centro = box.getCenter(new THREE.Vector3());
    copia.position.set(indice * PASSO - centro.x, -box.min.y, PARETE_Z + 0.01 - box.min.z);
  }, [copia, indice]);

  useEffect(() => {
    for (const t of [rovere, noce, rovereN, noceN]) {
      t.flipY = false; // convenzione UV del glTF
      t.colorSpace = t === rovereN || t === noceN ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      t.needsUpdate = true;
    }
  }, [rovere, noce, rovereN, noceN]);

  useEffect(() => {
    copia.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (m.name === 'led') {
        m.emissive.set('#ffc98f');
        m.emissiveIntensity = led ? 3 : 0;
        return;
      }
      if (!finitura || (m.name !== 'finitura' && m.name !== 'schienale')) return;
      const f = FINITURE[finitura];
      const legno = Boolean(f.texture);
      m.map = legno ? (finitura === 'rovere' ? rovere : noce) : null;
      // rilievo della venatura solo sul legno; il laccato resta liscio
      m.normalMap = legno ? (finitura === 'rovere' ? rovereN : noceN) : null;
      m.normalScale.set(0.55, 0.55);
      m.color.set(f.colore);
      // fondi e interni più scuri: danno profondità ai vani
      if (m.name === 'schienale') m.color.multiplyScalar(legno ? 0.72 : 0.9);
      m.roughness = f.ruvidita;
      m.metalness = 0;
      m.needsUpdate = true;
    });
  }, [copia, finitura, led, rovere, noce, rovereN, noceN]);

  return <primitive ref={gruppo} object={copia} />;
}

function Stanza() {
  const listoni = useTexture(`${BASE}/texture/rovere.jpg`);
  useEffect(() => {
    listoni.colorSpace = THREE.SRGBColorSpace;
    listoni.wrapS = listoni.wrapT = THREE.RepeatWrapping;
    listoni.repeat.set(40 / 0.9, 20 / 2.4);
    listoni.rotation = Math.PI / 2;
    listoni.anisotropy = 8;
    listoni.needsUpdate = true;
  }, [listoni]);
  const pareti = [];
  // setti tra una "stanza" e l'altra: lo showroom come una sequenza di nicchie
  for (let i = 0; i < ARREDI.length - 1; i++) {
    pareti.push(
      <mesh
        key={i}
        position={[i * PASSO + PASSO / 2, 1.7, PARETE_Z + 0.55]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.14, 3.4, 1.1]} />
        <meshStandardMaterial color={COLORE_PARETE} roughness={0.92} />
      </mesh>,
    );
  }
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2 * PASSO, 0, 4]} receiveShadow>
        <planeGeometry args={[40, 20]} />
        <meshStandardMaterial map={listoni} color="#8a7a68" roughness={0.5} />
      </mesh>
      <mesh position={[2 * PASSO, 2.5, PARETE_Z - 0.01]} receiveShadow>
        <planeGeometry args={[40, 5]} />
        <meshStandardMaterial color={COLORE_PARETE} roughness={0.95} />
      </mesh>
      {pareti}
      {ARREDI.map((a, i) => (
        <Faretto key={a.file} x={i * PASSO} />
      ))}
    </group>
  );
}

function Faretto({ x }: { x: number }) {
  const bersaglio = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(x, 0.9, PARETE_Z);
    return o;
  }, [x]);
  return (
    <>
      <primitive object={bersaglio} />
      <spotLight
        position={[x - 1.7, 3.6, 2.4]}
        target={bersaglio}
        angle={0.6}
        penumbra={0.85}
        intensity={70}
        distance={9}
        decay={2}
        color="#ffd9b0"
      />
    </>
  );
}

function Regia({
  tappa,
  esplorazioneLibera,
  movimentoRidotto,
  areaLibera,
}: Pick<Props, 'tappa' | 'esplorazioneLibera' | 'movimentoRidotto' | 'areaLibera'>) {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  const size = useThree((st) => st.size);
  const guardato = useRef(posa(tappa)[1].clone());
  // centro attuale della proiezione (frazione d'altezza): segue la scheda con morbidezza
  const centro = useRef<number | null>(null);

  useEffect(() => {
    if (areaLibera) return;
    centro.current = null;
    camera.clearViewOffset();
    camera.fov = FOV;
    camera.updateProjectionMatrix();
  }, [areaLibera, camera]);
  const controlli = useRef<ComponentRef<typeof OrbitControls>>(null);

  useEffect(() => {
    if (esplorazioneLibera && controlli.current) {
      controlli.current.target.copy(guardato.current);
      controlli.current.update();
    }
  }, [esplorazioneLibera]);

  useFrame((_, delta) => {
    // smorzamento esponenziale: interrompibile, riparte dallo stato attuale
    const k = movimentoRidotto ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 2.4);
    if (areaLibera) {
      const meta = (areaLibera.alto + areaLibera.basso) / 2;
      const c = centro.current === null ? meta : centro.current + (meta - centro.current) * k;
      centro.current = c;
      // ricalcolata a ogni fotogramma: segue anche rotazioni e ridimensionamenti
      const s = scalaVista({ alto: c, basso: c });
      const { width: W, height: H } = size;
      camera.fov = FOV_VERTICALE;
      camera.setViewOffset(s * W, s * H, ((s - 1) * W) / 2, (s * H) / 2 - c * H, W, H);
    }
    if (esplorazioneLibera) return;
    const [pos, punto] = areaLibera
      ? posaVerticale(tappa, size.width, size.height, areaLibera)
      : posa(tappa);
    camera.position.lerp(pos, k);
    guardato.current.lerp(punto, k);
    camera.lookAt(guardato.current);
  });

  return esplorazioneLibera ? (
    <OrbitControls
      ref={controlli}
      makeDefault
      enablePan={false}
      minDistance={1.5}
      maxDistance={16}
      minPolarAngle={0.6}
      maxPolarAngle={1.52}
    />
  ) : null;
}

export default function Scena(props: Props) {
  const { onPronta } = props;
  const [pos] = posa(props.tappa);
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={props.attiva ? 'always' : 'never'}
      camera={{ position: pos.toArray(), fov: FOV, near: 0.1, far: 80 }}
      gl={{ antialias: true, toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1.0 }}
      onCreated={({ gl }) => {
        gl.domElement.setAttribute('role', 'img');
        gl.domElement.setAttribute(
          'aria-label',
          'Showroom 3D: madia, libreria, cucina, parete armadio e boiserie in una sequenza di nicchie',
        );
      }}
      style={{ background: SFONDO }}
    >
      {/* in verticale la camera sta più indietro: la nebbia parte più lontano */}
      <fog attach="fog" args={props.areaLibera ? [SFONDO, 18, 40] : [SFONDO, 12, 30]} />
      <hemisphereLight args={['#fff1e0', '#3a2f26', 0.12]} />
      <directionalLight
        position={[-7, 8, 7]}
        intensity={0.55}
        color="#ffe2c2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-6}
        shadow-camera-right={26}
        shadow-camera-top={8}
        shadow-camera-bottom={-6}
        shadow-camera-far={40}
      />
      {/* luce d'ambiente generata in locale: nessun file HDR scaricato da CDN */}
      <Environment resolution={256} frames={1} environmentIntensity={0.45}>
        <Lightformer
          form="rect"
          intensity={3}
          color="#ffe6cc"
          position={[-8, 4, 4]}
          scale={[6, 8, 1]}
          target={[0, 1, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#eef2ff"
          position={[10, 3, 6]}
          scale={[8, 4, 1]}
          target={[0, 1, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#fffaf2"
          position={[0, 8, 0]}
          rotation-x={Math.PI / 2}
          scale={[20, 6, 1]}
        />
      </Environment>
      <Suspense fallback={null}>
        <Stanza />
        {ARREDI.map((a, i) => (
          <Arredo
            key={a.file}
            indice={i}
            finitura={props.finiture[i] ?? a.finitura}
            led={props.led}
          />
        ))}
        <Pronta onPronta={onPronta} />
      </Suspense>
      <EffectComposer multisampling={4}>
        <N8AO
          aoRadius={0.45}
          distanceFalloff={0.8}
          intensity={2.4}
          color="#140f0b"
          halfRes
          quality="medium"
        />
        <ToneMapping mode={ToneMappingMode.AGX} />
      </EffectComposer>
      <Regia
        tappa={props.tappa}
        esplorazioneLibera={props.esplorazioneLibera}
        movimentoRidotto={props.movimentoRidotto}
        areaLibera={props.areaLibera}
      />
    </Canvas>
  );
}

function Pronta({ onPronta }: { onPronta: () => void }) {
  useEffect(() => onPronta(), [onPronta]);
  return null;
}

// modelli compressi con meshopt (decoder incluso in three-stdlib); Draco disattivato: userebbe un CDN esterno
for (const a of ARREDI) useGLTF.preload(a.file, false, true);

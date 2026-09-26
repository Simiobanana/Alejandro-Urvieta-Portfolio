import type { StoredProject } from '@/lib/content-types';
import { normalizeCategory } from '@/lib/project-presentation';

export type RealmId = 'programming' | 'art' | 'experiences';
export type RealmView = 'tree' | RealmId;
export type RealmStatus = 'loading' | 'ready' | 'fallback';
export const realmIds: RealmId[] = ['programming', 'art', 'experiences'];

export const realms = {
  programming: {
    number: '01', anchor: 'Realm_Programming', fallback: [-4.65, 4.05, .45], direction: [-3.3, 2.65, 7.7],
    name: { en: 'The observatory of ideas', es: 'El observatorio de las ideas' },
    short: { en: 'Observatory', es: 'Observatorio' },
    discipline: { en: 'Programming & tools', es: 'Programación y herramientas' },
    description: {
      en: 'Observe, experiment and build. Systems, tools and web development that make other experiences possible.',
      es: 'Observar, experimentar y construir. Sistemas, herramientas y desarrollo web que hacen posibles otras experiencias.',
    },
  },
  art: {
    number: '02', anchor: 'Realm_Art', fallback: [5.3, 5.05, .25], direction: [3.3, 2.8, 7.7],
    name: { en: 'The sanctuary of matter', es: 'El santuario de la materia' },
    short: { en: 'Sanctuary', es: 'Santuario' },
    discipline: { en: 'Technical art & VFX', es: 'Arte técnico y VFX' },
    description: {
      en: 'Light transforms matter. Visual effects, materials and environments where art finds expression in real time.',
      es: 'La luz transforma la materia. Efectos visuales, materiales y entornos donde el arte encuentra su expresión en tiempo real.',
    },
  },
  experiences: {
    number: '03', anchor: 'Realm_Experiences', fallback: [-.55, 2.55, 4.15], direction: [1.4, 2.45, 8.2],
    name: { en: 'The threshold of stories', es: 'El umbral de las historias' },
    short: { en: 'Threshold', es: 'Umbral' },
    discipline: { en: 'Games & experiences', es: 'Videojuegos y experiencias' },
    description: {
      en: 'Cross the threshold and discover what lies beyond. Mechanics, interaction and worlds that come alive through play.',
      es: 'Cruzar el umbral y descubrir qué hay al otro lado. Mecánicas, interacción y mundos que cobran sentido al jugarlos.',
    },
  },
} as const;

export function projectRealm(project: Pick<StoredProject,'category'|'title'|'titleEs'>): RealmId {
  const category = normalizeCategory(project);
  if (category === 'Pure Programming' || category === 'Web Programming') return 'programming';
  if (category === 'Pure Art') return 'art';
  const title = `${project.title} ${project.titleEs}`.toLowerCase();
  return /vfx|shader|material|escudo|shield|environment|entorno/.test(title) ? 'art' : 'experiences';
}

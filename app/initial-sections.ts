import type { SectionItem, StoredSection } from "@/lib/content-types";
import { jobs } from "./portfolio-data";

const item = (titleEn: string, titleEs: string, bodyEn = "", bodyEs = "", label = "", href = ""): SectionItem => ({ titleEn, titleEs, bodyEn, bodyEs, label, href });
const section = (s: Partial<Omit<StoredSection, "id">> & Pick<StoredSection, "kind" | "sortOrder">): Omit<StoredSection, "id"> => ({
  eyebrowEn: "", eyebrowEs: "", titleEn: "", titleEs: "", bodyEn: "", bodyEs: "", linkLabelEn: "", linkLabelEs: "", href: "", mediaUrl: "", mediaType: "", media: [], items: [], published: true, ...s,
});

/** Imported once into storage. Public rendering never merges these back into saved content. */
export const initialSections: Omit<StoredSection, "id">[] = [
  section({ kind: "hero", sortOrder: 0,
    eyebrowEn: "GAME SYSTEMS · CREATOR TOOLS · REAL-TIME VFX", eyebrowEs: "SISTEMAS DE JUEGO · CREATOR TOOLS · VFX EN TIEMPO REAL",
    titleEn: "I engineer playable ideas.", titleEs: "Convierto ideas en experiencias jugables.",
    bodyEn: "Game and software developer focused on Unity, C# and Unreal Engine 5.", bodyEs: "Desarrollador de videojuegos y software enfocado en Unity, C# y Unreal Engine 5.",
    linkLabelEn: "Explore selected work", linkLabelEs: "Explorar proyectos", href: "#work",
    items: [item("Querétaro, Mexico", "Querétaro, México"), item("English B2", "Inglés B2"), item("Available immediately", "Disponibilidad inmediata"), item("Start a conversation", "Iniciar una conversación", "", "", "action", "mailto:alejandroug2608@gmail.com")],
  }),
  section({ kind: "highlights", sortOrder: 10, eyebrowEn: "Highlights", eyebrowEs: "Cifras destacadas", items: [item("01", "01", "Published tool", "Herramienta publicada"), item("4+", "4+", "Years building", "Años creando"), item("08", "08", "Selected projects", "Proyectos seleccionados"), item("03", "03", "Creative disciplines", "Disciplinas creativas")] }),
  section({ kind: "work", sortOrder: 20, eyebrowEn: "SELECTED WORK", eyebrowEs: "PROYECTOS SELECCIONADOS", titleEn: "Code, art and the space between.", titleEs: "Código, arte y el espacio entre ambos.", bodyEn: "Production work and focused studies across gameplay, tools, graphics, VFX and interactive web.", bodyEs: "Trabajo profesional y estudios enfocados en gameplay, tools, gráficos, VFX y web interactiva." }),
  section({ kind: "profile", sortOrder: 30, eyebrowEn: "PROFILE", eyebrowEs: "PERFIL", titleEn: "A developer who thinks in systems and pictures.", titleEs: "Un desarrollador que piensa en sistemas e imágenes.",
    bodyEn: "I move comfortably between code and visual craft. That range helps me prototype clearly, communicate across disciplines and turn complex mechanics into experiences people can read and enjoy.", bodyEs: "Me muevo con comodidad entre el código y el trabajo visual. Ese rango me ayuda a prototipar con claridad, comunicarme entre disciplinas y convertir mecánicas complejas en experiencias legibles y disfrutables.",
    items: [item("Design for feedback", "Diseñar para el feedback", "Every interaction should explain what happened.", "Cada interacción debe explicar qué ocurrió.", "principle"), item("Build for iteration", "Construir para iterar", "Reusable systems make the next idea faster.", "Los sistemas reutilizables aceleran la siguiente idea.", "principle"), item("Protect the frame", "Cuidar el encuadre", "Visual impact only works when information stays clear.", "El impacto visual funciona cuando la información permanece clara.", "principle"), ...["UNITY", "UNREAL ENGINE 5", "C#", "C++", "NIAGARA", "BLENDER", "SQL", "AWS", "WEB 3D"].map(x => item(x, x, "", "", "skill"))],
  }),
  section({ kind: "experience", sortOrder: 40, eyebrowEn: "EXPERIENCE", eyebrowEs: "EXPERIENCIA", items: jobs.map(([date, company, role, detail]) => item(company, company, `${role.en}\n${detail.en}`, `${role.es}\n${detail.es}`, date)) }),
  section({ kind: "contact", sortOrder: 50, eyebrowEn: "NEXT QUEST", eyebrowEs: "SIGUIENTE MISIÓN", titleEn: "Have a difficult idea? Let’s make it playable.", titleEs: "¿Tienes una idea difícil? Hagamos que se pueda jugar.", bodyEn: "Open to game development, tools, software, technical art and interactive web opportunities.", bodyEs: "Disponible para oportunidades en videojuegos, tools, software, arte técnico y web interactiva.", linkLabelEn: "Email me", linkLabelEs: "Escríbeme", href: "mailto:alejandroug2608@gmail.com", items: [item("GitHub", "GitHub", "", "", "", "https://github.com/Simiobanana"), item("CV · EN", "CV · EN", "", "", "", "/CV_Alejandro_Tools_EN.pdf"), item("CV · ES", "CV · ES", "", "", "", "/CV_Alejandro_Software_ES.pdf")] }),
];

#!/usr/bin/env python3
"""
FASE 1 · Generador de biblioteca de prompts
Construye:
- docs/ASSET_REGEN/PROMPTS/01_*.md … 12_*.md (fichas por categoría)
- assets/prompts.json (archivo maestro legible por herramientas, con versión)

Usa como semilla los prompts ya existentes en docs/ART_REBUILD/batches/R*.json
y los suple con plantillas derivadas de 00_STYLE_TEMPLATE.md.
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
BATCHES_DIR = REPO / "docs" / "ART_REBUILD" / "batches"
MANIFEST_PATH = REPO / "assets" / "manifest.json"
PROMPTS_DIR = REPO / "docs" / "ASSET_REGEN" / "PROMPTS"
OUT_JSON = REPO / "assets" / "prompts.json"

# ---------- Cargar manifest ----------
with open(MANIFEST_PATH, encoding="utf-8") as f:
    manifest = json.load(f)
entries = manifest["entries"]

# ---------- Cargar prompts existentes de batches ----------
existing_prompts = {}
for bf in sorted(BATCHES_DIR.glob("R*.json")):
    if bf.name.endswith(".report.json"):
        continue
    try:
        with open(bf, encoding="utf-8") as f:
            b = json.load(f)
        for a in b.get("assets", []):
            aid = a.get("id")
            if aid and a.get("prompt"):
                existing_prompts[aid] = {
                    "prompt": a["prompt"],
                    "negative_prompt": a.get("negative_prompt",
                        "sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua"),
                    "reference": a.get("reference", ""),
                    "seed": a.get("seed", None),
                    "source_batch": b.get("batch", bf.stem),
                    "size": a.get("size"),
                    "entity": a.get("entity"),
                    "use": a.get("use"),
                }
    except Exception as e:
        print(f"WARN: no se pudo leer {bf.name}: {e}")

print(f"Prompts existentes cargados: {len(existing_prompts)}")

# ---------- Helpers para generar prompts por categoría ----------

CIRCLE_NAMES = {
    0: ("REFUGIO", "0e1525", "1e293b", "475569", "38bdf8", "facc15"),
    1: ("LUJURIA", "1b0826", "3b0f4c", "86198f", "ff2d95", "c084fc"),
    2: ("GULA",    "210e09", "431a0e", "9a3412", "f97316", "facc15"),
    3: ("AVARICIA","171206", "36280a", "854d0e", "facc15", "fef08a"),
    4: ("IRA",     "210709", "450a0a", "991b1b", "ef4444", "fb923c"),
    5: ("HEREJIA", "150826", "2e1065", "6b21a8", "a855f7", "c084fc"),
    6: ("VIOLENCIA","091813","102a1e", "166534", "4ade80", "86efac"),
    7: ("FRAUDE",  "081829", "0c2438", "155e75", "22d3ee", "ff2d7a"),
    8: ("TRAICION","081526", "0f1f3a", "1e3a5f", "7dd3fc", "f43f5e"),
    9: ("NUCLEO",  "120924", "241234", "3b2a4f", "e2e8f0", "ff2d7a"),
}

CIRCLE_MATERIALS = {
    0: "damero negro/blanco clásico de club, moqueta terciopelo carmesí VIP, nichos góticos de obsidiana, neón cian y magenta, oro como acento",
    1: "terciopelo magenta, columnas neón corona, espejos venecianos, cadena dorada, pista de baile reflectante, cristal ahumado oscuro",
    2: "terracota carmesí, mármol veteado, manteles burdeos, loza dorada, ganchos de carne, hierro forjado naranja",
    3: "pizarra negra con vetas de oro, bronce pulido, bóveda de acero, monedas doradas, mármol financiero, luz cálida",
    4: "piedra burdeos quebrada, forja roja, metal industrial al rojo, óxido, rejas, respiraderos",
    5: "obsidiana gótica, vidrieras violeta, altares, cirios, reclinatorios, arcos apuntados",
    6: "losas de ceniza industrial, planchas de acero remachado, tanques tóxicos verde, óxido, maquinaria pesada",
    7: "travertino azul turquesa, espejos diamante, cartas, fichas de casino, vidrio azul",
    8: "piedra abisal glaciar, hielo negro azulado, cadenas, cuchillas, luz fría azul",
    9: "obsidiana cósmica, blanco platino, venas magenta, fractura dimensional, monolito",
}

BASE_STYLE = "DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. "
BASE_END = " Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua."
NEGATIVE_DEFAULT = "texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado"


def circle_block(idx):
    if idx is None:
        return ""
    c = CIRCLE_NAMES[idx]
    mats = CIRCLE_MATERIALS.get(idx, "")
    return f"CÍRCULO {c[0]}. Paleta: fondo #{c[1]}, superficie #{c[2]}, alto #{c[3]}, neón #{c[4]} (#{c[5]} acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: {mats}. "


def floor_circle_index_from_id(aid):
    """Infer circle from floor ID."""
    m = re.search(r"floor_(\d+)", aid)
    if not m:
        return None
    n = int(m.group(1))
    mapping = {0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 10:0, 11:1}
    ci = mapping.get(n)
    if "hub_floor" in aid:
        ci = 0
    return ci


def wall_circle_index_from_id(aid):
    # Approximate mapping from wall id to circle
    if "gula_banquet" in aid: return 2
    if "neon_crown" in aid: return 1
    if "vip_window" in aid: return 7
    if "heavy_base" in aid: return 5
    if "tall_neon" in aid: return 9  # nucleo
    if "wrath_furnace" in aid: return 4
    if "ice_glacier" in aid: return 8
    if "gothic_niche" in aid: return 0
    if "pillar_obsidian" in aid: return 0
    if "core_monolith" in aid: return 9
    return None


def generate_prompt_for_entry(eid, entry):
    """Generate a prompt dict for an entry if no existing one."""
    cat = entry["category"]
    name = entry.get("name", eid)
    w, h = entry.get("w"), entry.get("h")

    # Floors
    if cat == "floors":
        ci = floor_circle_index_from_id(eid)
        cblock = circle_block(ci)
        # Specific floor descriptions
        floor_desc = {
            "floor_00_limbo_marble": "Mármol marfil/gris claro agrietado, vetas oscuras sutiles, juntas irregulares, sensación de vestíbulo de club antiguo desgastado",
            "floor_01_lust_dancefloor": "Pista de baile de discoteca con patrón de cuadrícula neón magenta y violeta sobre fondo oscuro reflectante, como de espejo o resina negra",
            "floor_02_gula_terracotta": "Mármol terracota carmesí con vetas crema y burdeos, juntas claras, sensación de banquete opulento",
            "floor_03_greed_slate_gold": "Pizarra negra profunda con vetas de oro y bronce pulido, reflejos dorados discontinuos",
            "floor_04_wrath_burgundy": "Piedra burdeos sangre quebrada, juntas negruzcas, óxido y quemado, sensación de forja",
            "floor_05_pride_obsidian_gold": "Obsidiana negra gótica con finos filetes dorados geométricos, juntas oscuras",
            "floor_06_violence_ash_slabs": "Losas de ceniza industrial gris verdoso con vetas óxido y verde tóxico, planchas remachadas",
            "floor_07_envy_travertine": "Travertino azul turquesa tallado en espiga/diagonal, pulido, reflejos fríos, como de casino",
            "floor_08_ice_abyssal": "Piedra abisal glacial azul negra con fracturas de hielo cian, superficie helada resquebrajada",
            "floor_09_core_cosmic_vein": "Obsidiana cósmica profunda con venas de luz magenta/platino que brillan sutilmente",
            "floor_10_hub_checker": "Damero clásico de baldosas blancas y negras de club, algo desgastadas, reflejo mate",
            "floor_11_vip_velvet": "Moqueta de terciopelo carmesí VIP, textura de pelo corto, lujosa, sin patrón geométrico",
            "hub_floor_main": "Damero del Refugio (HUB): baldosas cuadradas en negro y granate oscuro con filete magenta en las juntas, desgastadas por el uso",
        }
        desc = floor_desc.get(eid, f"Material de suelo: {name}")
        prompt = (BASE_STYLE + cblock
                  + "Perspectiva ortográfica cenital 2.5D, diamante de suelo 2:1. "
                  + f"Tile de 512x512 px repetible en dos ejes (seamless), opaco. Sin viñeta, sin objetos, sin bordes, sin escaleras ni marcos. "
                  + desc + ". "
                  + BASE_END)
        return {
            "prompt": prompt,
            "negative_prompt": NEGATIVE_DEFAULT + ", objetos sobre el suelo, bordes, marcos, costuras no repetibles, viñeta",
            "reference": "ART_REFERENCES/2026-11-TOTAL/ láminas de círculos; floor existente como base",
            "views": "tileable 512×512, una sola variante",
            "canvas": "512x512, opaco (sin alfa), pivot top-left",
        }

    # Walls
    if cat == "walls":
        ci = wall_circle_index_from_id(eid)
        cblock = circle_block(ci)
        wall_desc = {
            "wall_panel_gothic_niche": "Panel modular de muro con hornacina gótica de obsidiana, arco apuntado, nicho vacío con velas, zócalo y cornisa",
            "wall_panel_neon_crown": "Panel modular de muro con doble pilastra y corona de neón magenta en la parte superior, molduras art-déco",
            "wall_panel_vip_window": "Mirador VIP con ventanal de cristal ahumado y marco dorado-azul, cortinas pesadas a los lados, luz fría del exterior",
            "wall_pillar_obsidian": "Columna/pilastra de obsidiana negra pulida con capitel y basa sencillos, 192 px de ancho",
            "wall_panel_tall_neon": "Panel alto con veta magenta vertical luminiscente (no neón brillante, solo filo de luz en junta)",
            "wall_panel_heavy_base": "Muro pesado de piedra gótica con zócalo carmesí, aspecto macizo, juntas marcadas",
            "wall_gula_banquet": "Panel de banquete dorado-terracota con columnas cortas y bajorrelieve festivo, banderolas",
            "wall_ice_glacier": "Muro de forja y hielo con fracturas glaciares en la parte superior y óxido ígneo en la base",
            "wall_wrath_furnace": "Forja industrial con respiraderos de vapor, rejas de hierro y luces rojas intermitentes",
            "wall_core_monolith": "Monolito del Núcleo, piedra cósmica negra con venas magenta/blancas pulsantes, superficie fracturada",
        }
        desc = wall_desc.get(eid, f"Panel de muro: {name}")
        size = f"{w}x{h}"
        prompt = (BASE_STYLE + cblock
                  + "Perspectiva isométrica 2.5D, módulo de pared modular. "
                  + f"Lienzo {size} px, baseline inferior = línea de suelo. Canal alfa. Cornisa y zócalo coherentes con el círculo. "
                  + desc + ". "
                  + BASE_END)
        return {
            "prompt": prompt,
            "negative_prompt": NEGATIVE_DEFAULT + ", suelo sobre el muro, perspectiva equivocada",
            "reference": "ART_REFERENCES/2026-11-TOTAL/ láminas; muro existente como referencia",
            "views": "un solo panel por asset; el motor lo repite",
            "canvas": f"{w}x{h}, RGBA, pivot bottom-center",
        }

    # Environments (puertas, pad, portales)
    if cat == "environments":
        ci = None
        env_desc = {
            "door_gothic_closed": ("Puerta gótica doble cerrada, madera de ébano con tachuelas y arco apuntado, cerrada", 0),
            "door_gothic_open": ("Puerta gótica doble abierta hacia adentro, hojas de madera oscura visibles a los lados, oscuridad al fondo", 0),
            "door_arched_open": ("Puerta arqueada de piedra oscura abierta, arco de medio punto, hojas recogidas", 5),
            "door_stained_closed": ("Puerta de vidrieras roja/carmesí cerrada, rosetón y plomo, similar a la de una catedral", 4),
            "door_vip_crimson": ("Puerta VIP carmesí con cortina de terciopelo pesado, barra horizontal dorada, marco negro", 1),
            "portal_avaricia_gold": ("Portal/dintel dorado barroco de Avaricia, columnas salomónicas, oro envejecido, apertura oscura", 3),
            "portal_baroque_gold": ("Portal barroco dorado de doble hoja, cornisa ornamentada, escudo de zorro en la clave", 0),
            "threshold_descent_pad": ("Plataforma circular de descenso de neón cian, runas brillantes en el suelo, disco como de pista de baile, borde metálico", 0),
            "threshold_descent_crack": ("Grieta/pozo del Refugio en el suelo, ojo de pozo con venas magenta/cian pulsantes, borde irregular de obsidiana fracturada", 0),
        }
        desc_data = env_desc.get(eid, (f"{name}", 0))
        desc, ci = desc_data
        cblock = circle_block(ci)
        prompt = (BASE_STYLE + cblock
                  + "Perspectiva isométrica 2.5D, objeto sobre el suelo. "
                  + desc + ". "
                  + "Pivote bottom-center. RGBA. "
                  + BASE_END)
        return {
            "prompt": prompt,
            "negative_prompt": NEGATIVE_DEFAULT,
            "reference": "entorno existente",
            "views": "una sola vista; la lógica open/closed la decide el motor",
            "canvas": f"{w}x{h}, RGBA, pivot según entrada",
        }

    # Props
    if cat == "props":
        # Infer circle from name
        ci = None
        if any(s in eid for s in ("sofa", "fox", "bookshelf", "bar", "dj", "cooler", "neon_flower",
                                   "bollard", "speaker", "subwoofer", "candelabra", "mirror",
                                   "potted_plant", "chandelier", "weapon_rack", "astral_table",
                                   "tesla_orb")):
            ci = 0  # HUB
        elif "banquet" in eid: ci = 2
        elif "gilded_altar" in eid: ci = 5
        elif "gothic_statue" in eid: ci = 5
        elif "arcade" in eid or "vending" in eid: ci = 0
        elif "crate_club" in eid: ci = 0
        elif "armchair_vip" in eid or "bench_neon" in eid: ci = 1
        elif "barrel" in eid: ci = 4
        elif "neon_palm" in eid: ci = 1
        elif "sigil_poster" in eid: ci = 7
        elif "chest" in eid: ci = 3
        elif "arcane_pedestal" in eid: ci = 5
        if "hub_portal_frame" in eid:
            ci = 0
        cblock = circle_block(ci)
        # Specific prop descriptions
        prop_desc = {
            "prop_sofa_magenta": "Sofá de terciopelo magenta VIP isométrico de tres plazas, patas de metal oscuro, cojines brillantes",
            "prop_sofa_black": "Sofá de cuero negro de club de tres plazas, patas metálicas, estilo industrial-moderno",
            "prop_hub_fox_neon": "Neón mural del zorro coronado en la pared del Refugio, silueta de zorro con corona emitiendo luz magenta/cian, montado en la pared",
            "prop_bar_counter": "Mostrador de bar de ébano con superficie pulida, frente de bar con estantes de botellas al fondo, patas metálicas",
            "prop_dj_booth": "Cabina de DJ con mesa de mezclas, dos tocadiscos, pantalla de ecualizador y logotipo del club",
            "prop_bar_bottles": "Estantería de botellas tras la barra, licores de colores (no marcas), iluminación cian desde abajo",
            "prop_speaker_tower": "Torre de altavoces negra apilada, rejillas metálicas, LED cian en el borde superior",
            "prop_subwoofer_cyan": "Altavoz de subgraves con cono cian brillante, caja negra",
            "prop_candelabra_floor": "Candelabro de pie de hierro forjado negro con 5 velas encendidas y gotas de cera",
            "prop_bookshelf_hub": "Librería/estantería de madera oscura con libros de cuero y frascos, polvo y luz ámbar",
            "prop_cooler_neon": "Nevera/frigorífico iluminado de neón cian con puerta de cristal, bebidas dentro",
            "prop_neon_flower": "Flor neón decorativa en jarrón, pétalos de luz magenta",
            "prop_neon_palm": "Palmera neón decorativa de salón, hojas de plástico negro y luces neón",
            "prop_banquet_table": "Mesa de banquete larga con mantel burdeos, cubiertos dorados, platos y copas de cristal",
            "prop_mirror_baroque": "Espejo barroco de marco dorado en la pared, ornamentación y cristal envejecido",
            "prop_arcade_cabinet": "Máquina recreativa arcade con pantalla encendida, botones y joystick, gráficos cian/magenta en pantalla",
            "prop_vending_machine": "Máquina expendedora de elixires, chasis negro con listón neón, teclado y producto visible",
            "prop_crate_club": "Cajón de madera de transporte del club con letras grandes negras 'DD' y cinta de embalar",
            "prop_armchair_vip": "Butaca VIP individual de terciopelo magenta, respaldo capitoné, patas de latón",
            "prop_bench_neon": "Banco de neón corrido con asiento de cuero y tubo de neón cian bajo el asiento",
            "prop_chest_closed": "Cofre del tesoro cerrado de madera con refuerzos de hierro y brillo dorado en las cerraduras",
            "prop_chest_open": "Cofre abierto con luz dorada saliendo del interior, monedas y gemas",
            "prop_gilded_altar": "Altar dorado de Herejía con velas, mantel bordado, libro de rituales y copa",
            "prop_gothic_statue": "Estatua gótica de piedra de un santo/demonio encapuchado, base de pedestal",
            "prop_sigil_poster": "Póster/cartel con el sigilo del club y el emblema del zorro, pegado a la pared",
            "prop_arcane_pedestal": "Pedestal arcanos de piedra violeta con una esfera de luz flotando en la cima",
            "prop_potted_plant": "Planta de interior en maceta negra, hojas verdes con reflejos neón sutil",
            "prop_barrel_infernal": "Barril de hierro infernal con grifo y líquido carmesí dentro, marca de bar",
            "prop_bollard_pair": "Par de bolardos/postes separadores con terciopelo rojo entre ellos",
            "prop_chandelier_gold": "Candelabro de techo dorado de cristal de múltiples brazos, lágrimas de cristal, colgando",
            "prop_weapon_rack": "Rack gótico de armas en la pared, armas varias colgadas (escopetas, pistolas) sobre panel de cuero rojo",
            "prop_astral_table": "Mesa Astral con orrery mecánico y mapa de la Torre, globos celestes y engranajes de latón, luz violeta",
            "prop_tesla_orb": "Orbe de Tesla sobre columna, bobinas eléctricas con chispas cian y rayos estáticos",
            "hub_portal_frame": "Arco de portal gótico de obsidiana (9 arcos idénticos en el Refugio), columnas ornadas con un emblema circular central que se colorea según el círculo, base apoya en el suelo/muro del mezzanine",
        }
        desc = prop_desc.get(eid, f"Objeto: {name}")
        prompt = (BASE_STYLE + cblock
                  + "Perspectiva isométrica 2.5D, prop con apoyo en suelo. "
                  + "Pivote bottom-center. Silueta reconocible antes del detalle. "
                  + desc + ". "
                  + "RGBA. "
                  + BASE_END)
        return {
            "prompt": prompt,
            "negative_prompt": NEGATIVE_DEFAULT,
            "reference": "prop existente; lámina del círculo si aplica",
            "views": "una sola vista isométrica",
            "canvas": f"{w}x{h}, RGBA, pivot bottom-center",
        }

    # UI
    if cat == "ui":
        ui_desc = {
            "menu_main_backdrop": ("Ilustración principal de menú: la protagonista de espaldas al espectador mirando la ciudad roja infernal, horizonte de rascacielos góticos en rojo y negro, neón magenta del logo sobre la ciudad", False, "1280x720"),
            "menu_main_backdrop_a": ("Variante del fondo de menú con centro de bucle temporal, más oscura y abstracta", False, "1280x720"),
            "hud_portrait_protagonist": ("Retrato de perfil del protagonista (el Desafinado) mirando a la derecha, encuadre circular del HUD, fondo oscuro con borde neón magenta", True, "256x256"),
            "dialogue_portrait_dj": ("Retrato de DJ Virgilio, media cara sonriente con auriculares, gafas, cabello eléctrico azul, encuadre circular diálogo", True, "512x512"),
            "dialogue_portrait_bartender": ("Retrato del bartender del Refugio ('EL BARTENDER'), hombre con chaleco, pajarita y barra al fondo, media cara", True, "512x512"),
            "dialogue_portrait_armorer": ("Retrato de la armera ('LA ARMERA'), mujer con delantal de cuero, guantes y gafas de soldar, expresión amable", True, "512x512"),
            "map_infernal_tower": ("Mapa isométrico de la Torre Infernal con los 9 círculos en vertical, canales y nodos, estilo pergamino/neón", True, "640x640"),
            "hud_heart_full": ("Icono de corazón lleno de vida, chasis oscuro con brillo dorado/magenta, símbolo claro de vida", True, "64x64"),
            "hud_heart_empty": ("Icono de corazón vacío, contorno oscuro sin relleno, coherente con el corazón lleno", True, "64x64"),
            "hud_shield_badge": ("Insignia de escudo protector, forma de escudo heráldico con borde cian/azul, relleno oscuro", True, "64x64"),
            "hud_credit_coin": ("Moneda de crédito dorada con el emblema del zorro, reverso con valor, brillo de oro", True, "64x64"),
            "hud_skill_bomb": ("Icono de habilidad bomba, bomba de dibujo con mecha encendida, sin texto", True, "64x64"),
            "hud_skill_boost": ("Icono de habilidad impulso/velocidad, bota alada o flecha con estela cian", True, "64x64"),
            "hud_skill_dodge": ("Icono de habilidad esquiva/rodada, silueta de esquiva con estela", True, "64x64"),
            "ui_shop_emblem": ("Emblema de tienda 'TIENDA', cartel colgante con letras de neón dorado y marco", True, "512x256"),
            "ui_defeat_emblem": ("Emblema de derrota, placa rota en cruz sobre fondo oscuro, aura roja, sin texto 'derrota' (texto por UI)", True, "512x256"),
            "ui_victory_emblem": ("Emblema de victoria, corona de laurel dorada con brillo neón magenta, aura cálida", True, "512x256"),
        }
        data = ui_desc.get(eid)
        if data:
            desc, has_alpha, size = data
            alpha_str = "Canal alfa, fondo transparente." if has_alpha else "Opaco (fondo de pantalla)."
            prompt = (BASE_STYLE
                      + "Elemento de interfaz de HUD/menú de DEADBEAT DISCO. "
                      + f"Diseño sobre chasis oscuro #0a0c12, trazo nítido ≥ 2 px a tamaño final. "
                      + desc + ". "
                      + alpha_str + " Sin texto incrustado cuando el texto lo pinta la UI. "
                      + BASE_END)
            return {
                "prompt": prompt,
                "negative_prompt": NEGATIVE_DEFAULT + ", texto incrustado, bordes pixelados, miniatura ilegible",
                "reference": "HUD existente; REFERENCIA MAESTRA guía visual",
                "views": "una sola vista",
                "canvas": size,
            }

    # Logos
    if cat == "logos":
        logo_desc = {
            "logo_deadbeat_graffiti": ("Logotipo oficial de DEADBEAT DISCO en estilo graffiti callejero, letras gruesas inclinadas en magenta y blanco con contorno negro, chorros de pintura, sobre fondo oscuro", "1024x682"),
            "emblem_fox_crown": ("Emblema del zorro coronado de neón, silueta de cabeza de zorro estilizada de perfil con corona de tres puntas, contornos dorados, ojos cian brillantes, sobre fondo oscuro", "512x512"),
            "logo_deadbeat_cinematic": ("Logotipo cinematográfico de DEADBEAT DISCO en estilo neón brillante para apertura, letras brillantes blancas/magenta con halo de luz resplandeciente", "1024x512"),
        }
        data = logo_desc.get(eid)
        if data:
            desc, size = data
            prompt = (BASE_STYLE
                      + "Logotipo/emblema del juego DEADBEAT DISCO. "
                      + desc + ". "
                      + "Canal alfa, fondo transparente. Pivote center. "
                      + BASE_END)
            return {
                "prompt": prompt,
                "negative_prompt": NEGATIVE_DEFAULT + ", otros logos, texto incorrecto",
                "reference": f"asset existente {eid} como referencia de diseño",
                "views": "una sola variante",
                "canvas": size,
            }

    # Weapons (defer to template, note pixel-art status)
    if cat == "weapons":
        prompt = (BASE_STYLE
                  + f"Arma de fuego del juego ({name}). "
                  + "Dibujo técnico-painterly del arma vista de perfil mirando a la derecha, canón hacia la derecha, cargador/mango claros. Metal cepillado, detalles de óxido o neón según rareza. "
                  + "Perspectiva isométrica 2.5D, pivote center (centro del cañón/mango). RGBA. Sin sombra. "
                  + f"NOTA: las armas actuales son pixel-art 320x160 coherente con el juego; regenerar como ilustración painterly solo si se decide. "
                  + BASE_END)
        return {
            "prompt": prompt,
            "negative_prompt": NEGATIVE_DEFAULT + ", texto en el arma, marcas de armas reales, múltiples armas",
            "reference": f"weapon existente; diseño de {name}",
            "views": "perfil derecho, una sola variante",
            "canvas": f"{w}x{h}, RGBA, pivot center",
            "note": "Pixel-art actual es coherente; regeneración masiva no recomendada sin evaluación previa.",
        }

    # Pickups/relics
    if cat == "pickups":
        pickup_desc = {
            "pickup_heart_00": "Bote/objeto de curación en forma de corazón, brillo rojo-magenta, pequeño y reconocible",
            "pickup_ammo_00": "Caja de munición pequeña, latón con marcador de balas, color dorado/amarillo",
            "pickup_bomb_00": "Bomba/habilidad explosiva, esfera negra con mecha, indicador rojo",
            "pickup_boost_00": "Objeto de impulso/velocidad, rayo de energía cian, pequeño",
            "pickup_shield_00": "Escudo/bonificación defensiva, hexágono azul claro brillante",
            "pickup_damageup_00": "Power-up de daño, puño o proyectil hacia arriba rojo",
            "pickup_fireup_00": "Power-up de cadencia de fuego, llamas naranja/magenta",
            "pickup_speedup_00": "Power-up de velocidad, flechas paralelas cian",
            "pickup_turret_00": "Torreta de apoyo desplegable, pequeña base con cañón",
            "pickup_companion_00": "Dron compañero, esfera/pequeño altavoz flotante",
            "pickup_credits_00": "Moneda o fajo de créditos, dorado con emblema de zorro pequeño",
            "pickup_mutation_00": "Objeto de mutación/runa, aspecto orgánico/violeta brillante",
            "relic_coil": "Reliquia 'Coil' (bobina), engranaje de cobre enrollado con hilo de cobre y pulso magenta",
            "relic_echo": "Reliquia 'Echo' (eco), ondas sonoras visualizadas en esfera azul",
            "relic_lowpass": "Reliquia 'Lowpass', filtro de sonido visual, onda sinusoidal azulada",
            "relic_magnet": "Reliquia 'Magnet' (imán), herradura magnética roja/gris con campo visual",
            "relic_needle": "Reliquia 'Needle' (aguja), aguja hipodérmica con líquido verde",
            "relic_pact": "Reliquia 'Pact' (pacto), pergamino/sello de cera roja",
            "relic_prism": "Reliquia 'Prism' (prisma), cristal triangular que divide la luz en arcoíris neón",
            "relic_tempo": "Reliquia 'Tempo' (tempo), disco de vinilo con el logo del Zorro en el centro",
        }
        desc = pickup_desc.get(eid, f"Objeto recogible: {name}")
        color = "oro-violeta-cian" if eid.startswith("relic_") else "magenta/cian/rojo"
        prompt = (BASE_STYLE
                  + f"Objeto recogible/pickup del juego. {desc}. "
                  + f"Silueta clara y legible a escala pequeña, color {color}. Pivote center. RGBA. "
                  + "Ligero halo de luz del color del poder. Sin sombra. "
                  + BASE_END)
        return {
            "prompt": prompt,
            "negative_prompt": NEGATIVE_DEFAULT + ", demasiado detalle que desaparece a escala pequeña",
            "reference": f"pickup existente {eid}",
            "views": "una sola vista",
            "canvas": f"{w}x{h}, RGBA, pivot center",
        }

    # Effects
    if cat == "effects":
        effect_desc = {
            "vfx_muzzle_gold": ("Destello de boca de arma dorada, flash compacto y corto", "aditivo"),
            "vfx_muzzle_plasma": ("Destello de boca de arma de plasma, aro magenta/cian con corazón blanco", "aditivo"),
            "vfx_impact_spark": ("Chispa de impacto, cortas líneas de luz amarilla/blanca disparándose en abanico", "aditivo"),
            "vfx_impact_plasma": ("Impacto de plasma, aro cian/magenta expansivo con motas", "aditivo"),
            "vfx_explosion_inferno": ("Explosión infernal, hongo de fuego magenta/naranja con anillo de humo", "aditivo"),
            "vfx_shockwave_magenta": ("Onda de choque magenta, anillo expansivo delgado", "aditivo"),
            "vfx_fire_plume": ("Columna de fuego/pluma, llamas ascendentes naranja/magenta", "aditivo"),
            "vfx_soul_flame": ("Llama de alma, fuego azul/cian frío espectral que ondea", "aditivo"),
            "vfx_lightning_purple": ("Rayo violeta, zig-zag eléctrico ramificado con núcleo blanco", "aditivo"),
            "vfx_smoke_cloud": ("Nube de humo gris oscuro, expansión difusa, opacidad alta", "normal"),
            "effect_anamorphic_flare": ("Destello anamórfico de lente, línea horizontal de luz magenta/cian con estrellas", "aditivo"),
            "effect_dust_particles": ("Partículas de polvo flotantes, motas brillantes en el aire", "aditivo"),
            "proj_bullet": ("Proyectil bala, punto amarillo rápido", "aditivo"),
            "proj_slug": ("Proyectil slug pesado, bola de fuego naranja con estela", "aditivo"),
            "proj_heavy": ("Proyectil pesado, proyectil grande rojo/amarillo", "aditivo"),
            "proj_pellet": ("Perdigones de escopeta, múltiples puntos naranja", "aditivo"),
            "proj_cryo": ("Proyectil criogénico, dardo azul cian con estela de escarcha", "aditivo"),
            "proj_plasma": ("Proyectil de plasma, bola de plasma magenta/cian pulsante", "aditivo"),
            "proj_ricochet": ("Proyectil rebotador, bola amarilla/verde que rebota", "aditivo"),
            "proj_lane": ("Disparo en línea/riel, rayo láser recto delgado", "aditivo"),
            "proj_flame": ("Proyectil de fuego, llama disparada como chorro", "aditivo"),
            "proj_rail": ("Disparo de riel/railgun, rayo largo recto cian muy brillante", "aditivo"),
            "proj_homing": ("Proyectil teledirigido, misil pequeño que busca", "aditivo"),
        }
        edata = effect_desc.get(eid)
        if edata:
            desc, mode = edata
        else:
            desc, mode = f"Efecto visual: {name}", "aditivo"
        prompt = (BASE_STYLE
                  + f"Efecto visual VFX para el juego. {desc}. "
                  + "Sprite centrado, borde fundido, sin contorno opaco a menos que sea una chispa nítida. "
                  + f"Modo de mezcla: {mode}. NO debe tapar sprites de amenazas. "
                  + "Brevedad: el efecto dura fracciones de segundo. "
                  + BASE_END)
        return {
            "prompt": prompt,
            "negative_prompt": NEGATIVE_DEFAULT + ", opaco sólido, contornos duros, texto, objeto solido",
            "reference": f"efecto existente {eid}",
            "views": "una sola vista (la animación la hace el motor por escala/opacidad)",
            "canvas": f"{w}x{h}, RGBA aditivo",
        }

    # Bosses and enemies - use existing prompts or generate from templates
    if cat == "enemies":
        family = eid.replace("enemy_", "").rsplit("_", 1)[0]  # e.g. enemy_security_walk -> security
        state = eid.rsplit("_", 1)[1]  # walk, windup, attack, death
        state_pose = {
            "walk": "caminando hacia la derecha, pose de reposo/avance con los brazos al costado",
            "windup": "en pose de aviso previo al ataque, preparándose, cuerpo echado hacia atrás, postura de carga",
            "attack": "atacando, extremidad extendida hacia adelante, pose ofensiva clara",
            "death": "muriendo/caído de espaldas en el suelo, cuerpo desplomado, sin movimiento",
        }
        enemy_visuals = {
            "security": "portero/gorila de seguridad del club, gafas oscuras, uniforme negro, auriculares, porra eléctrica, reflectantes",
            "dancer": "bailarina/o espectral del club, vestimenta ligera de neón y tul, movimiento fluido",
            "fanatic": "fanático enloquecido con camiseta desgarrada del club, rostro desencajado, pose de carga",
            "chef": "chef infernal corpulento con delantal manchado y gorro de cocinero deformado",
            "drone": "dron/altavoz flotante con rejilla de altavoz como cara y cables",
            "elite": "versión élite del enemigo base con cresta/emblema élite, armadura pesada y energía fría",
        }
        ev = enemy_visuals.get(family, f"enemigo {family} del club")
        ci_map = {"security": 0, "dancer": 1, "fanatic": 4, "chef": 2, "drone": 7, "elite": 9}
        ci = ci_map.get(family)
        cblock = circle_block(ci)
        pose = state_pose.get(state, "de pie")
        prompt = (BASE_STYLE + cblock
                  + f"Enemigo del juego, familia '{family}': {ev}. "
                  + f"POSE: {pose}. Figura completa, de perfil mirando a la derecha. "
                  + "Pivote bottom-center, pies en el ~90% del PNG. Silueta reconocible antes del detalle. "
                  + "Sin halo en el sprite (lo pinta el motor). RGBA. "
                  + BASE_END)
        return {
            "prompt": prompt,
            "negative_prompt": NEGATIVE_DEFAULT + ", varias cabezas, sombra del sprite",
            "reference": f"batch R02_ENEMIGOS; {family} {state} existente",
            "views": f"4 estados por familia: walk/windup/attack/death. Este = {state}",
            "canvas": f"{w}x{h}, RGBA, pivot bottom-center",
            "anchors": "foot=punto de apoyo (centro de los pies), unit=altura de referencia de la familia (usar ENEMY_BASE)",
        }

    if cat == "bosses":
        # Extract boss slug
        m = re.match(r"boss_(\d+)_([a-z]+)_(idle|attack|hit|death)", eid)
        if m:
            num = int(m.group(1))
            state = m.group(3)
            boss_data = {
                0: ("DJ DOOM / Andén (Limbo)", "DJ esquelético en andén, gabán negro, auriculares de vinilo, asta de controlador, neón cian"),
                1: ("MAGNETA (Lujuria)", "reina/dominatriz magenta con látigo de cuentas de neón y corona de cables, halo de altavoces"),
                2: ("BUFE (Gula)", "entidad voraz con boca en el vientre, delantal y cubiertos gigantes"),
                3: ("CAJERO (Avaricia)", "cajero/banquero dorado con máscara, capa de monedas"),
                4: ("POGO (Ira)", "figura sobre pogo de altavoz rebotando, puño en alto"),
                5: ("OFICIANTE (Herejía)", "obispo hereje con mitra de neón violeta y báculo de discoteca"),
                6: ("MATARIFE (Violencia)", "carnicero industrial gigante con sierra de discos"),
                7: ("IMITADOR (Fraude)", "crupier enmascarado con múltiples rostros/naipes"),
                8: ("TRAIDOR (Traición)", "caballero de hielo negro con espada doble"),
                9: ("NÚCLEO", "esfera ocular cósmica fracturada con órbitas de luz blanca"),
                10: ("ARQUITECTO (secreto)", "mimo blanco con casco de obra y planos flotantes"),
            }
            name_visual, desc = boss_data.get(num, (f"boss {num}", "jefe del club"))
            ci = num  # circle index matches boss number (0-9); boss_10 is secret, core-adjacent
            if num == 10:
                ci = 9
            cblock = circle_block(ci)
            state_pose = {
                "idle": "en reposo, pose imponente, frente al jugador mirando a la derecha",
                "attack": "en pleno ataque, pose ofensiva, extremidad/arma extendida hacia el jugador",
                "hit": "recibiendo impacto, encogido o retrocediendo, destello de golpe",
                "death": "muriendo/derrotado, cuerpo desplomándose o fragmentándose",
            }
            pose = state_pose.get(state, "de pie")
            prompt = (BASE_STYLE + cblock
                      + f"JEFE '{name_visual}': {desc}. "
                      + f"POSE: {pose}. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. "
                      + "Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. "
                      + "Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA. "
                      + BASE_END)
            return {
                "prompt": prompt,
                "negative_prompt": NEGATIVE_DEFAULT + ", humano genérico, pocas extremidades, texto",
                "reference": f"batch R03_JEFES; boss {num} {state} existente; lámina del círculo",
                "views": f"4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = {state}",
                "canvas": f"{w}x{h}, RGBA, pivot bottom-center",
                "anchors": "foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)",
            }

    if cat == "characters":
        # Player/combat sprites or NPCs
        if eid.startswith("player_") or eid.startswith("hero_"):
            return {
                "prompt": "(ver batch R01_PROTAGONISTA y lámina maestra) " + BASE_STYLE + "Protagonista con el diseño maestro aprobado (consultar ficha y lámina antes de generar).",
                "negative_prompt": NEGATIVE_DEFAULT,
                "reference": "assets/cinematics/restart/character_master/protagonist_master_approved.png; batch R01/R05/R05B",
                "views": "múltiples poses (idle/walk/shoot/aim/roll/hurt/death/boost/fire)",
                "canvas": f"{w}x{h}, RGBA, pivot bottom-center",
                "note": "NO regenerar sin aprobación explícita (el IDLE 07B está cerrado; las animaciones WALK/SHOOT están pendientes de aprobación).",
            }
        else:
            return {
                "prompt": BASE_STYLE + f"Personaje NPC: {name}. Seguir la dirección de NPC de club (bartender, armera, DJ, compañero dron) manteniendo coherencia de trazo y luz con el protagonista.",
                "negative_prompt": NEGATIVE_DEFAULT,
                "reference": f"personaje existente {eid}",
                "views": "una o pocas poses según uso en código",
                "canvas": f"{w}x{h}, RGBA",
            }

    if cat == "cinematics":
        if "cine_circle" in eid:
            return {
                "prompt": BASE_STYLE + f"Ilustración/miniatura del {name} para la interfaz de selección de círculo o transición. Composición rica con el color dominante del círculo y silueta arquitectónica representativa.",
                "negative_prompt": NEGATIVE_DEFAULT,
                "reference": f"existente {eid}",
                "views": "una vista",
                "canvas": f"{w}x{h}"
            }
        if "cine_intro_club_panorama" in eid:
            return {
                "prompt": BASE_STYLE + "Key art de la discoteca infernal: panorama ancho de la pista principal del club con catedral gótica, altavoces colosales, neón magenta y cian, columnas, público en silueta y el DJ al fondo. Composición 16:9.",
                "negative_prompt": NEGATIVE_DEFAULT,
                "reference": "existente; REF_01",
                "views": "una vista",
                "canvas": f"{w}x{h}",
            }
        if eid.startswith("cine_bg"):
            return {
                "prompt": BASE_STYLE + f"Capa de paralax de cinemática: {name}. Capa 16:9 con transparencia para composición multicapa. Profundidad y perspectiva, neón del club, arquitectura apropiada al plano. El fondo composite (sin _01_/_02_/_03_) es opaco 2560x1440; las capas son RGBA 1920x1080.",
                "negative_prompt": NEGATIVE_DEFAULT + ", protagonista en la capa (se compone por separado)",
                "reference": f"lote de capas de cinemática; R04; existente {eid}",
                "views": "01 cielo, 02 medio, 03 primer plano",
                "canvas": f"{w}x{h}",
                "note": "Las capas 02/03 actuales son byte-identical (bug); regenerar corrigiendo esto.",
            }
        # effects/overlays/logos in cinematics are handled by their respective categories, but some entries are in cinematics category
        return {
            "prompt": BASE_STYLE + f"Elemento de cinemática: {name}.",
            "negative_prompt": NEGATIVE_DEFAULT,
            "reference": f"existente {eid}",
            "views": "una vista",
            "canvas": f"{w}x{h}",
        }

    if cat == "overlays":
        return {
            "prompt": BASE_STYLE + f"Overlay cinematográfico: {name}. Viñeta/máscara superpuesta. Viñeta gótica: bordes oscuros con arcos apuntados sutiles, centro transparente, canal alfa.",
            "negative_prompt": NEGATIVE_DEFAULT,
            "reference": f"existente {eid}",
            "canvas": f"{w}x{h}",
        }

    # Fallback
    return {
        "prompt": BASE_STYLE + f"{name}.",
        "negative_prompt": NEGATIVE_DEFAULT,
        "reference": f"existente {eid}",
        "views": "pendiente de determinar",
        "canvas": f"{w}x{h}",
    }


# ---------- Construir el registro de prompts ----------

prompts_db = {
    "version": "1.0.0",
    "generated_at": datetime.utcnow().isoformat() + "Z",
    "contract": "docs/TOTAL_ART_REBUILD/03_ASSET_CONTRACT.md",
    "style_template": "docs/ASSET_REGEN/PROMPTS/00_STYLE_TEMPLATE.md",
    "base_style": BASE_STYLE,
    "base_negative": NEGATIVE_DEFAULT,
    "assets": {},
}

# Generar prompt para cada entry del manifest
for eid, entry in entries.items():
    if eid in existing_prompts:
        p = dict(existing_prompts[eid])
        p["source"] = "existing-batch"
    else:
        p = generate_prompt_for_entry(eid, entry)
        p["source"] = "generated-template-v1"
    p["id"] = eid
    p["category"] = entry["category"]
    p["name"] = entry.get("name", "")
    p["src"] = entry["src"]
    p["w"] = entry.get("w")
    p["h"] = entry.get("h")
    p["alpha"] = entry.get("alpha")
    p["pivot"] = entry.get("pivot")
    prompts_db["assets"][eid] = p

# Guardar JSON
OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(prompts_db, f, indent=2, ensure_ascii=False)

print(f"\nassets/prompts.json generado: {len(prompts_db['assets'])} assets, versión {prompts_db['version']}")

# ---------- Generar ficheros Markdown por categoría ----------

CATEGORY_FILES = [
    ("01_personajes_y_npcs.md", "Personajes, atuendos y NPCs",
     ["characters"],
     "Incluye el protagonista (diseño maestro), los 22 sprites del diseño anterior (en combate), NPCs del Refugio (DJ, bartender, armera), el dron compañero y los 8 atuendos. **Los sprites del protagonista NO se regeneran sin aprobación explícita del autor (el IDLE 07B está cerrado).**"),
    ("02_enemigos.md", "Enemigos",
     ["enemies"],
     "6 familias: security, dancer, fanatic, chef, drone, elite. Cada familia tiene 4 estados (walk/windup/attack/death) salvo el chef que tiene todos los estados ya generados en TR_W1-W6. Walk es la referencia de escala para todos los fotogramas de la familia."),
    ("03_jefes.md", "Jefes",
     ["bosses"],
     "11 jefes × 4 estados (idle/attack/hit/death), más el jefe secreto Arquitecto (solo idle/attack). Los jefes ya fueron regenerados en TR_W7–W12; las fichas recogen sus prompts para repetibilidad."),
    ("04_entornos_suelos.md", "Suelos, muros y entornos",
     ["floors", "walls", "environments"],
     "13 suelos (tile 512×512 seamless), 10 paneles/pilares de muro, 9 entornos (puertas, portales, pad de descenso, grieta). Los suelos y muros ya fueron regenerados en TR_T01-TR_W1; se documentan aquí para futuras regeneraciones."),
    ("05_props_pickups.md", "Props y pickups",
     ["props", "pickups"],
     "34 props (decoración/interacción) y 20 pickups/reliquias. Los props del Refugio ya se colocaron en TR_W15–W20."),
    ("06_armas_efectos.md", "Armas y efectos",
     ["weapons", "effects"],
     "16 armas y 22 proyectiles/VFX. **Los sprites de armas actuales son pixel-art 320×160 coherentes** con el juego; la regeneración masiva a painterly no se recomienda sin evaluación previa."),
    ("07_interfaz_logos.md", "Interfaz y logos",
     ["ui", "logos", "overlays"],
     "17 UI (retratos, emblemas, iconos, backdrop de menú), 2 logos, 1 overlay. El logo graffiti y el emblema del zorro están cerrados (A — conservar)."),
    ("08_cinematicas.md", "Cinemáticas",
     ["cinematics"],
     "Fondos key art, capas de paralax 2.5D, sprites de héroe para cinemática, efectos y overlays cinematográficos. Incluye las 6 escenas de fondo (bg01–bg06) con sus 3 capas cada una, 11 escenas de círculo, el key art de intro y el logo cinemático."),
]

# Count source types for summary
src_counts = {"existing-batch": 0, "generated-template-v1": 0}
for p in prompts_db["assets"].values():
    src_counts[p["source"]] = src_counts.get(p["source"], 0) + 1

index_md = [
    "# FASE 1 · Biblioteca de prompts\n",
    f"**Versión:** {prompts_db['version']} · **Generado:** {prompts_db['generated_at']}\n",
    "## Resumen\n",
    f"- Total de assets documentados: **{len(prompts_db['assets'])}** (coincide con `assets/manifest.json`)",
    f"- Prompts existentes (de batches R01/R02/R03/R05/R05B): **{src_counts.get('existing-batch',0)}**",
    f"- Prompts generados desde plantilla v1: **{src_counts.get('generated-template-v1',0)}**",
    f"- Archivo maestro legible por herramientas: [`assets/prompts.json`](../../assets/prompts.json) (versión {prompts_db['version']})",
    "",
    "## Estructura\n",
    "| Archivo | Categorías | Nº assets |",
    "|---|---|---|",
]

total_in_cats = 0
for fname, title, cats, note in CATEGORY_FILES:
    items = [p for p in prompts_db["assets"].values() if p["category"] in cats]
    total_in_cats += len(items)
    index_md.append(f"| [`{fname}`]({fname}) | {title} | {len(items)} |")

index_md.append(f"\n> Los bloques de estilo reutilizables y la paleta por círculo están en [`00_STYLE_TEMPLATE.md`](00_STYLE_TEMPLATE.md).")
index_md.append("")
index_md.append("## Convenciones de ficha\n")
index_md.append("Cada asset tiene:")
index_md.append("- **ID manifest**, **nombre**, **función en el juego** (sistema/runtime que lo consume)")
index_md.append("- **Dimensiones** y **pivote** exactos (según contrato de 03_ASSET_CONTRACT.md)")
index_md.append("- **Vistas necesarias**: estados/cardinales (walk/windup/attack/death; intacto/roto; open/closed; etc.)")
index_md.append("- **Paleta/círculo** al que pertenece (si aplica)")
index_md.append("- **Reglas de silueta y legibilidad** específicas")
index_md.append("- **Fondo**: verde croma #00ff00 (se elimina en postproceso) o transparente")
index_md.append("- **Prompt positivo**, **prompt negativo** y **referencias/semilla**")
index_md.append("")

with open(PROMPTS_DIR / "README.md", "w", encoding="utf-8") as f:
    f.write("\n".join(index_md))

print(f"Índice escrito: {PROMPTS_DIR / 'README.md'}")


def write_category_file(fname, title, cats, note):
    items = sorted([p for p in prompts_db["assets"].values() if p["category"] in cats],
                   key=lambda x: (x["category"], x["id"]))
    lines = [f"# {title}", ""]
    lines.append(f"> {note}")
    lines.append("")
    lines.append(f"**Nº de assets en esta categoría:** {len(items)}")
    lines.append("")

    # Group by subcategory or circle where possible
    current_cat = None
    for p in items:
        if p["category"] != current_cat:
            current_cat = p["category"]
            lines.append(f"## {current_cat}")
            lines.append("")

        lines.append(f"### `{p['id']}`")
        lines.append("")
        lines.append(f"- **Nombre:** {p.get('name','')}")
        lines.append(f"- **Ruta:** `{p.get('src','')}`")
        lines.append(f"- **Tamaño lienzo:** {p.get('w')}×{p.get('h')} px")
        lines.append(f"- **Pivote:** `{p.get('pivot','')}`")
        lines.append(f"- **Canal alfa:** {p.get('alpha')}")
        if p.get("size"):
            lines.append(f"- **Tamaño maestro:** {p['size']}")
        if p.get("use"):
            lines.append(f"- **Uso en el juego:** {p['use']}")
        if p.get("views"):
            lines.append(f"- **Vistas necesarias:** {p['views']}")
        if p.get("anchors"):
            lines.append(f"- **Anclas:** {p['anchors']}")
        if p.get("entity"):
            lines.append(f"- **Entidad:** {p['entity']}")
        if p.get("note"):
            lines.append(f"- ⚠ **Nota:** {p['note']}")
        if p.get("reference"):
            lines.append(f"- **Referencia:** {p['reference']}")
        lines.append(f"- **Fuente prompt:** `{p.get('source','')}`")
        lines.append("")
        lines.append("**Prompt positivo:**")
        lines.append("```text")
        lines.append(p["prompt"])
        lines.append("```")
        lines.append("")
        lines.append("**Prompt negativo:**")
        lines.append("```text")
        lines.append(p.get("negative_prompt", NEGATIVE_DEFAULT))
        lines.append("```")
        lines.append("")
        lines.append("---")
        lines.append("")

    path = PROMPTS_DIR / fname
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"  {fname}: {len(items)} assets")


for fname, title, cats, note in CATEGORY_FILES:
    write_category_file(fname, title, cats, note)

print("\n=== FASE 1 COMPLETADA ===")

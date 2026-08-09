#!/usr/bin/env python3
"""Build the constraint_help catalog in translations.json.

Only constraints whose meaning is not readable off the label get an entry.
"Starts with M" needs no help; "Medical drama setting" and "Top 5 largest by
area" do. Anything missing from this catalog draws no help affordance at all,
which keeps the "?" meaningful when it does appear.

Covers both the built-in pool (js/puzzle.js predicates) and the approved
pop-culture pool (js/constraints-approved.js).
"""
import json, re, subprocess, sys, unicodedata

PATH = 'data/translations.json'
LANGS = ('en', 'fr', 'es')

# id: (en, fr, es)
HELP = {
# ── Built-in pool ────────────────────────────────────────────────────────
'region_west': (
  "The Census Bureau West region: the Mountain states plus the Pacific coast.",
  "La région Ouest au sens du recensement : les Rocheuses et la côte Pacifique.",
  "La región Oeste según el censo: los estados de las Montañas y la costa del Pacífico."),
'region_south': (
  "The Census Bureau South region, which runs from Delaware down to Texas.",
  "La région Sud au sens du recensement, du Delaware jusqu'au Texas.",
  "La región Sur según el censo, del Delaware hasta Texas."),
'region_midwest': (
  "The Census Bureau Midwest region: the Great Lakes states plus the Plains.",
  "La région Midwest au sens du recensement : les Grands Lacs et les Plaines.",
  "La región Medio Oeste según el censo: los Grandes Lagos y las Llanuras."),
'region_northeast': (
  "The Census Bureau Northeast region: New England plus the Mid-Atlantic.",
  "La région Nord-Est au sens du recensement : Nouvelle-Angleterre et Mid-Atlantic.",
  "La región Noreste según el censo: Nueva Inglaterra y el Atlántico Medio."),
'sub_new_england': (
  "The six states in the far northeast corner of the country.",
  "Les six États de l'extrême nord-est du pays.",
  "Los seis estados del extremo noreste del país."),
'sub_mid_atlantic': (
  "The band of states between New England and the South, on the middle Atlantic coast.",
  "La bande d'États entre la Nouvelle-Angleterre et le Sud, sur la côte atlantique centrale.",
  "La franja de estados entre Nueva Inglaterra y el Sur, en la costa atlántica media."),
'sub_deep_south': (
  "The historic cotton states of the far south, around the Gulf and the lower Mississippi.",
  "Les États cotonniers historiques du grand sud, autour du Golfe et du bas Mississippi.",
  "Los estados algodoneros históricos del sur profundo, junto al Golfo y el bajo Misisipi."),
'sub_plains': (
  "The open agricultural states west of the Mississippi and east of the Rockies.",
  "Les États agricoles ouverts entre le Mississippi et les Rocheuses.",
  "Los estados agrícolas abiertos entre el Misisipi y las Rocosas."),
'sub_mountain': (
  "The interior western states built around the Rocky Mountain chain.",
  "Les États de l'Ouest intérieur, organisés autour de la chaîne des Rocheuses.",
  "Los estados del oeste interior, en torno a la cadena de las Rocosas."),
'sub_pacific': (
  "The states with a Pacific Ocean shoreline.",
  "Les États bordés par l'océan Pacifique.",
  "Los estados con litoral en el océano Pacífico."),
'coast_great_lakes': (
  "Touches at least one of the five Great Lakes. Inland water counts here, ocean does not.",
  "Borde au moins un des cinq Grands Lacs. L'eau intérieure compte, pas l'océan.",
  "Toca al menos uno de los cinco Grandes Lagos. Cuenta el agua interior, no el océano."),
'landlocked': (
  "No ocean coastline and no Great Lakes shoreline.",
  "Ni façade océanique ni rivage sur les Grands Lacs.",
  "Sin costa oceánica ni orilla en los Grandes Lagos."),
'political_red': (
  "Leans Republican: it has backed the Republican nominee in recent presidential elections.",
  "Penche républicain : il a voté pour le candidat républicain aux dernières présidentielles.",
  "Se inclina republicano: ha votado al candidato republicano en las últimas presidenciales."),
'political_blue': (
  "Leans Democratic: it has backed the Democratic nominee in recent presidential elections.",
  "Penche démocrate : il a voté pour le candidat démocrate aux dernières présidentielles.",
  "Se inclina demócrata: ha votado al candidato demócrata en las últimas presidenciales."),
'political_swing': (
  "A battleground: it has gone to both parties across recent presidential elections.",
  "Un État pivot : il a basculé d'un camp à l'autre aux dernières présidentielles.",
  "Un estado bisagra: ha cambiado de partido en las últimas presidenciales."),
'original_13': (
  "One of the thirteen British colonies that declared independence in 1776.",
  "L'une des treize colonies britanniques qui ont déclaré l'indépendance en 1776.",
  "Una de las trece colonias británicas que declararon la independencia en 1776."),
'confederate': (
  "Seceded and joined the Confederacy during the Civil War.",
  "A fait sécession et rejoint la Confédération pendant la guerre de Sécession.",
  "Se separó y se unió a la Confederación durante la Guerra Civil."),
'on_mississippi': (
  "The Mississippi River runs along its border or straight through it.",
  "Le Mississippi longe sa frontière ou le traverse.",
  "El río Misisipi bordea el estado o lo atraviesa."),
'mt_rockies': (
  "Part of the Rocky Mountain chain lies inside the state.",
  "Une partie de la chaîne des Rocheuses se trouve sur son territoire.",
  "Parte de la cadena de las Rocosas se encuentra en el estado."),
'desert_state': (
  "Contains a major desert, such as the Mojave, Sonoran, Chihuahuan or Great Basin.",
  "Abrite un grand désert : Mojave, Sonora, Chihuahua ou Grand Bassin.",
  "Alberga un gran desierto: Mojave, Sonora, Chihuahua o Gran Cuenca."),
'four_corners': (
  "One of the four states that meet at a single point in the Southwest.",
  "L'un des quatre États qui se rejoignent en un seul point dans le Sud-Ouest.",
  "Uno de los cuatro estados que se juntan en un solo punto en el Suroeste."),
'great_plains': (
  "Sits on the flat grassland belt east of the Rockies.",
  "Repose sur la ceinture de prairies plates à l'est des Rocheuses.",
  "Se asienta en la franja de praderas llanas al este de las Rocosas."),
'bible_belt': (
  "Part of the southern region where evangelical Protestantism is culturally dominant.",
  "Zone du Sud où le protestantisme évangélique domine culturellement.",
  "Zona del Sur donde el protestantismo evangélico domina culturalmente."),
'rust_belt': (
  "Part of the old industrial heartland near the Great Lakes that lost its heavy manufacturing.",
  "Ancien coeur industriel près des Grands Lacs, vidé de son industrie lourde.",
  "Antiguo corazón industrial junto a los Grandes Lagos que perdió su industria pesada."),
'route_66': (
  "The original Route 66 crossed this state on its way from Chicago to Santa Monica.",
  "La Route 66 d'origine traversait cet État entre Chicago et Santa Monica.",
  "La Ruta 66 original atravesaba este estado entre Chicago y Santa Mónica."),
'has_million_city': (
  "At least one city inside the state has over a million residents.",
  "Au moins une ville de l'État dépasse le million d'habitants.",
  "Al menos una ciudad del estado supera el millón de habitantes."),
'largest_state': (
  "Ranked in the top 5 by land area. This is about size, not population.",
  "Dans le top 5 par superficie. Il s'agit de la taille, pas de la population.",
  "Entre los 5 mayores por superficie. Se trata del tamaño, no de la población."),
'smallest_state': (
  "Ranked in the bottom 5 by land area. This is about size, not population.",
  "Dans les 5 derniers par superficie. Il s'agit de la taille, pas de la population.",
  "Entre los 5 menores por superficie. Se trata del tamaño, no de la población."),
'has_nba': (
  "Home to at least one NBA franchise.",
  "Accueille au moins une franchise NBA.",
  "Alberga al menos una franquicia de la NBA."),
'sun_belt': (
  "The warm southern band running from the Southeast across to the Southwest.",
  "La bande chaude du sud, du Sud-Est jusqu'au Sud-Ouest.",
  "La franja cálida del sur, del Sureste hasta el Suroeste."),
'snow_belt': (
  "The northern states that take heavy winter and lake-effect snowfall.",
  "Les États du nord qui reçoivent de fortes chutes de neige hivernales.",
  "Los estados del norte que reciben fuertes nevadas invernales."),
'corn_belt': (
  "The Midwestern band where corn is the dominant crop.",
  "La bande du Midwest où le maïs est la culture dominante.",
  "La franja del Medio Oeste donde el maíz es el cultivo dominante."),
'wheat_belt': (
  "The Plains states where wheat is the dominant crop.",
  "Les États des Plaines où le blé est la culture dominante.",
  "Los estados de las Llanuras donde el trigo es el cultivo dominante."),
'cotton_belt': (
  "The southern band where cotton was historically the dominant crop.",
  "La bande du Sud où le coton fut historiquement la culture dominante.",
  "La franja del Sur donde el algodón fue históricamente el cultivo dominante."),
'tornado_alley': (
  "Part of the central corridor with the highest tornado frequency in the country.",
  "Couloir central du pays qui connaît la plus forte fréquence de tornades.",
  "Corredor central del país con la mayor frecuencia de tornados."),
'hurricane_zone': (
  "Exposed to Atlantic or Gulf hurricanes making landfall.",
  "Exposé aux ouragans de l'Atlantique ou du Golfe qui touchent terre.",
  "Expuesto a los huracanes del Atlántico o del Golfo que tocan tierra."),
'earthquake_zone': (
  "Sits on active fault lines, with a real earthquake risk.",
  "Situé sur des failles actives, avec un risque sismique réel.",
  "Situado sobre fallas activas, con un riesgo sísmico real."),
'has_volcano': (
  "Has at least one volcano classed as active.",
  "Compte au moins un volcan classé actif.",
  "Tiene al menos un volcán clasificado como activo."),
'has_glaciers': (
  "Still has glaciers today.",
  "Abrite encore des glaciers aujourd'hui.",
  "Todavía conserva glaciares hoy."),
'multi_timezone': (
  "The state is split across two time zones.",
  "L'État est coupé en deux fuseaux horaires.",
  "El estado está dividido en dos husos horarios."),
'statehood_pre_1800': (
  "Admitted to the Union before 1800. This is the date of statehood, not of settlement.",
  "Admis dans l'Union avant 1800. C'est la date d'entrée dans l'Union, pas de peuplement.",
  "Admitido en la Unión antes de 1800. Es la fecha de estadidad, no de poblamiento."),
'statehood_1900s': (
  "Admitted to the Union in the twentieth century, so one of the last to join.",
  "Admis dans l'Union au vingtième siècle, donc parmi les derniers arrivés.",
  "Admitido en la Unión en el siglo veinte, de los últimos en entrar."),
'name_native_origin': (
  "The state name comes from a Native American word.",
  "Le nom de l'État vient d'un mot amérindien.",
  "El nombre del estado viene de una palabra amerindia."),
'name_spanish_origin': (
  "The state name comes from Spanish.",
  "Le nom de l'État vient de l'espagnol.",
  "El nombre del estado viene del español."),
'name_royalty_origin': (
  "The state was named after a king, a queen or a member of a royal house.",
  "L'État a été nommé d'après un roi, une reine ou un membre d'une maison royale.",
  "El estado recibió el nombre de un rey, una reina o un miembro de una casa real."),
'borders_6_plus': (
  "Shares a land border with six or more other states.",
  "Partage une frontière terrestre avec six autres États ou plus.",
  "Comparte frontera terrestre con seis o más estados."),
'borders_few': (
  "Shares a land border with three other states or fewer.",
  "Partage une frontière terrestre avec trois États ou moins.",
  "Comparte frontera terrestre con tres estados o menos."),
'capital_named_after_president': (
  "The state capital is named after a US president.",
  "La capitale de l'État porte le nom d'un président américain.",
  "La capital del estado lleva el nombre de un presidente de EE. UU."),
'double_letter': (
  "The English name has the same letter twice in a row, as in Tennessee.",
  "Le nom anglais contient deux fois la même lettre de suite, comme dans Tennessee.",
  "El nombre en inglés tiene la misma letra dos veces seguidas, como en Tennessee."),
'starts_and_ends_vowel': (
  "The English name opens and closes on a vowel, as in Alabama.",
  "Le nom anglais commence et finit par une voyelle, comme dans Alabama.",
  "El nombre en inglés empieza y termina en vocal, como en Alabama."),

# ── Approved pop-culture pool ────────────────────────────────────────────
'pc_pro_team_animal_name': (
  "A major pro sports team based here is named after an animal.",
  "Une équipe pro majeure basée ici porte un nom d'animal.",
  "Un equipo profesional importante con sede aquí lleva nombre de animal."),
'pc_big12_school': (
  "At least one university here plays in the Big 12 athletic conference.",
  "Au moins une université d'ici joue dans la conférence sportive Big 12.",
  "Al menos una universidad de aquí juega en la conferencia deportiva Big 12."),
'pc_real_housewives_franchise': (
  "A city in this state has its own Real Housewives series.",
  "Une ville de cet État a sa propre série Real Housewives.",
  "Una ciudad de este estado tiene su propia serie Real Housewives."),
'pc_stephen_king_setting': (
  "At least one Stephen King novel takes place here.",
  "Au moins un roman de Stephen King s'y déroule.",
  "Al menos una novela de Stephen King transcurre aquí."),
'pc_marvel_mcu_us_setting': (
  "A Marvel Cinematic Universe film shot scenes in this state.",
  "Un film de l'univers Marvel y a tourné des scènes.",
  "Una película del universo Marvel rodó escenas en este estado."),
'pc_pixar_film_setting': (
  "A Pixar feature is set in this state.",
  "Un long métrage Pixar s'y déroule.",
  "Un largometraje de Pixar transcurre en este estado."),
'pc_tarantino_setting': (
  "A Quentin Tarantino film is set in this state.",
  "Un film de Quentin Tarantino s'y déroule.",
  "Una película de Quentin Tarantino transcurre en este estado."),
'pc_top10_engineering_uni': (
  "Home to a university ranked in the national top 10 for engineering.",
  "Abrite une université classée dans le top 10 national en ingénierie.",
  "Alberga una universidad entre las 10 mejores del país en ingeniería."),
'pc_top10_law_school': (
  "Home to a law school ranked in the national top 10.",
  "Abrite une faculté de droit classée dans le top 10 national.",
  "Alberga una facultad de derecho entre las 10 mejores del país."),
'pc_top10_med_school': (
  "Home to a medical school ranked in the national top 10.",
  "Abrite une faculté de médecine classée dans le top 10 national.",
  "Alberga una facultad de medicina entre las 10 mejores del país."),
'pc_top_business_school': (
  "Home to a business school ranked in the national top 10.",
  "Abrite une école de commerce classée dans le top 10 national.",
  "Alberga una escuela de negocios entre las 10 mejores del país."),
'pc_top_liberal_arts': (
  "Home to one of the country's top-ranked liberal arts colleges.",
  "Abrite l'un des meilleurs liberal arts colleges du pays.",
  "Alberga uno de los mejores liberal arts colleges del país."),
'pc_ivy_league_home': (
  "One of the eight Ivy League universities sits in this state.",
  "L'une des huit universités de l'Ivy League s'y trouve.",
  "Una de las ocho universidades de la Ivy League está en este estado."),
'pc_nasa_facility': (
  "Hosts a major NASA centre, such as a launch site or a research campus.",
  "Accueille un grand centre de la NASA : base de lancement ou campus de recherche.",
  "Alberga un gran centro de la NASA: base de lanzamiento o campus de investigación."),
'pc_major_cruise_port': (
  "Has a port that major cruise lines sail from.",
  "Dispose d'un port d'où partent les grandes compagnies de croisière.",
  "Tiene un puerto del que zarpan las grandes navieras de cruceros."),
'pc_iconic_cocktail': (
  "A well known cocktail is named after or closely tied to this state.",
  "Un cocktail connu porte son nom ou lui est étroitement associé.",
  "Un cóctel conocido lleva su nombre o está muy ligado a este estado."),
'pc_disaster_movie_set': (
  "A disaster movie is set in this state.",
  "Un film catastrophe s'y déroule.",
  "Una película de catástrofes transcurre en este estado."),
'pc_cop_show_setting': (
  "A well known police series is set in this state.",
  "Une série policière connue s'y déroule.",
  "Una serie policial conocida transcurre en este estado."),
'pc_medical_drama_set': (
  "A well known hospital series is set in this state.",
  "Une série hospitalière connue s'y déroule.",
  "Una serie de hospital conocida transcurre en este estado."),
'pc_long_river_state': (
  "One of the longest rivers in the country runs through or along the state.",
  "L'un des plus longs fleuves du pays le traverse ou le longe.",
  "Uno de los ríos más largos del país lo atraviesa o lo bordea."),
'pc_underground_subway': (
  "A city here runs a subway or metro system.",
  "Une ville d'ici exploite un métro.",
  "Una ciudad de aquí tiene metro."),
'pc_movie_spielberg': (
  "A Steven Spielberg film is set in this state.",
  "Un film de Steven Spielberg s'y déroule.",
  "Una película de Steven Spielberg transcurre en este estado."),
'pc_movie_scorsese': (
  "A Martin Scorsese film is set in this state.",
  "Un film de Martin Scorsese s'y déroule.",
  "Una película de Martin Scorsese transcurre en este estado."),
'pc_movie_anderson_wes': (
  "A Wes Anderson film is set in this state.",
  "Un film de Wes Anderson s'y déroule.",
  "Una película de Wes Anderson transcurre en este estado."),
'pc_movie_eastwood': (
  "A Clint Eastwood film is set in this state.",
  "Un film de Clint Eastwood s'y déroule.",
  "Una película de Clint Eastwood transcurre en este estado."),
'pc_movie_marvel_loc': (
  "A Marvel film shot scenes in this state.",
  "Un film Marvel y a tourné des scènes.",
  "Una película de Marvel rodó escenas en este estado."),
'pc_movie_pixar_inspo': (
  "A Pixar film drew its setting from this state.",
  "Un film Pixar s'est inspiré de cet État pour son décor.",
  "Una película de Pixar se inspiró en este estado para su ambientación."),
'pc_christopher_nolan_us': (
  "A Christopher Nolan film shot on location in this state.",
  "Un film de Christopher Nolan y a tourné en décors réels.",
  "Una película de Christopher Nolan rodó en localizaciones de este estado."),
'pc_music_taylor_swift': (
  "The Eras Tour played at least one date in this state.",
  "L'Eras Tour y a donné au moins une date.",
  "El Eras Tour dio al menos una fecha en este estado."),
'pc_music_beyonce_tour': (
  "The Renaissance World Tour played at least one date in this state.",
  "Le Renaissance World Tour y a donné au moins une date.",
  "El Renaissance World Tour dio al menos una fecha en este estado."),
'pc_music_dylan_song': (
  "A Bob Dylan song names this state or is set there.",
  "Une chanson de Bob Dylan le nomme ou s'y déroule.",
  "Una canción de Bob Dylan lo nombra o transcurre allí."),
'pc_born_president_post60': (
  "A US president who took office after 1960 was born here.",
  "Un président américain entré en fonction après 1960 y est né.",
  "Un presidente de EE. UU. que asumió después de 1960 nació aquí."),
'pc_born_first_lady': (
  "A US First Lady was born in this state.",
  "Une Première dame des États-Unis y est née.",
  "Una Primera dama de EE. UU. nació en este estado."),
'pc_amusement_park_top': (
  "Home to one of the ten most visited amusement parks in the country.",
  "Abrite l'un des dix parcs d'attractions les plus visités du pays.",
  "Alberga uno de los diez parques de atracciones más visitados del país."),
'pc_hist_spanish_colonial': (
  "Was under Spanish rule before it became part of the United States.",
  "A été sous domination espagnole avant de rejoindre les États-Unis.",
  "Estuvo bajo dominio español antes de integrarse en Estados Unidos."),
'pc_hist_french_colonial': (
  "Was under French rule before it became part of the United States.",
  "A été sous domination française avant de rejoindre les États-Unis.",
  "Estuvo bajo dominio francés antes de integrarse en Estados Unidos."),
'pc_red_state_consistent': (
  "Has voted Republican in every presidential election since 2000.",
  "A voté républicain à chaque présidentielle depuis 2000.",
  "Ha votado republicano en todas las presidenciales desde 2000."),
'pc_blue_state_consistent': (
  "Has voted Democratic in every presidential election since 2000.",
  "A voté démocrate à chaque présidentielle depuis 2000.",
  "Ha votado demócrata en todas las presidenciales desde 2000."),
'pc_largest_state_area': (
  "Ranked in the top 5 by land area. This is about size, not population.",
  "Dans le top 5 par superficie. Il s'agit de la taille, pas de la population.",
  "Entre los 5 mayores por superficie. Se trata del tamaño, no de la población."),
'pc_smallest_state_area': (
  "Ranked in the bottom 5 by land area. This is about size, not population.",
  "Dans les 5 derniers par superficie. Il s'agit de la taille, pas de la population.",
  "Entre los 5 menores por superficie. Se trata del tamaño, no de la población."),
'pc_top_population_2': (
  "One of the five most populous states. This is about people, not size.",
  "L'un des cinq États les plus peuplés. Il s'agit des habitants, pas de la taille.",
  "Uno de los cinco estados más poblados. Se trata de habitantes, no de tamaño."),
'pc_lowest_population': (
  "One of the five least populous states. This is about people, not size.",
  "L'un des cinq États les moins peuplés. Il s'agit des habitants, pas de la taille.",
  "Uno de los cinco estados menos poblados. Se trata de habitantes, no de tamaño."),
'pc_two_syllables': (
  "The English name is pronounced in two syllables, as in Texas or Kansas.",
  "Le nom anglais se prononce en deux syllabes, comme Texas ou Kansas.",
  "El nombre en inglés se pronuncia en dos sílabas, como Texas o Kansas."),
'pc_sea_level_low': (
  "Its lowest point sits at or very near sea level.",
  "Son point le plus bas se situe au niveau de la mer ou tout près.",
  "Su punto más bajo está al nivel del mar o muy cerca."),
'pc_named_after_person': (
  "The state is named after a real person rather than a place or a word.",
  "L'État porte le nom d'une personne réelle, pas d'un lieu ni d'un mot.",
  "El estado lleva el nombre de una persona real, no de un lugar ni de una palabra."),
'pc_named_after_river': (
  "The state takes its name from a river.",
  "L'État tire son nom d'un fleuve ou d'une rivière.",
  "El estado toma su nombre de un río."),
'pc_named_native_tribe': (
  "The state is named after a Native American people.",
  "L'État porte le nom d'un peuple amérindien.",
  "El estado lleva el nombre de un pueblo amerindio."),
'pc_french_origin_name': (
  "The state name comes from French.",
  "Le nom de l'État vient du français.",
  "El nombre del estado viene del francés."),
'pc_capital_is_largest': (
  "The capital is also the most populous city in the state, which is the exception rather than the rule.",
  "La capitale est aussi la ville la plus peuplée de l'État, ce qui est l'exception.",
  "La capital es también la ciudad más poblada del estado, lo que es la excepción."),
'pc_volcano_active': (
  "Has at least one volcano classed as active.",
  "Compte au moins un volcan classé actif.",
  "Tiene al menos un volcán clasificado como activo."),
'pc_multiple_time_zones': (
  "The state is split across two time zones.",
  "L'État est coupé en deux fuseaux horaires.",
  "El estado está dividido en dos husos horarios."),
'pc_super_bowl_host': (
  "A stadium in this state has hosted at least one Super Bowl.",
  "Un stade de cet État a accueilli au moins un Super Bowl.",
  "Un estadio de este estado ha acogido al menos una Super Bowl."),
'pc_olympics_host_any': (
  "A city here has hosted the summer or winter Olympic Games.",
  "Une ville d'ici a accueilli les Jeux olympiques d'été ou d'hiver.",
  "Una ciudad de aquí ha acogido los Juegos Olímpicos de verano o de invierno."),
'pc_state_capital_small': (
  "The state capital has fewer than 100,000 residents.",
  "La capitale de l'État compte moins de 100 000 habitants.",
  "La capital del estado tiene menos de 100 000 habitantes."),
'pc_capital_under_50k': (
  "The state capital has fewer than 50,000 residents.",
  "La capitale de l'État compte moins de 50 000 habitants.",
  "La capital del estado tiene menos de 50 000 habitantes."),
}


def live_ids():
    """Every constraint id the generator can actually pick."""
    core = set(re.findall(r"case '([a-z0-9_]+)':", open('js/puzzle.js', encoding='utf-8').read()))
    node = subprocess.run(['node', '-e', '''
const fs=require('fs'), vm=require('vm');
const ctx={window:{},console}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/constraints-pending.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('js/constraints-approved.js','utf8'),ctx);
console.log(JSON.stringify(ctx.window.APPROVED_PENDING));
'''], capture_output=True, text=True, check=True)
    return core | set(json.loads(node.stdout))


def main():
    live = live_ids()
    stray = sorted(set(HELP) - live)
    if stray:
        sys.exit(f"help written for ids the generator never picks: {stray}")

    for text in (t for texts in HELP.values() for t in texts):
        bad = [c for c in text if unicodedata.category(c) == 'Pd' and c != '-']
        if bad:
            sys.exit(f"unicode dash in help text: {text!r}")

    with open(PATH, encoding='utf-8') as f:
        data = json.load(f)
    for i, lang in enumerate(LANGS):
        data[lang]['constraint_help'] = {cid: texts[i] for cid, texts in HELP.items()}
    with open(PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

    print(f"constraint_help: {len(HELP)} entries x {len(LANGS)} languages")
    print(f"live constraints {len(live)}: {len(HELP)} explained, {len(live)-len(HELP)} self-evident")


if __name__ == '__main__':
    main()

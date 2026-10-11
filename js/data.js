/* =========================================================
   VolleyFit — programme d'entraînement
   Modifie ce fichier pour adapter les exercices.
   kind : "time" (minutes), "reps" (séries × répétitions), "hold" (séries × secondes)
   load : true = champ "charge en kg" pour suivre la progression
   ========================================================= */

const SESSIONS = {
  A: {
    name: "Jambes & détente",
    color: "#C94F17",
    goal: "Sauter plus haut et protéger genoux et chevilles.",
    items: [
      { id: "velo-echauffement", kind: "time", name: "Vélo, échauffement progressif", duration: 8, where: "Zone cardio",
        how: "Commence tranquille, augmente la résistance toutes les 2 minutes. Tu dois transpirer légèrement à la fin.",
        why: "Prépare genoux et chevilles avant les sauts." },
      { id: "pont-fessier", kind: "reps", name: "Pont fessier", sets: 2, reps: "12", rest: 45, where: "Tapis de sol",
        how: "Dos au sol, pieds à plat. Pousse dans les talons et serre les fessiers 1 seconde en haut.",
        why: "Réveille les fessiers, le moteur principal de la détente." },
      { id: "box-jump", kind: "reps", name: "Sauts sur caisson", sets: 4, reps: "5", rest: 90, where: "Zone fonctionnelle (box)",
        how: "Élan des bras comme à l'attaque, réception douce et silencieuse sur le caisson. Redescends en marchant, ne saute pas en arrière.",
        why: "Développe la détente verticale sans l'impact d'une réception au sol." },
      { id: "squat-goblet", kind: "reps", name: "Squat goblet (ou squat barre)", sets: 4, reps: "6-8", rest: 120, load: true, where: "Haltères ou kettlebells",
        how: "Charge contre la poitrine, pieds largeur d'épaules. Descends cuisses parallèles au sol, genoux dans l'axe des pieds.",
        why: "Plus de force dans les jambes, c'est plus de hauteur de saut." },
      { id: "rdl-halteres", kind: "reps", name: "Soulevé de terre roumain haltères", sets: 3, reps: "10", rest: 90, load: true, where: "Haltères",
        how: "Jambes presque tendues, pousse les hanches vers l'arrière, dos plat. Descends les haltères le long des cuisses jusqu'à mi-tibia.",
        why: "Ischios et bas du dos solides : moins de claquages sur les sprints et les plongeons." },
      { id: "fente-bulgare", kind: "reps", name: "Fentes bulgares", sets: 3, reps: "8 par jambe", rest: 90, load: true, where: "Banc + haltères",
        how: "Pied arrière posé sur un banc. Descends verticalement, genou avant au-dessus du pied.",
        why: "Travail d'une jambe à la fois : corrige les déséquilibres, utile pour l'appel d'attaque." },
      { id: "squat-incline", kind: "reps", name: "Squat talons surélevés, descente lente", sets: 3, reps: "12", rest: 60, where: "Disque ou cale sous les talons",
        how: "Talons sur un disque de 5 à 10 kg. Descends en 3 secondes, remonte normalement.",
        why: "Renforce le tendon rotulien, celui de la « blessure du sauteur » typique au volley." },
      { id: "mollets", kind: "reps", name: "Mollets debout", sets: 3, reps: "15", rest: 60, load: true, where: "Machine mollets ou Smith",
        how: "Monte sur la pointe des pieds, tiens 1 seconde, redescends lentement plus bas que la marche.",
        why: "Chevilles et tendon d'Achille plus solides pour encaisser les sauts répétés." },
      { id: "tapis-retour", kind: "time", name: "Tapis, marche de retour au calme", duration: 5, where: "Zone cardio",
        how: "Marche à allure normale, respire profondément.",
        why: "Fait redescendre le cœur doucement." }
    ]
  },

  B: {
    name: "Épaules & haut du corps",
    color: "#1F4FB8",
    goal: "Une épaule solide pour attaquer et servir sans douleur.",
    items: [
      { id: "tapis-20", kind: "time", name: "Tapis, footing ou marche en pente", duration: 20, where: "Zone cardio",
        how: "Footing léger, ou marche rapide avec 6 à 10 % d'inclinaison. Tu dois pouvoir parler en courant.",
        why: "L'endurance de base pour tenir 5 sets sans baisser d'intensité." },
      { id: "rotation-externe", kind: "reps", name: "Rotation externe à la poulie", sets: 3, reps: "15 par bras", rest: 45, load: true, where: "Poulie (câble)",
        how: "Coude collé au corps, plié à 90°. Tourne l'avant-bras vers l'extérieur, lentement. Charge légère.",
        why: "La coiffe des rotateurs freine ton bras après chaque attaque et chaque service." },
      { id: "face-pull", kind: "reps", name: "Face pull", sets: 3, reps: "15", rest: 60, load: true, where: "Poulie haute avec corde",
        how: "Corde à hauteur des yeux. Tire vers ton visage en écartant les mains, coudes hauts.",
        why: "Rééquilibre des épaules tirées vers l'avant par les frappes." },
      { id: "tirage-vertical", kind: "reps", name: "Tirage vertical", sets: 3, reps: "10", rest: 90, load: true, where: "Machine lat pulldown",
        how: "Prise un peu plus large que les épaules. Tire la barre vers le haut de la poitrine, poitrine sortie.",
        why: "Des dorsaux puissants rendent le bras armé plus rapide à l'attaque." },
      { id: "developpe-incline", kind: "reps", name: "Développé incliné haltères", sets: 3, reps: "8-10", rest: 90, load: true, where: "Banc inclinable + haltères",
        how: "Banc à 30°. Descends les haltères au niveau de la poitrine, coudes à 45° du corps.",
        why: "Force de poussée pour le contre et pour te relever des plongeons." },
      { id: "rowing-haltere", kind: "reps", name: "Rowing haltère un bras", sets: 3, reps: "10 par bras", rest: 60, load: true, where: "Banc + haltère",
        how: "Main et genou sur le banc. Tire l'haltère vers la hanche en serrant l'omoplate.",
        why: "Stabilise l'omoplate, la base d'une épaule saine." },
      { id: "ytw", kind: "reps", name: "Y-T-W sur banc incliné", sets: 2, reps: "8 de chaque lettre", rest: 60, load: true, where: "Banc inclinable + petits haltères",
        how: "Allongé sur le ventre, petits haltères de 1 à 3 kg. Lève les bras en Y, puis en T, puis en W.",
        why: "Les muscles profonds de l'épaule, souvent oubliés, évitent les douleurs." },
      { id: "medball-overhead", kind: "reps", name: "Lancer médecine-ball au-dessus de la tête", sets: 3, reps: "8", rest: 60, where: "Zone fonctionnelle",
        how: "Face à un mur, ballon au-dessus de la tête. Lance fort avec tout le corps, comme une rentrée en touche.",
        why: "Relie le gainage au bras : c'est la chaîne de l'attaque." }
    ]
  },

  C: {
    name: "Explosivité & gainage",
    color: "#0F7B6C",
    goal: "Se déplacer vite, rester stable en l'air.",
    items: [
      { id: "rameur-echauffement", kind: "time", name: "Rameur, échauffement", duration: 6, where: "Zone cardio",
        how: "Rythme facile, pousse avec les jambes d'abord, puis tire avec les bras.",
        why: "Échauffe tout le corps en même temps." },
      { id: "saut-patineur", kind: "reps", name: "Sauts latéraux (patineur)", sets: 3, reps: "6 par côté", rest: 60, where: "Espace libre",
        how: "Saute d'une jambe sur l'autre latéralement. Stabilise 1 seconde à chaque réception.",
        why: "Déplacements défensifs rapides et chevilles stables." },
      { id: "kb-swing", kind: "reps", name: "Kettlebell swing", sets: 4, reps: "12", rest: 75, load: true, where: "Kettlebells",
        how: "Charnière de hanche, pas un squat. Les hanches propulsent la kettlebell jusqu'à hauteur d'épaules.",
        why: "Puissance des hanches : la même extension que l'impulsion du saut." },
      { id: "medball-rotation", kind: "reps", name: "Lancer rotatif médecine-ball", sets: 3, reps: "8 par côté", rest: 60, where: "Zone fonctionnelle",
        how: "De profil au mur. Pivote les hanches, puis les épaules, et lance.",
        why: "La rotation du tronc utilisée à l'attaque et au service." },
      { id: "leg-curl", kind: "reps", name: "Leg curl", sets: 3, reps: "10", rest: 75, load: true, where: "Machine leg curl",
        how: "Contrôle la descente en 3 secondes.",
        why: "Des ischios solides protègent les genoux à la réception." },
      { id: "pallof", kind: "reps", name: "Pallof press", sets: 3, reps: "10 par côté", rest: 45, load: true, where: "Poulie à hauteur de poitrine",
        how: "De profil à la poulie, pousse la poignée devant toi sans laisser le tronc tourner.",
        why: "Gainage anti-rotation : un tronc stable pendant l'attaque en l'air." },
      { id: "planche", kind: "hold", name: "Planche", sets: 3, hold: 40, rest: 30, where: "Tapis de sol",
        how: "Sur les avant-bras, corps aligné de la tête aux talons, fessiers serrés.",
        why: "Base du gainage pour transmettre la force des jambes aux bras." },
      { id: "planche-laterale", kind: "hold", name: "Planche latérale", sets: 3, hold: 30, perSide: true, rest: 30, where: "Tapis de sol",
        how: "Sur un avant-bras, hanches hautes, corps droit.",
        why: "Stabilité latérale pour les plongeons et les réceptions déséquilibrées." },
      { id: "equilibre", kind: "hold", name: "Équilibre sur une jambe", sets: 3, hold: 30, perSide: true, rest: 20, where: "N'importe où",
        how: "Genou légèrement fléchi. Trop facile ? Ferme les yeux ou tiens-toi sur un coussin d'équilibre.",
        why: "Prévient les entorses de cheville, blessure numéro un au volley." },
      { id: "fractionne", kind: "time", name: "Fractionné tapis ou vélo", duration: 10, where: "Zone cardio",
        how: "Alterne 30 secondes rapide et 30 secondes lent, 10 fois.",
        why: "Le volley enchaîne des efforts courts et intenses : ce cardio colle au rythme d'un échange." }
    ]
  },

  R: {
    name: "Récupération",
    color: "#4A5876",
    goal: "Le lendemain d'un match : bouger sans fatiguer.",
    items: [
      { id: "velo-leger", kind: "time", name: "Vélo léger", duration: 15, where: "Zone cardio",
        how: "Résistance faible, pédale régulièrement sans forcer.",
        why: "Fait circuler le sang dans les jambes et accélère la récupération." },
      { id: "foam-roller", kind: "time", name: "Rouleau de massage", duration: 6, where: "Zone étirements",
        how: "Mollets, quadriceps, fessiers et haut du dos, environ 1 minute par zone.",
        why: "Détend les muscles chargés par les sauts." },
      { id: "mobilite-90-90", kind: "reps", name: "Mobilité de hanches 90/90", sets: 2, reps: "8 par côté", rest: 30, where: "Tapis de sol",
        how: "Assis, les deux jambes pliées à 90°. Bascule les genoux d'un côté à l'autre sans les mains.",
        why: "Des hanches mobiles soulagent genoux et bas du dos." },
      { id: "sleeper-stretch", kind: "hold", name: "Étirement de l'épaule couché (sleeper)", sets: 2, hold: 30, perSide: true, rest: 15, where: "Tapis de sol",
        how: "Couché sur le côté, bras à 90° devant toi. Pousse doucement l'avant-bras vers le sol avec l'autre main.",
        why: "Garde la rotation interne de l'épaule de frappe, qui se raidit avec les attaques." },
      { id: "etirement-jambes", kind: "hold", name: "Étirements ischios et quadriceps", sets: 2, hold: 30, perSide: true, rest: 15, where: "Tapis de sol",
        how: "Étire sans à-coups, respire lentement. Une tension légère, jamais de douleur.",
        why: "Récupère l'amplitude perdue après le match." }
    ]
  }
};

const POSITIONS = {
  polyvalent: { label: "Polyvalent", tip: "Programme équilibré : garde les trois séances chaque semaine." },
  passeur: { label: "Passeur", tip: "Tu touches presque chaque ballon : gainage et déplacements latéraux (séance C) sont ta priorité." },
  receptionneur: { label: "Réceptionneur-attaquant", tip: "Attaque et réception : épaules (séance B) et déplacements latéraux (séance C) en priorité." },
  central: { label: "Central", tip: "Beaucoup de sauts au contre : ne saute jamais le squat talons surélevés ni les mollets." },
  pointu: { label: "Pointu", tip: "Gros volume d'attaques : la coiffe des rotateurs (séance B) est ta meilleure assurance." },
  libero: { label: "Libéro", tip: "Peu de sauts mais beaucoup de plongeons : gainage, ischios et mobilité des hanches." }
};

# VolleyFit 🏐

Application web pour un joueur de volleyball qui s'entraîne à Basic-Fit : la séance du jour, exercice par exercice, avec chrono de repos, suivi des charges, du poids et de la composition corporelle.

## Fonctionnalités

- **Séance du jour** selon tes jours de salle et ton jour de match (pas de jambes la veille, récupération le lendemain).
- **Échauffement cardio de 15 à 25 minutes** au début de chaque séance, sur la machine de ton choix (tapis, vélo, rameur, elliptique, escalier).
- **41 exercices** sur les machines standard des clubs Basic-Fit (leg press, leg extension, leg curl, abducteurs, lat pulldown, chest press, seated row, pec deck, Smith machine, poulies, zone fonctionnelle), chacun avec une **illustration animée**, les étapes, l'erreur fréquente et son intérêt pour le volley.
- **Alternatives** : machine prise ou absente dans ton club ? Remplace l'exercice en un geste, ton choix est retenu.
- **Suivi série par série** comme les applis de gym : charge, répétitions, valeurs de la séance précédente, chrono de repos automatique (bip, vibration, ±15 s).
- **Records personnels** détectés automatiquement, avec courbe de progression par exercice.
- **Historique** avec calendrier mensuel, volume soulevé et ressenti d'effort.
- **Objectif hebdomadaire et série de semaines** réussies.
- **Suivi corporel** : poids, IMC, masse grasse, musculaire, osseuse, eau, objectifs de poids et de masse grasse.
- **Bibliothèque d'exercices** avec recherche et filtres par zone de la salle.
- **Cycles de 4 semaines** avec semaine allégée automatique.
- **Hors-ligne et installable**, données stockées uniquement sur ton appareil (export et import JSON).

## Mise en ligne avec GitHub Pages

1. Pousse le code sur la branche `main`.
2. Sur GitHub : **Settings → Pages → Build and deployment → Source : Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Après une minute, l'app est en ligne sur `https://<ton-pseudo>.github.io/<nom-du-repo>/`.
4. Sur ton téléphone, ouvre ce lien puis « Ajouter à l'écran d'accueil ».

## Modifier le programme

Tout le programme est dans [`js/data.js`](js/data.js). Chaque exercice a un nom, des séries, des répétitions, un temps de repos, l'endroit où le trouver à la salle, et des explications. Change les valeurs, pousse, c'est en ligne.

Après une modification, augmente le numéro de `CACHE` dans `sw.js` (`volleyfit-v2`…) pour que les téléphones récupèrent la nouvelle version.

## Structure

```
index.html            page principale
css/style.css         styles
js/data.js            exercices et programme
js/figures.js         illustrations animées
js/app.js             logique de l'application
sw.js                 cache hors-ligne
manifest.webmanifest  installation sur téléphone
icon.svg              icône
```

Aucune dépendance, aucune compilation : du HTML, CSS et JavaScript simples.

---

Ce programme ne remplace pas l'avis d'un médecin ou d'un kinésithérapeute, surtout en cas de douleur ou de blessure.

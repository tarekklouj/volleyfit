# VolleyFit 🏐

Application web pour un joueur de volleyball qui s'entraîne à Basic-Fit : la séance du jour, exercice par exercice, avec chrono de repos, suivi des charges, du poids et de la composition corporelle.

## Fonctionnalités

- **Séance du jour** selon tes jours de salle et ton jour de match (pas de jambes la veille, récupération le lendemain).
- **4 séances** adaptées au volley et au matériel Basic-Fit :
  - A, Jambes & détente (sauts, squat, protection du tendon rotulien)
  - B, Épaules & haut du corps (20 min de tapis, coiffe des rotateurs, dorsaux)
  - C, Explosivité & gainage (kettlebell, médecine-ball, chevilles, fractionné)
  - R, Récupération (lendemain de match)
- **Mode séance** : séries à cocher, chrono de repos automatique avec vibration et bip, charges retenues d'une fois à l'autre, ressenti et notes.
- **Cycles de 4 semaines** : 3 semaines de progression, 1 semaine allégée automatique.
- **Suivi** : poids, taille, IMC, masse grasse, musculaire, osseuse, eau corporelle, avec courbes.
- **Conseils selon ton poste** (passeur, central, pointu, libéro…).
- **Hors-ligne et installable** sur l'écran d'accueil du téléphone.
- Données stockées **uniquement sur ton appareil**, avec export et import en JSON.

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
js/data.js            programme d'entraînement
js/app.js             logique de l'application
sw.js                 cache hors-ligne
manifest.webmanifest  installation sur téléphone
icon.svg              icône
```

Aucune dépendance, aucune compilation : du HTML, CSS et JavaScript simples.

---

Ce programme ne remplace pas l'avis d'un médecin ou d'un kinésithérapeute, surtout en cas de douleur ou de blessure.

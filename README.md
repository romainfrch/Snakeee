# SNAKEEE

SNAKEEE est un jeu réalisé en p5.js dans le cadre de ce TP.

## Jouer

Ouvrir `index.html` dans un navigateur moderne.

Contrôles visibles :
- souris : diriger le serpent
- clic sur le bouton d'accueil : lancer la partie
- `D` : debug
- `G` : ouvrir les options de partie

## Principe du jeu

On contrôle un serpent qui doit manger des graines et récupérer des étoiles tout en évitant des épées ennemies.
Les rochers bloquent les trajectoires et l'herbe ralentit le déplacement.
Le but est d'atteindre le score cible avant de perdre toutes les vies.

### `js/vehicle.js`

- `applyForce(force)` et `update()` : base commune des `Vehicle`
- `seek(target)` et `flee(target)` : repris de `1-Seek/vehicle.js`
- `pursue(target)` et `evade(target)` : repris de `2-PursueEvade_correction/vehicle.js`
- `arrive(target)` et `boundaries(...)` : repris de `3-Arrival_correction/vehicle.js`
- `wander()` : repris de `4-Wander/vehicle.js`
- `follow(path)` : repris de `5-3-PathFollowingComplex/vehicle.js`
- `avoid(obstacles)` : repris de `6-ObstacleAvoidance/vehicle.js`

### `js/entities.js`

- la tête du serpent et les segments reprennent l'idée de `3-Arrival_correction/snake.js`
- les graines utilisent surtout `wander + avoid + boundaries`
- les étoiles utilisent `wander + evade + avoid`
- les épées chasseuses utilisent `pursue + avoid + boundaries`
- les épées de patrouille utilisent `follow(path)` puis `pursue`

### `js/path.js`

- inspiré directement de `5-2-PathFollowing/path.js` et `5-3-PathFollowingComplex/path.js`

### `js/obstacle.js`

- structure gardée proche de `6-ObstacleAvoidance/obstacle.js`, avec un rendu rocher plus terre à terre

## IDE utilisé

- Visual Studio Code

## Modèles IA utilisés

- GPT-5.4

## Liens à compléter avant rendu

- Repo GitHub : à ajouter
- Jeu en ligne (GitHub Pages ou itch.io) : à ajouter

## MON EXPERIENCE

J'ai choisi de faire un Snake parce que je trouvais que ça marchait bien avec les steering behaviors. Le corps du serpent pouvait suivre avec `arrive`, les ennemis pouvaient utiliser `pursue`, la nourriture pouvait bouger avec `wander`, et les obstacles permettaient aussi de remettre `avoid`. Ça donnait un jeu assez simple à comprendre, mais qui permettait quand même de montrer plusieurs comportements vus en cours.

Au début, j'étais parti sur quelque chose de beaucoup plus futuriste. Honnêtement, ça ne rendait pas très bien. Il y avait trop d'effets, trop de couleurs un peu néon, et au final ça nuisait à la lisibilité. J'ai donc changé de direction pour aller vers un truc plus "naturel".

J'ai aussi testé plusieurs versions de la nourriture. Les premiers petits points étaient trop discrets, presque invisibles suivant le fond. Ensuite je les ai transformés en graines, mais au début elles restaient encore trop petites. J'ai dû les grossir et retravailler un peu le contraste pour qu'on comprenne mieux ce qu'il fallait ramasser.

Le point le plus compliqué à régler, ça a été le serpent lui-même. Quand on accélérait trop le jeu (via le réglages des paramètres en appuyant sur G), le corps suivait mal et ça devenait vite bizarre visuellement. J'ai donc repris le suivi des segments pour rester dans l'esprit de `3-Arrival_correction`, mais avec des réglages plus stables. J'ai eu un peu le même problème avec les épées et l'évitement des obstacles : au départ ça tremblait beaucoup au bord des rochers, donc j'ai dû adoucir ça.

Il y a aussi des idées que j'ai testées puis enlevées. Par exemple une page d'accueil plus chargée, ou un affichage avec plus d'informations. En théorie ça paraissait utile, mais en pratique ça faisait moins jeu et plus prototype. J'ai préféré simplifier pour garder quelque chose de plus pertinent tout simplement.

Au final, le projet reste très basique, mais c'était justement l'idée. Je voulais surtout faire un jeu cohérent, jouable, et où on voit clairement la base `Vehicle`, les forces, et plusieurs steering behaviors réutilisés dans des rôles différents.

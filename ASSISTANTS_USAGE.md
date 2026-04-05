# Assistants usage

Ce fichier résume les choix effectués pour générer ce jeu.

## Objectif

Créer un mini-jeu de type snake fluide utilisant plusieurs steering behaviors.

## Contraintes respectées

- Tous les objets animés importants héritent de `Vehicle`
- Les comportements de base sont regroupés dans `Vehicle`
- Les sous-classes ne contiennent que la spécialisation

## Sources comportementales reprises

- `2-PursueEvade_correction/vehicle.js`
- `3-Arrival_correction/vehicle.js`
- `3-Arrival_correction/snake.js`
- `4-Wander/vehicle.js`
- `5-3-PathFollowingComplex/vehicle.js`
- `5-3-PathFollowingComplex/path.js`
- `6-ObstacleAvoidance/vehicle.js`
- `6-ObstacleAvoidance/obstacle.js`

## Choix de gameplay

- Snake fluide plutôt que grille classique
- Proies bleues errantes
- Proies rares qui fuient
- Chasseurs rouges qui poursuivent
- Patrouilleurs violets qui suivent un chemin
- Obstacles fixes à éviter


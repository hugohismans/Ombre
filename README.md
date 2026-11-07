# Ombre

Un petit jeu de lumière, en 2D vue de côté. Tu es une ombre : tu ne peux exister que
dans l'ombre. Si la lumière te touche, tu te dissous et le niveau recommence.

Jouer : <https://hugohismans.github.io/Ombre/>

## Comment on joue

- La créature avance seule vers la droite. Touche-la (ou clique-la) pour l'arrêter ou
  la faire repartir. Au clavier : espace.
- Les objets marqués de petites flèches se déplacent au doigt ou à la souris, dans le
  sens des flèches. Les ombres suivent en temps réel.
- Le but : atteindre la fenêtre sans jamais traverser la lumière.
- ↻ (ou R) recommence le niveau.

## Les règles du monde

- Une seule lampe, ponctuelle. Un pixel est dans l'ombre si le segment qui le relie à
  la flamme traverse un objet. La même carte de lumière, calculée au pixel près, sert
  au dessin et aux collisions : ce qui est dessiné éclairé est mortel.
- La créature est portée par la matière (plancher, caisses) et par le bord de la
  lumière : le dessous d'une ombre suspendue est une plateforme.
- Elle franchit les petites marches, grimpe le long des murs et des caisses tant
  qu'elle reste dans l'ombre, et tombe quand rien ne la porte.
- Objets translucides (`verre: true`) : ombre grise. On y est en sécurité, mais on y
  glisse plus vite, sans pouvoir s'arrêter ni s'agripper ; bloqué dedans, on se dissout.
- Caisses « pesantes » (`pesant: true`) : elles tombent quand on les lâche, et
  s'empilent. La lampe peut l'être aussi : on la porte et on la pose.
- Trappes (`trous`) : on y tombe et on est perdu. Une caisse lâchée dessus la bouche.
  Au-dessus d'une trappe, trop d'ombre est dangereux : rien ne porte la créature.
- Niveaux de réflexion (`attend: true`) : la créature dort, à l'abri, jusqu'à ce
  qu'on la touche.

## Niveaux

1. Une caisse, lampe fixe : rapprocher la caisse de la lampe pour que son ombre
   monte jusqu'à la fenêtre.
2. Deux caisses : la petite est fixe, la grande barre le chemin. Il faut éloigner la
   grande pour que l'ombre de la petite monte assez haut sur sa face.
3. Une étagère fixe, une lanterne qu'on règle en hauteur. Trop haute, l'ombre de
   l'étagère tombe trop bas sur le mur ; trop basse, la lumière passe dessous.
4. Un drap sur une corde : son ombre est grise, on y glisse sans pouvoir s'arrêter
   ni grimper. L'amener près de la lampe pour relier l'ombre de la caisse à la fenêtre.
5. Une étagère haute, une lampe qui glisse le long de la poutre : quand la lampe va
   à gauche, l'ombre part à droite. Il faut escorter la créature jusqu'au bout.
6. Empilement : une caisse seule fait une ombre courte ; posée sur l'autre, elle
   dépasse la flamme et son ombre monte jusqu'à la fenêtre.
Les casse-têtes (la créature dort tant qu'on ne l'a pas touchée ; après un échec,
la disposition est gardée, ↻ remet tout à zéro) :

7. La trappe : deux caisses, l'une doit couvrir la trappe, l'autre allonger l'ombre.
   Empiler les deux fait tomber la créature dans le trou.
8. Sous l'étagère : la lampe se porte. Cachée sous l'étagère, posée sur la caisse,
   elle ouvre au-dessus un V d'ombre dont les bords sont des pentes de lumière.
9. Le piédestal : l'étagère est plus haute, il faut deux caisses sous la lampe. Ou
   l'enfermer sur l'étagère entre les deux caisses.
10. Le coucher du soleil : la lampe descend seule en 40 s puis s'éteint. Répartir les
    caisses comme au niveau 7, retenir la créature, la lâcher entre 16 et 22 s.

Les solutions sont vérifiées par un solveur qui essaie toutes les dispositions
(positions sur une grille de 4 à 8 pixels) : de 0,3 % à 3 % d'entre elles gagnent.

## Code

Vanilla JS et canvas, sans dépendance ni étape de build. La scène fait 240 × 180
pixels, agrandie sans lissage.

```
index.html, style.css
src/main.js     boucle, entrées, fondus, phrases
src/world.js    murs, objets, carte de lumière, déplacement des objets
src/player.js   la créature : marche, marches, escalade, chute, dissolution
src/art.js      décor du grenier, caisses, lampe, calque d'ombre tramé
src/levels.js   les niveaux (données)
```

En local : `python3 -m http.server`, puis <http://localhost:8000/>. `?n=2` ouvre
directement le niveau 2. Le site est publié par `.github/workflows/deploy.yml` à
chaque push sur `main`.

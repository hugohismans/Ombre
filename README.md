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
  s'empilent.

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
7. Le coucher du soleil : la lampe descend seule en 40 s puis s'éteint. Empiler,
   retenir la créature (elle attend qu'on la touche) et la lâcher au bon moment.

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

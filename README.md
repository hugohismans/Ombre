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
- Objets translucides (`verre: true`) : ombre grise, on y glisse sans pouvoir s'arrêter.

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

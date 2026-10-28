// ?test: one page with a shortcut to every scene, to check everything without playing the whole swap.
// The shortcuts run in demo mode (nothing saved), except « Remettre à zéro », meant for just before she plays.
import { content } from "./content.js";
import { h } from "./dom.js";

export function testScreen() {
  const link = (label, href, note) => h("a", { class: "test-link", href }, h("span", {}, label), note && h("small", {}, note));
  const group = (title, links) => h("section", { class: "test-group" }, h("h2", { class: "recap-title" }, title), links);
  const el = h(
    "section",
    { class: "screen screen-report" },
    h(
      "div",
      { class: "report-card" },
      h("h1", { class: "report-title" }, "Page de test"),
      h("p", { class: "test-note" }, "Tout s'ouvre en mode démo : rien n'est enregistré, sauf « Remettre à zéro »."),
      group("Accueil et galerie", [
        link("Page d'accueil", "./", "la vraie, avec sa progression"),
        link("Galerie des matchs", "?musee"),
        link("Galerie (version CSS)", "?musee&css", "celle de secours, sans 3D"),
        link("Tout rejouer depuis le début", "?rejouer", "rien n'est enregistré, pas de badge démo"),
      ]),
      group("Début", [link("Intro et choix des chips", "?demo&scene=intro")]),
      group(
        "Cadeaux",
        content.gifts.map((gift, i) => link(`${i + 1}. ${gift.title}`, `?demo&scene=gift-${i + 1}`, gift.short)),
      ),
      group("Entre les cadeaux", [
        link("La pub", "?pub&demo"),
        link("Bonus Nerds", "?demo&scene=bonus&snack=munch", "après les Monster Munch"),
        link("Bonus Nerds", "?demo&scene=bonus&snack=brets", "après les Brets"),
      ]),
      group("Fin", [
        link("Écran final", "?demo&scene=final"),
        link("Débrief", "?demo&scene=debrief"),
        link("Carte des fins", "?demo&scene=map", "toutes trouvées"),
        link("Fin secrète", "?secret"),
        link("Surprise UBB", "?ubb", "la séquence seule"),
        link("Ses réponses au débrief", "?debrief&demo"),
      ]),
      group("Avant de lui donner le téléphone", [link("Remettre à zéro", "?reset", "efface sa progression et ses réponses au débrief")]),
    ),
  );
  return { el };
}

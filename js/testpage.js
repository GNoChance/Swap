// ?test: one page with a shortcut to every scene, to check everything without playing the whole swap.
// The shortcuts run in demo mode (nothing saved), except the real ones (said so) and the resets, meant for just before
// she plays.
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
      h("p", { class: "test-note" }, "Tout s'ouvre en mode démo : rien n'est enregistré, sauf ce qui est marqué « la vraie » et les remises à zéro."),
      group("Portail", [
        link("Le hub", "./#/", "la page d'entrée du site"),
        link("Accueil du swap", "./#/swap", "la vraie, avec sa progression"),
        link("Galerie des matchs", "./#/ubb"),
        link("Galerie (version CSS)", "?css#/ubb", "celle de secours, sans 3D"),
        link("Ancienne adresse de la galerie", "?musee", "devient #/ubb"),
        link("Tout rejouer depuis le début", "?rejouer", "rien n'est enregistré, pas de badge démo"),
      ]),
      group("Nos aventures", [
        link("Le passeport", "./#/aventures", "la vraie progression"),
        link("Le passeport complet", "?demo#/aventures", "tout tamponné"),
        link("Le moment du tampon", "?demo&tampon=bivouac-1#/aventures", "le tampon encreur sur Premier bivouac"),
        link("Une intro", "?demo#/aventures/roadtrip", "le Roadtrip catalan"),
        link("Passeport à zéro", "?reset#/aventures", "remet le passeport à zéro, le swap et le débrief aussi"),
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

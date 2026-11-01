// The command line of decoupe.mjs: <target> [--scene [--count N]], in any order.
export function parseArgs(argv) {
  const scene = argv.includes("--scene");
  const at = argv.indexOf("--count");
  const count = at < 0 ? null : Number(argv[at + 1]);
  if (at >= 0 && (!scene || !Number.isInteger(count) || count < 1)) throw new Error("--count N (entier) ne va qu'avec --scene");
  const target = argv.find((a, i) => !a.startsWith("--") && (at < 0 || i !== at + 1));
  if (!target) throw new Error("usage : node tools/decoupe/decoupe.mjs <dossier de planches | planche.png> [--scene [--count N]]");
  return { target, scene, count };
}

// The check of the end-to-end suites, shared: one named check on a page, logged ✔ or ✘. A check also fails if the
// page logged an error; the first failure closes the page and stops everything (exit code 1).

/** check(page) → check(name, fn, { allowErrors }); allowErrors: for a check that breaks something on purpose (a
 *  blocked file logs its failure). */
export function check(page) {
  return async (name, fn, { allowErrors = false } = {}) => {
    const before = page.errors.length;
    try {
      await fn();
      if (!allowErrors && page.errors.length > before) throw new Error(`erreur dans la page : ${page.errors.slice(before).join(" | ")}`);
      console.log(`  ✔ ${name}`);
    } catch (error) {
      console.log(`  ✘ ${name} : ${error.message}`);
      await page.close();
      process.exit(1);
    }
  };
}

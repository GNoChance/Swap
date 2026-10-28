// Shared souvenirs: the Supabase project (README, « Souvenirs partagés »). Empty: the « En savoir plus » panel
// stays as it was, without souvenirs. The anon key is public by design: the access rules (supabase/setup.sql)
// protect the data, and the shared code is never written here.
export const config = {
  url: "",
  anonKey: "",
  email: "famille@swap-cyrielle.app", // the shared account: the code typed on the site opens it
};

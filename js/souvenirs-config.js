// Shared souvenirs: the Supabase project (README, « Souvenirs partagés »). Empty url / anonKey: the « En savoir
// plus » panel stays as it was, without souvenirs. The anon key is public by design: the access rules (supabase/setup.sql)
// protect the data, and the shared code is never written here.
export const config = {
  url: "https://iyzksvyznyddimilpfha.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5emtzdnl6bnlkZGltaWxwZmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxODc5NjQsImV4cCI6MjEwODc2Mzk2NH0.3RLQWqGNx6m22_dkI9j57cVQ4Mf-waVmRNscS6K90E0",
  email: "famille@swap-cyrielle.app", // the shared account: the code typed on the site opens it
};

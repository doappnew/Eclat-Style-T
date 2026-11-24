-- Suivi du test Testnet des pionniers : un compte est « validé » quand les 3 étapes sont faites.
create table if not exists pioneer_test (
  user_id uuid primary key references users(id) on delete cascade,
  login_ok boolean not null default false,
  u2a_done boolean not null default false,
  a2u_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- accès uniquement par le serveur (clé de service) : RLS activé, aucune policy
alter table pioneer_test enable row level security;

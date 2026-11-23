-- Envois de test app -> utilisateur (Testnet). Une ligne par compte au maximum.
create table if not exists testnet_payouts (
  user_id uuid primary key references users(id) on delete cascade,
  amount numeric(20,7) not null,
  payment_id text,
  txid text,
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  created_at timestamptz not null default now()
);
alter table testnet_payouts enable row level security;

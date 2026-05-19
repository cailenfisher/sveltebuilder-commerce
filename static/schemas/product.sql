create table product_categories (
  id         bigint generated always as identity primary key,
  slug       text not null unique,        -- e.g. 'electronics'
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id           uuid primary key default gen_random_uuid(),
  name         text           not null,
  description  text           not null default '',
  price        numeric(10, 2) not null check (price >= 0),
  category_id  bigint         not null references product_categories(id) on delete restrict,
  stock        integer        not null default 0 check (stock >= 0),
  is_published boolean        not null default false,
  is_featured  boolean        not null default false,
  created_at   timestamptz    not null default now(),
  updated_at   timestamptz    not null default now()
);

create index products_category_id_idx on products (category_id);
create index products_is_published_idx on products (is_published) where is_published = true;
create index products_is_featured_idx  on products (is_featured)  where is_featured  = true;
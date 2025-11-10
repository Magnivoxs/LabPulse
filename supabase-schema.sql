-- LabPulse Supabase Schema
-- Run this in Supabase SQL editor

create table if not exists offices (
  id int primary key,
  name text not null,
  state char(2) not null,
  address text,
  phone text,
  practiceModel text check (practiceModel in ('PO','PLLC')),
  managingDentist text,
  dfo text,
  standardizationStatus text check (standardizationStatus in ('Training Plan','Graduated')),
  laborModel numeric not null
);

create table if not exists staff (
  officeId int references offices(id) on delete cascade,
  name text not null,
  title text check (title in ('Lab Manager','Full Tech','Waxer Finisher','Processor')) not null,
  hireDate date,
  phone text,
  primary key (officeId, name, title)
);

create table if not exists monthly_metrics (
  officeId int references offices(id) on delete cascade,
  period char(7) not null,  -- YYYY-MM
  revenue numeric not null,
  labExpenses numeric not null,
  outsideLab numeric not null,
  teethSupplies numeric not null,
  labSupplies numeric not null,
  personnel numeric not null,
  overtime numeric not null,
  bonuses numeric not null,
  units int not null,
  patients int not null,
  primary key (officeId, period)
);


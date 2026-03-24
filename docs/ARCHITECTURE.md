# Technical Architecture: SaaS Admin (VEN)

This document outlines the technical foundation and architectural decisions for the Venezuelan Small Business Administration SaaS.

## 1. High-Level Overview
The system follows a **Client-Server** architecture with a centralized database. It is designed as a **Multi-tenant SaaS** where multiple businesses (Tenants) share the same infrastructure but remain logically isolated.

## 2. Technology Stack
- **Backend**: [NestJS](https://nestjs.com/) (Node.js framework) for a scalable, modular API.
- **Frontend**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/) as a [PWA](https://web.dev/progressive-web-apps/) for mobile-first experience and offline support.
- **Database**: [PostgreSQL](https://www.postgresql.org/) for relational data integrity.
- **ORM**: [Prisma](https://www.prisma.io/) for type-safe database access.
- **Containerization**: [Docker Compose](https://docs.docker.com/compose/) for local development and consistent environments.

## 3. Multi-tenancy Strategy: Shared Schema
We use a **Discriminator Column** (`tenant_id`) approach:
- Every table containing business data (Products, Sales, Customers) includes a `tenant_id` column.
- Backend middleware ensures that every request is scoped to the authenticated user's `tenant_id`.
- This approach is cost-effective and simplifies cross-tenant updates while maintaining strict data isolation.

## 4. Data Model (Core Entities)
- **Tenants**: Business profiles (Name, RIF, Settings).
- **Users**: Authentication and role-based access control (Admin, Seller).
- **Products**: Inventory items with base prices in **USD**.
- **Sales**: Transaction records containing total in USD, payment methods, and the specific exchange rate at the time of sale (`tasa_momento`).
- **Customers**: Ledger for tracking accounts receivable ("Fiaos") in USD.

## 5. Security
- **Authentication**: JWT-based auth.
- **Authorization**: Role-Based Access Control (RBAC).
- **Tenant Isolation**: Row-level filtering enforced at the Service layer in NestJS.

---
title: "OpenInventory Inventory & Sales Tracking"
date: "2026-03-24T12:00:00.000Z"
projectType: "Full-Stack App"
technologies:
  - "React"
  - "Vite"
  - "TypeScript"
  - "React Router"
  - "Tailwind CSS"
  - "shadcn/ui"
  - "Firebase"
  - "Firestore"
  - "Cloud Functions"
  - "Recharts"
  - "Stripe"
  - "PWA"
description: "Full-scale inventory, manufacturing, and event-scoped sales for roaming markets and venue-based businesses-React/Vite, Firebase, offline-first POS."
longDescription: |
  # OpenInventory - Full-Scale Inventory & Event Management

  OpenInventory addresses real-world inventory and sales for businesses that sell across roaming markets and event-based venues. It pairs a mobile-first, offline-capable web app with a secure, scalable Firebase backend. The product is in active use by a small business operating that kind of sales model.

  ### Core Functionality

  - **Dual inventory**: **Master stock** (finished goods) and **production stock** (ingredients/raw materials), with smart unit pricing for bulk purchase vs. recipe use.
  - **Recipes & manufacturing**: Define recipes per product; restock/manufacture finished goods and deduct ingredients from production stock with transactional integrity (batch/transaction semantics).
  - **Events & selling context**: Create events or permanent locations with dates, fees, travel, staff, spoilage, and daily notes; segregate sales and costs by context.
  - **Sales tracker (POS)**: Event- and date-scoped selling, cart checkout, automatic master-stock deduction, and offline-first queuing with sync when connectivity returns.
  - **Analytics**: Revenue, COGS, expenses, net profit, and visual breakdowns using **Recharts** (via shadcn-style chart primitives).
  - **Users & roles**: **Admin** vs **staff** access; staff-focused sales experience with sensitive cost/analytics data enforced at the data layer (Firestore security rules), not only in the UI.
  - **Settings & billing**: Organisation preferences (currency, timezone, etc.) and subscription flows aligned with **Stripe** where configured.

  ### Architecture Design

  - **Frontend**: Single-page app (**React** + **Vite**), **React Router** for navigation, **Tailwind CSS** and **shadcn/ui** for UI, **PWA**-oriented and **mobile-first**.
  - **Data & backend**: **Firebase** - **Firestore** for documents and real-time reads, **Firebase Auth** for identity, **Cloud Functions** for server-side logic, **Firebase Storage** for assets, **Firebase Hosting** for the built client.
  - **Client data access**: Typed domain logic and Firestore integration from the app (no separate self-hosted REST API or relational ORM in the core stack).
  - **Security**: Role-aware **Firestore rules** so staff cannot read protected collections (e.g. production cost depth and admin analytics paths as designed).

  ### DevOps & Environments

  - **Local development**: **Firebase emulators** (Auth, Firestore, Storage, Functions) supported alongside **Vite** for a reproducible dev loop.
  - **Configuration**: Environment-specific settings via .env / Vite env conventions for Firebase and integration keys (no secrets committed).
  - **Deployment**: Production shaped around **Firebase Hosting** (+ Functions) as the primary hosting and compute surface.

repositoryUrl: ""
liveDemoUrl: "https://openinventory.app"
status: "Active"
featured: true
tags:
  - "react"
  - "vite"
  - "firebase"
  - "firestore"
  - "typescript"
  - "inventory"
  - "pos"
  - "pwa"
  - "stripe"
challenges: |
  ### Complex Data Modeling (Firestore)

  Modeling **master stock**, **production stock**, **recipes**, **events**, and **sales** in **Firestore** (documents and collections) instead of a single relational schema was a major challenge: choosing what to embed vs. reference, keeping reads efficient for mobile POS, and preserving **consistency** for inventory movements using **transactions / write batches** so master and production quantities never drift.

  ### Master vs Production Stock & Event Context

  Connecting **finished goods** to **ingredient consumption** (recipes, unit normalisation in the smallest stable unit), while also scoping **sales**, **costs**, and **operational context** to **events** (or permanent locations), required clear domain boundaries: manufacturing must atomically deduct production stock and add master stock; the sales tracker must respect the selected event and date without breaking offline queues or role-based access to cost and analytics data.
lessonsLearned: |
  ### Decoupled Architecture Best Practices

  - Treating the **UI** as a thin client over a **contracted data and auth layer** (Firestore + security rules + Cloud Functions) keeps the product maintainable: the app can ship UI changes on **Firebase Hosting** while server logic evolves in **Functions**, and domain rules can be tested and reasoned about apart from presentation.
  - A strict split between **presentational components** and **domain/services** (pure TypeScript for recipes, COGS, units, etc.) pays off when the same logic must run in the client, in emulators, and under offline constraints without duplicating behavior.

  ### Firebase Full-Stack Workflow

  - Building on **Firebase** (Auth, Firestore, Functions, Storage, Hosting) and the **local emulator suite** clarified how configuration, indexes, rules, and deploy targets fit together.
  - Designing for **offline-capable sales** and **eventual consistency** required consideration of **optimistic UI**, **sync/retry**, and **atomic inventory writes** so user experience stays fast without sacrificing integrity when the network is poor at markets and pop-ups.
---

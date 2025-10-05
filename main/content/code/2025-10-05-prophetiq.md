---
title: "Prophetiq Algorithmic Trading"
date: "2025-10-05T15:00:00.000Z"
projectType: "Full-Stack App"
technologies:
  - "Next.js"
  - "TypeScript"
  - "Firebase"
  - "Docker"
  - "Freqtrade"
  - "Google Gemini"
  - "Stripe"
  - "Tailwind CSS"
  - "Radix UI"
  - "Three.js"
description: "An AI-powered algorithmic trading platform being rebuilt from the ground up on a modern, serverless architecture to make advanced trading accessible."
longDescription: |
  # AI-Powered Algorithmic Trading Platform
  
  A ground-up rebuild of the existing ProphetIQ platform, adding a full strategy creation suite for non-technical users, while maintaining and providing a simple and intuitive experience.
  
  ### Core Functionality
  
  - **AI Strategy Builder**: Generate and refine trading strategies from natural language prompts using Google Gemini.
  - **Logic Block Strategy Builder**: Create strategies using a block based method, connecting 200+ indicators and metrics with buy and sell conditions.
  - **Advanced Backtesting Engine**: Test strategies against historical market data with professional-grade performance analytics.
  - **Hyperparameter Optimization**: Automatically discover the optimal settings for trading algorithms with Optuna.
  - **Live & Paper Trading**: Deploy strategies as automated bots in either simulated or live market environments via a containerized trading engine.
  - **Community Hub**: A planned space for users to share strategies, view public leaderboards, and clone successful algorithms.
  
  ### Architecture Design
  
  The platform is architected as a highly decoupled, domain-driven monorepo, combining serverless and containerized services for scalability and power:
  - **Core Backend**: A serverless foundation built entirely on the Google Firebase ecosystem, handling authentication, database (Firestore), file storage, and serverless compute (Cloud Functions).
  - **Trading Engine**: The core trading and backtesting logic is powered by Freqtrade, an open-source trading bot. Each user's instance runs in an isolated Docker container, managed via a secure REST API, ensuring resource and security separation.
  - **Frontend**: A sophisticated and responsive SPA built with Next.js and TypeScript. The UI is crafted with Tailwind CSS and a custom design system based on Radix UI's headless components.
  - **Visuals & UX**: The interface features a clean, data-focused aesthetic with a modern Three.js background animation. Data visualizations are rendered with Recharts, and an in-browser Monaco Editor provides a rich code editing experience.
  
  ### DevOps Integration
  
  - **Serverless Hosting**: The Next.js frontend is hosted on Firebase App Hosting for seamless integration with the backend.
  - **Container Orchestration**: The Freqtrade Docker containers are managed as separate, on-demand services.
  - **Secure Payments**: Subscription management and payments are fully integrated with Stripe.
repositoryUrl: ""
liveDemoUrl: "https://prophet-iq.com"
status: "In Development"
featured: true
tags:
  - "nextjs"
  - "firebase"
  - "ai"
  - "algorithmic-trading"
  - "fintech"
  - "docker"
  - "serverless"
  - "google-gemini"
challenges: |
  
  ### Hybrid Architecture Integration
  Integrating a containerized, stateful trading engine (Freqtrade) with a stateless, serverless backend (Firebase Cloud Functions) presents a significant orchestration challenge, requiring a robust API gateway and secure communication between the two distinct environments.
  
  ### Real-Time Data & Security
  Developing a secure, low-latency system for executing live financial trades is paramount. This requires stringent security measures, robust error handling, and a highly reliable architecture to manage real-time market data and user funds.
  
  ### Natural Language to Code Translation
  Creating an intuitive AI Strategy Builder that reliably translates diverse, non-technical user prompts into valid and effective trading strategies is a major AI and UX challenge, demanding sophisticated prompt engineering and validation logic.
  
lessonsLearned: |
  
  ### Integrating Existing Frameworks
  - Effectively using Freqtrade within the project for the core framework, needs careful and methodical understanding of the existing code, what is and is not possible, and adhering to its configuration requirements.
---

This project represents a significant architectural redesign, moving to a modern, scalable, and secure full-stack platform. It tackles the complex domain of algorithmic trading by combining a user-friendly, AI-driven interface with a powerful, containerized trading engine.

The focus is on creating a professional-grade tool that is accessible to a broad audience, blending sophisticated backend technology with a cutting-edge, data-first user experience.
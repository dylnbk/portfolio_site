---
title: "Inventory & Event Management System"
date: "2025-08-20T09:30:00.000Z"
projectType: "Full-Stack App"
technologies:
  - "React"
  - "Node.js"
  - "Express"
  - "PostgreSQL"
  - "Sequelize"
  - "JWT"
  - "Tailwind CSS"
  - "React Query"
description: "A comprehensive full-stack application for managing master stock, production ingredients, event-based inventory, sales, and analytics."
longDescription: |
  # Full-Scale Inventory & Event Management Solution

  This project solved a real-world, complex business need. It combines a modern frontend technology stack with a robust, secure, and scalable backend. The application is currently being used by a small business to help them with their unique roaming market and event based sales structure.
  
  ### Core Functionality
  
  - **Dual Inventory System**: Manages both master product stock and the raw ingredients required for production.
  - **Recipe Management**: Defines product recipes, automatically deducting ingredient quantities from production stock.
  - **Event-Based Stock Allocation**: Create events and allocate specific product quantities, tracking inventory and sales separately for each event.
  - **Sales Tracking & Analytics**: Record sales transactions at events and visualize performance with a dashboard powered by Chart.js.
  - **User & Role Management**: Simple whitelist login system with admin and staff roles for access control.
  
  ### Architecture Design
  
  The system is built on a modern, decoupled client-server architecture:
  - **Frontend**: A single-page application (SPA) built with React, using React Router for navigation and React Query for efficient server-state management, caching, and data fetching.
  - **Backend**: A RESTful API built with Node.js and Express, providing endpoints for all CRUD operations.
  - **Database**: A relational PostgreSQL database with a well-defined schema, managed by the Sequelize ORM for data modeling and migrations.
  - **Authentication**: A secure authentication strategy using Passport.js and JSON Web Tokens (JWT) for session management and protecting API routes.
  
  ### DevOps Integration
  
  - **Container-Ready**: The application is structured for easy containerization with Docker.
  - **Cloud Deployment**: Pre-configured for seamless deployment to modern cloud platforms:
    - **Currently:** Full stack deployment on Render (private)
  - **Environment Configuration**: Clear separation of development and production environments using `.env` files.
repositoryUrl: "https://github.com/dylnbk"
liveDemoUrl: ""
status: "Completed"
featured: true
tags:
  - "react"
  - "nodejs"
  - "full-stack"
  - "postgresql"
  - "sequelize"
  - "inventory-management"
challenges: |
  
  ### Complex Database Schema
  Designing the relational database schema to accurately model the relationships between master stock, production ingredients, recipes, event-specific stock, and sales was a significant challenge that required careful planning to ensure data integrity.
  
  ### Master vs Production Stock Considerations
  Designing the relationship between master stock, production ingredients and event allocations with sales tracking, presented significant logical and technical design considerations.
  
lessonsLearned: |
  
  ### Decoupled Architecture Best Practices
  - A decoupled frontend and backend is a highly scalable and maintainable pattern. It allows for independent deployment cycles (e.g. frontend and backend separation) and enabled me to work on different parts of the stack simultaneously.
  
  ### Render Deployment and Postgres
  - The first time I have built something with Postgres, and my first deployment to Render, gave me the oppertunity to learn a lot about how the frontend, backend and database is configured along with the typical workflow for a full stack web application.
---
Test End
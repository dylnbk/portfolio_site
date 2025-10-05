---
title: "Internal Knowledge Base & Ticketing"
date: "2025-09-01T11:00:00.000Z"
projectType: "Full-Stack App"
technologies:
  - "Next.js"
  - "TypeScript"
  - "Firebase"
  - "Google Gemini"
  - "Google Genkit"
  - "Tailwind CSS"
  - "shadcn/ui"
description: "An internal chat application with integrated ticket formatting, using a private markdown RAG knowledge base for contextual AI responses."
longDescription: |
  # Internal AI Knowledge Base & Ticketing System
  
  A modern, Next.js-based AI chat application designed as an internal tool to provide instant support from a private knowledge base, with an integrated ticketing formatting.

  This project was created as an internal tool, leveraging AI to create an efficient, context-aware support system.
  
  ### Core Functionality
  
  - **Contextual AI Assistant**: Leverages Google Gemini and a local knowledge base (`/docs` markdown files) to provide accurate, context-aware answers to user queries.
  - **Integrated Ticketing**: A slide-up form within the chat interface allows users to quickly create standardised ticket formats.
  - **Real-Time Streaming**: AI responses are streamed in real-time, providing an interactive and responsive user experience.
  - **Secure Authentication**: Firebase Authentication ensures that only domain authorized internal users can access the application.
  - **Modern UI/UX**: Features a clean, mobile-first interface with light/dark modes and a minimalist, monochrome design.
  - **Analytics Page**: A simple analytics page provides an overview of user engagement and utilisation, including an estimated cost calculation.
  
  ### Architecture Design
  
  The application is built with a modern, type-safe, full-stack architecture:
  - **Frontend**: A highly interactive SPA built with Next.js 15 (App Router), TypeScript, and Tailwind CSS. UI components are from the shadcn/ui library for consistency and accessibility.
  - **AI Orchestration**: Google Genkit is used to define, manage, and test the AI flows, including the Retrieval-Augmented Generation (RAG) pattern that sources information from local markdown files.
  - **Backend & Database**: Firebase serves as the serverless backend, providing user authentication and data persistence for chat history and tickets (Firestore).
  - **Knowledge Base**: A simple and effective RAG implementation reads directly from a directory of markdown files, making the knowledge base easy to update and maintain by non-developers.
repositoryUrl: ""
liveDemoUrl: ""
status: "Completed"
featured: true
tags:
  - "nextjs"
  - "ai"
  - "rag"
  - "firebase"
  - "google-gemini"
  - "genkit"
  - "typescript"
challenges: |
  
  ### UI/UX for Ticketing
  Designing and developing the animated, ticketing form to feel like a natural extension of the chat interface required state management and CSS animations to create a smooth, non-disruptive user experience.
  
  ### Real-Time Response Streaming
  Handling real-time data streams from the AI service on the frontend required careful implementation of asynchronous logic to render the response as it arrived, ensuring the UI remained responsive and interactive.
  
lessonsLearned: |
  
  ### RAG
  - For internal tools with a controlled and well-defined set of documents, a simple, file-based RAG system is a suitable and cost-effective solution. It avoids the complexity and overhead of setting up and maintaining a dedicated vector database or fine tuning a bespoke model.
  
  ### Component-Driven UI Development
  - Leveraging a component library like shadcn/ui, built on top of Radix UI, dramatically accelerates frontend development. It provides a solid foundation of accessible, themeable, and easily composable components, allowing the focus to remain on application logic and UX.
---

This project serves as a powerful internal tool, demonstrating how modern AI and web technologies can be combined to create efficient, context-aware support systems.

The architecture emphasizes maintainability, scalability, and a high-quality user experience, providing a robust solution for internal knowledge sharing and service requests.
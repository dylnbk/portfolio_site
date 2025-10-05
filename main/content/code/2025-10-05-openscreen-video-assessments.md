---
title: "OpenScreen AI Powered Video Screening"
date: "2025-10-05T10:00:00.000Z"
projectType: "Full-Stack App"
technologies:
  - "Next.js"
  - "React"
  - "Firebase"
  - "Google Gemini"
  - "Stripe"
  - "Tailwind CSS"
  - "TypeScript"
description: "An open-source video screening platform that uses AI to analyze and score video responses for recruitment, education, and assessments."
longDescription: |
  # AI-Powered Video Screening Platform
  
  OpenScreen is a scalable, open-source video screening platform designed for assessment needs. It leverages optional AI to provide automated analysis and scoring of video submissions.

  This project showcases a modern, full-stack, serverless application that solves a real-world problem. The architecture emphasizes scalability, security, and maintainability, using best practices for serverless development and providing a robust foundation for an open-source platform.
  
  ### Core Functionality
  
  - **Custom Campaigns**: Create and manage purpose-specific video assessment campaigns.
  - **AI-Powered Analysis**: Optional, automatic scoring and feedback generation using Google Gemini.
  - **Flexible Scoring**: Utilize custom rubrics or let AI generate scoring criteria based on requirements.
  - **Credit-Based System**: Integrated pay-per-use model for AI features, powered by Stripe.
  - **Secure & Private**: Built-in authentication and authorization using Firebase Auth.
  
  ### Architecture Design
  
  The platform is built on a modern, serverless architecture to ensure scalability and maintainability:
  - **Frontend**: A responsive and interactive UI built with Next.js and React.
  - **Backend**: A serverless backend powered by Firebase, including Auth, Firestore, and Storage.
  - **Asynchronous AI Processing**: Firebase Cloud Functions trigger on new video uploads to perform AI analysis without blocking the user interface.
  - **Secure Payments**: Stripe Checkout and Webhooks are used for reliable and secure payment processing.
  - **Component-Based UI**: Radix UI and Tailwind CSS for a clean, accessible, and modern design system.
  
  ### DevOps Integration
  
  - **Serverless Deployment**: Hosted on Firebase App Hosting for seamless, scalable deployments.
  - **Environment Configuration**: Clear separation of development and production environments.
  - **CI/CD Ready**: The project structure is suitable for integration into automated CI/CD pipelines.
repositoryUrl: "https://github.com/dylnbk/open-screen"
liveDemoUrl: "https://openscreen.app"
status: "Completed"
featured: true
tags:
  - "nextjs"
  - "firebase"
  - "ai"
  - "google-gemini"
  - "serverless"
  - "stripe"
challenges: |
  
  ### Asynchronous AI Processing
  Implementing a non-blocking, scalable system for AI video analysis required using Firebase Cloud Functions to handle long-running tasks asynchronously, ensuring the user experience remained smooth.
  
  ### Secure Serverless Architecture
  Designing robust Firebase Security Rules for Firestore and Storage to ensure that users could only access and manage their own data, preventing unauthorized access in a multi-tenant environment.
  
  ### Payment Integration
  Integrating Stripe for a credit-based system involved handling webhook logic to reliably update user credits upon successful payments and manage different payment states.
  
lessonsLearned: |
  
  ### Serverless Patterns
  - Firebase provides an incredibly fast way to build and deploy full-stack applications, but requires an understanding of its security rules and Firestore data modeling for efficiency.
  - Asynchronous background processing with Cloud Functions was required for handling resource-intensive tasks like AI analysis without degrading frontend performance.
  
  ### AI Integration
  - The effectiveness of AI-powered analysis is heavily dependent on prompt engineering. Crafting precise, context-aware prompts for Google Gemini was crucial to achieving accurate and relevant scoring.
  
  ### Full-Stack Development
  - Next.js with the App Router provides a powerful framework for building both the frontend UI and server-side API routes, simplifying the development of complex, integrated applications.
  - A well-defined type system with TypeScript is invaluable for maintaining code quality and preventing bugs across both the frontend and backend (Cloud Functions).
---
Test End
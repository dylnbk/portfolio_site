---
title: "Multi Model AI Chat App"
date: "2025-06-01T12:00:00.000Z"
projectType: "Web Application"
technologies:
  - "Streamlit"
  - "Python"
  - "Firebase Firestore"
  - "OpenAI API"
  - "Google Gemini API"
  - "Anthropic Claude API"
description: "A Streamlit application consolidating OpenAI, Google, and Anthropic models into a single chat interface with persistent storage via Firebase."
longDescription: |
  # Consolidated Multi-AI Chat Platform
  
  A simple yet powerful Streamlit application that unifies major AI language models from OpenAI, Google, and Anthropic into a single, cohesive chat interface.

  By consolidating various AI models, the application provides a versatile tool for comparison and use, while its open-source nature offers a clear blueprint for developers looking to build similar multi-provider AI solutions.
  
  ### Core Functionality
  
  - **Multi-Model Support**: Seamlessly switch between OpenAI, Google, and Anthropic models.
  - **Conversation Management**: Save, load, and delete chat sessions using Firebase Firestore for persistent storage.
  - **Multimedia File Uploads**: Process images, audio, video, and documents, with support varying by the selected AI model's capabilities.
  - **Integrated Image Generation**: Generate images directly within the chat using OpenAI's DALL·E via a simple `/image` command.
  - **Secure Access**: Features optional password protection for controlled access.
  
  ### Architecture Design
  
  The application is designed for simplicity and rapid deployment:
  - **Frontend & Backend**: Streamlit serves as the all-in-one framework for both the user interface and backend logic.
  - **State Management**: Leverages Streamlit's `session_state` to maintain conversation history and application state during user interaction.
  - **Database**: Uses Firebase Firestore as a serverless NoSQL database for storing and retrieving user conversations.
  - **API Abstraction**: A unified interface handles API calls to the different AI providers, normalizing their diverse request/response structures.
  - **Secure Configuration**: Manages all sensitive API keys and credentials using Streamlit's built-in secrets management (`secrets.toml`).
  
  ### DevOps Integration
  
  - **Deployment**: Designed for easy, one-click deployment to Streamlit Cloud.
  - **Dependency Management**: All Python dependencies are managed in a `requirements.txt` file.
  - **Secure Secrets Management**: Clear instructions for local and cloud deployment to ensure API keys are never exposed in the repository.
repositoryUrl: "https://github.com/dylnbk/chatty-v2"
liveDemoUrl: "https://chatty-demo.streamlit.app/"
status: "Completed"
featured: true
tags:
  - "streamlit"
  - "python"
  - "generative-ai"
  - "openai"
  - "gemini"
  - "claude"
  - "firebase"
challenges: |
  
  ### Unified API Interface
  Creating a single, consistent interface to handle the different request formats, response structures, and file upload capabilities for three distinct AI providers (OpenAI, Google, Anthropic) required significant abstraction.
  
  ### Streamlit State Management
  Managing conversation state effectively in Streamlit, which re-runs the entire script on each user interaction, necessitated careful and deliberate use of `st.session_state` to ensure a smooth and persistent chat experience.
  
  ### Secure Credential Handling
  Using a key conversion script to allow for Firebase integration of its service account key with Stremalit secrets.
  
lessonsLearned: |
  
  ### API Abstraction Patterns
  - Building an abstraction layer to normalize interactions with different external APIs is a powerful technique that makes the application cleaner and far easier to extend with new models or providers in the future.
  
  ### Rapid Prototyping with Streamlit
  - Streamlit is an exceptionally effective tool for rapidly building and deploying AI and data-centric web applications. However, understanding its execution model and state management patterns is crucial for building anything beyond a simple script.
  
  ### Serverless Database Integration
  - Integrating a serverless database like Firebase Firestore with a Streamlit application is a highly effective pattern. It provides robust, persistent storage without the complexity of managing a traditional database server, making it ideal for fast-paced development.
---
Test End
# Portfolio Site

Personal portfolio website with AI chat assistant and speech functionality.

## Development Setup

```bash
cd main
npm install
netlify dev
```

Visit `http://localhost:8888`

## Production Deployment

### Netlify (Recommended)
1. Connect repository to Netlify
2. Build settings are configured in `netlify.toml`
3. Set environment variables in Netlify dashboard

### Manual Build
```bash
cd main
npm run build
```

Deploy the `dist` folder to any static hosting service.

## Features

- AI-powered chat assistant
- Voice interaction with speech recognition
- Responsive design with dark/light/party themes
- Contact form integration
- Links to portfolio work

## Environment Variables

Required for production:
- `OPENAI_API_KEY` - OpenAI API key for chat functionality

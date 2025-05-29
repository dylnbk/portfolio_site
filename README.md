# Portfolio Site

Personal portfolio website with AI chat assistant, speech functionality, and integrated content management system.

## Development Setup

```bash
cd main
npm install
netlify dev
```

Visit `http://localhost:8888`

## Content Management

### Adding Content
Access the CMS admin at `/admin` to manage portfolio content:
- **Music**: Upload tracks with metadata and descriptions
- **Art**: Add digital artwork with process notes and pricing
- **Photos**: Upload photographs with technical details and settings
- **Code**: Document projects with technologies and implementation details

### Local Content Development
Content files are stored in `main/content/[type]/` as markdown files with frontmatter metadata. Update `main/data/data/[type]Data.js` to register new content files.

## Production Deployment

### Netlify (Recommended)
1. Connect repository to Netlify
2. Build settings are configured in `netlify.toml`
3. Set environment variables in Netlify dashboard
4. Enable Git Gateway for CMS authentication
5. Configure Netlify Identity for admin access

### Manual Build
```bash
cd main
npm run build
```

Deploy the `dist` folder to any static hosting service.

## Features

- **Content Management**: Decap CMS integration for easy content updates
- **Portfolio Sections**: Music, Art, Photos, and Code project showcases
- **AI Chat Assistant**: OpenAI-powered conversational interface
- **Voice Interaction**: Speech recognition and synthesis
- **Responsive Design**: Dark/light mode with mobile optimization
- **Contact Integration**: Built-in contact form and chat functionality

## Environment Variables

Required for production:
- `OPENAI_API_KEY` - OpenAI API key for chat functionality

## Project Structure

```
main/
├── admin/                 # CMS admin interface
├── content/              # Markdown content files
│   ├── art/             # Digital artwork posts
│   ├── music/           # Music track posts  
│   ├── photos/          # Photography posts
│   └── code/            # Code project posts
├── assets/uploads/       # Media file storage
├── components/          # UI components and styles
├── data/               # Content configuration
└── netlify.toml        # Deployment configuration

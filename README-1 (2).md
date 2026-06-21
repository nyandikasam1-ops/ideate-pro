# Ideate Pro

AI-powered idea enhancer. Single-page frontend + Netlify Function backend, using Groq for inference.

## File structure (flat, no nested public folder)

```
ideate-pro/
├── netlify.toml              # publish = "." (repo root), functions = "netlify/functions"
├── index.html                # the whole frontend, lives at repo root
└── netlify/
    └── functions/
        └── enhance.js         # backend proxy — holds the API key, calls Groq
```

This is intentionally flatter than a typical project. The previous version used a
`public/` folder for the frontend, which kept failing to deploy ("Deploy directory
'public' does not exist") due to upload issues through GitHub's mobile web editor.
Putting `index.html` straight at the repo root removes that failure point — the
root always exists, so there's nothing to misconfigure.

## Setup (fresh start)

### 1. Get a Groq API key
console.groq.com/keys → sign up → create a key. If you've pasted a key in chat or
a screenshot before, treat it as compromised — revoke it and make a new one.

### 2. Create a fresh GitHub repo
Delete the old `ideate-pro` repo if it's tangled up, then create a new empty one
with the same name (or a new name if you prefer a clean slate).

### 3. Add the 3 files via GitHub's web upload
- Repo home → "uploading an existing file" → drag in `index.html` and `netlify.toml`
  directly (they sit at the repo root, no folder needed)
- Then **Add file → Create new file** → type `netlify/functions/enhance.js` as the
  filename (the slashes auto-create the folders) → paste in the content → commit

### 4. Connect to Netlify
- app.netlify.com → Add new site → Import an existing project → pick the repo
- Leave build settings as detected from `netlify.toml` → Deploy site

### 5. Add your Groq key
Site configuration → Environment variables → Add variable
- Key: `GROQ_API_KEY`
- Value: your Groq key

### 6. Redeploy
Deploys tab → Trigger deploy → **Clear cache and deploy site** (important: clear
cache, not just a regular deploy, so it doesn't reuse the old broken build)

### 7. Test
Open your `.netlify.app` URL, type an idea, click "Enhance My Idea".

## Switching models or providers later

Edit `netlify/functions/enhance.js` — change the `model` field for a different Groq
model, or swap the fetch URL/auth header entirely to use Anthropic, OpenAI, or
Gemini instead. The frontend never needs to change; it only talks to your own
`/.netlify/functions/enhance` endpoint.

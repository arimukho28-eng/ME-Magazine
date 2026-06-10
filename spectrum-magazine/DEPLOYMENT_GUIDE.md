# 🚀 SPECTRUM Magazine — Deployment Guide
### How to get your website live on Vercel (no coding knowledge needed)

---

## What's in this folder

| File | What it does |
|------|-------------|
| `index.html` | The main webpage |
| `style.css` | All the visual styling / design |
| `app.js` | The flipbook PDF viewer logic |
| `vercel.json` | Tells Vercel how to host the site |

---

## STEP 1 — Create a GitHub account (free)

1. Go to **https://github.com**
2. Click **Sign up** → enter your email, create a password
3. Verify your email

---

## STEP 2 — Upload your website files to GitHub

1. After logging in, click the **green "New"** button (top left)
2. Name your repository: `spectrum-magazine`
3. Make sure **"Public"** is selected
4. Click **"Create repository"**
5. On the next page, click **"uploading an existing file"**
6. Drag ALL 4 files into the upload box:
   - `index.html`
   - `style.css`
   - `app.js`
   - `vercel.json`
7. Scroll down, click **"Commit changes"**

✅ Your files are now on GitHub!

---

## STEP 3 — Deploy to Vercel (free)

1. Go to **https://vercel.com**
2. Click **"Sign Up"** → choose **"Continue with GitHub"**
3. Allow Vercel to access your GitHub
4. Click **"Add New Project"**
5. Find `spectrum-magazine` in the list → click **"Import"**
6. Leave all settings as default
7. Click **"Deploy"**
8. Wait ~30 seconds ⏳

✅ Your site is now LIVE! Vercel gives you a link like:
**https://spectrum-magazine-yourname.vercel.app**

---

## STEP 4 — How to use the flipbook

When someone visits your website:
1. They scroll down to the **"Read the Magazine"** section
2. Click **"Choose PDF"** or drag-and-drop the magazine PDF
3. The flipbook opens — they can flip through pages like a real book!
4. Works on mobile too (swipe left/right to flip pages)

> 💡 The PDF never leaves the visitor's browser — it's 100% private and secure.

---

## STEP 5 — Adding a permanent PDF (optional, for when magazine is ready)

If you want the PDF to auto-load without the upload button:

1. Add your PDF file to the GitHub repository (name it `magazine.pdf`)
2. Open `index.html` in GitHub (click the file → pencil icon to edit)
3. Find this line:
   ```
   <div class="flipbook-upload-zone" id="uploadZone">
   ```
4. Add this line just after the `<script src="app.js"></script>` at the bottom:
   ```html
   <script>
     window.addEventListener('load', () => autoLoadPDF('magazine.pdf'));
   </script>
   ```
5. In `app.js`, add this function anywhere:
   ```javascript
   async function autoLoadPDF(url) {
     const res = await fetch(url);
     const buf = await res.arrayBuffer();
     pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
     totalPages = pdfDoc.numPages;
     totalPagesEl.textContent = totalPages;
     currentSpread = 1;
     uploadZone.style.display = 'none';
     flipbookViewer.style.display = 'flex';
     await buildThumbnails();
     await renderSpread(1);
   }
   ```

---

## STEP 6 — Updating your website later

Whenever you want to change anything:
1. Edit the files on your computer
2. Go to your GitHub repository
3. Click on the file you want to update → pencil icon → paste new content → **Commit**
4. Vercel automatically re-deploys in ~30 seconds! 🎉

---

## Customizing the website

| What to change | Where to find it |
|----------------|-----------------|
| Faculty names/quotes | `index.html` — search for "Dr. Tridibesh" |
| Colors | `style.css` — change the hex values in `:root { }` at the top |
| College/dept name | `index.html` — search for "KGEC" |
| Add more faculty | Copy a `<div class="message-card">` block in `index.html` |

---

## Need help?

- Vercel docs: https://vercel.com/docs
- GitHub upload guide: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository

---

*Built for SPECTRUM — Department of Mechanical Engineering, KGEC '26*

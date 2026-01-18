import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { put, list } from '@vercel/blob';
import path from 'path';

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'];
const isImage = (pathname: string) => IMAGE_EXTS.includes(path.extname(pathname).toLowerCase());

const app = new Hono();

app.use('*', cors());

app.get('/', (c) => c.text('Hello Hono!'));

// for the redirect
app.get('/upload', async (c) => {
    return c.html(`<!doctype html>
        
        <html>
        <head>
        <script>
        location.href = "https://findyourcut.vercel.app/gallery.html"
        </script>
        </head>
        </html>`);
});

// Upload handler -> saves to Vercel Blob
app.post('/upload', async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['img-file'] as File | undefined;
        if (!file) return c.json({ error: 'No file uploaded' }, 400);

        const buf = Buffer.from(await file.arrayBuffer());
        const blobName = `${body['img-title'] || 'untitled'}.png`;

        const { url } = await put(blobName, buf, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        console.log('Image saved to Blob:', url);
        return c.redirect('/upload');
    } catch (err) {
        console.error('Error writing image:', err);
        return c.json({ error: 'Upload failed' }, 500);
    }
});

// Random image from Blob
app.get('/generate-img', async (c) => {
    const { blobs } = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
    const images = blobs.filter((b) => isImage(b.pathname));
    if (images.length === 0) return c.json({ error: 'failed to work, sry' }, 500);

    const random = images[Math.floor(Math.random() * images.length)];
    return c.json({ location: random.url });
});

// Gallery from Blob
app.get('/gallery', async (c) => {
    const { blobs } = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
    const images = blobs.filter((b) => isImage(b.pathname));

    const files = images.map((b) => ({
        name: path.parse(b.pathname).name,
        location: b.url,
    }));

    return c.json({ files });
});

serve(
    {
        fetch: app.fetch,
        port: 45827,
    },
    (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
        console.log(process.cwd());
    },
);
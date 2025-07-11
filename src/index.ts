import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono, type Context } from 'hono';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { cors } from 'hono/cors';
import path from 'path';

const app = new Hono();

// Serve the images in the image folder
app.use('/images/*', serveStatic({ root: './' }));

app.use('*', cors());

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

// Upload handler
app.post('/upload', async (c) => {
	const body = await c.req.parseBody();
	const file = body['img-file'] as File;
	const bFile = await file.arrayBuffer();
	const newFile = Buffer.from(bFile);

	fs.writeFile(`./images/${body['img-title']}.png`, newFile, (err) => {
		if (err) {
			console.error('Error writing image:', err);
		} else {
			console.log('Image saved successfully!');
		}
	});
});

// For the random images
app.get('/generate-img', async (c) => {
	// url of the page
	const url = new URL(c.req.url);
	const originUrl = url.origin;
	const files = await fs.promises.readdir('./images');
	if (files.length === 0) {
		return c.json({ error: 'failed to work, sry' }, 500);
	}
	// The random index
	const index = Math.floor(Math.random() * files.length);
	const randomFile = files[index];
	return c.json({
		location: `${originUrl}/images/${randomFile}`,
	});
});
app.get('/gallery', async (c) => {
	const url = new URL(c.req.url);
	const originUrl = url.origin;

	const files = await fs.promises.readdir('./images');
	const fileData = files.map((file) => {
		const nameWithoutExt = path.parse(file).name;
		return {
			name: nameWithoutExt,
			location: `${originUrl}/images/${file}`,
		};
	});

	return c.json({ files: fileData });
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

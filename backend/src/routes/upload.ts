import { Hono } from 'hono'
import { write } from 'bun'

const uploadRoutes = new Hono()

uploadRoutes.post('/', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded' }, 400)
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'Only image files are allowed' }, 400)
    }

    // Generate unique filename
    const extension = file.name.split('.').pop()
    const filename = `${crypto.randomUUID()}.${extension}`
    const path = `uploads/${filename}`

    // Save file
    await write(path, file)

    // Return URL (relative path)
    return c.json({ 
      url: `/uploads/${filename}`,
      filename 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ error: 'Failed to upload file' }, 500)
  }
})

export { uploadRoutes }

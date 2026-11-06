import crypto from 'node:crypto'
import { mkdir, readFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import express from 'express'
import multer from 'multer'
import { fileURLToPath } from 'node:url'

const uploadRoutes = express.Router()
const uploadsDirectory = fileURLToPath(new URL('../uploads/', import.meta.url))
const allowedTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp']
])

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    mkdir(uploadsDirectory, { recursive: true })
      .then(() => callback(null, uploadsDirectory))
      .catch(callback)
  },
  filename: (req, file, callback) => {
    callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.get(extension) !== file.mimetype) {
      const error = new Error('Only JPG, PNG, and WEBP images are allowed')
      error.code = 'INVALID_IMAGE_TYPE'
      return callback(error)
    }
    callback(null, true)
  }
})

function isValidImage(bytes, mimetype) {
  if (mimetype === 'image/jpeg') {
    return (
      bytes.length >= 4 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff &&
      bytes[bytes.length - 2] === 0xff &&
      bytes[bytes.length - 1] === 0xd9
    )
  }
  if (mimetype === 'image/png') {
    return (
      bytes.length >= 20 &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      bytes.includes(Buffer.from('IEND'))
    )
  }
  return (
    mimetype === 'image/webp' &&
    bytes.length >= 20 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP' &&
    bytes.readUInt32LE(4) + 8 === bytes.length
  )
}

uploadRoutes.post('/', upload.single('image'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).send({
      status: 400,
      error: true,
      errorMsg: 'Select an image to upload'
    })
  }

  try {
    const bytes = await readFile(req.file.path)
    if (!isValidImage(bytes, req.file.mimetype)) {
      await unlink(req.file.path)
      return res.status(400).send({
        status: 400,
        error: true,
        errorMsg: 'The uploaded file is not a valid JPG, PNG, or WEBP image'
      })
    }

    res.status(201).send({
      status: 201,
      message: 'Image uploaded successfully',
      image: `/uploads/${req.file.filename}`,
      error: false
    })
  } catch (error) {
    next(error)
  }
})

uploadRoutes.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).send({
      status: 413,
      error: true,
      errorMsg: 'Image must be 5 MB or smaller'
    })
  }
  if (error.code === 'INVALID_IMAGE_TYPE' || error instanceof multer.MulterError) {
    return res.status(400).send({
      status: 400,
      error: true,
      errorMsg: error.code === 'INVALID_IMAGE_TYPE'
        ? error.message
        : 'Upload one image using the image field'
    })
  }

  console.error('Could not upload image:', error)
  res.status(500).send({
    status: 500,
    error: true,
    errorMsg: 'Could not upload image'
  })
})

export default uploadRoutes

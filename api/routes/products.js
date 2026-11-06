import express from 'express'
import Product from '../models/product.js'

const productRoutes = express.Router()

productRoutes.get('/', async (req, res) => {
  try {
    const products = await Product.find()
    res.status(200).send({ status: 200, data: products, error: false })
  } catch (error) {
    console.error('Could not fetch products:', error)
    res.status(500).send({
      status: 500,
      data: null,
      error: true,
      errorMsg: 'Could not fetch products'
    })
  }
})

productRoutes.post('/', async (req, res) => {
  const { name, description = '', price, image = '' } = req.body || {}

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > 120 ||
    typeof description !== 'string' ||
    description.length > 2000 ||
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price < 0 ||
    typeof image !== 'string' ||
    (image && !/^\/uploads\/[A-Za-z0-9._-]+$/.test(image))
  ) {
    return res.status(400).send({
      status: 400,
      data: null,
      error: true,
      errorMsg: 'Provide a name, description, non-negative price, and valid image path'
    })
  }

  try {
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price,
      image
    })
    res.status(201).send({ status: 201, data: product, error: false })
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).send({
        status: 400,
        data: null,
        error: true,
        errorMsg: 'Invalid product details'
      })
    }
    console.error('Could not create product:', error)
    res.status(500).send({
      status: 500,
      data: null,
      error: true,
      errorMsg: 'Could not create product'
    })
  }
})

export default productRoutes

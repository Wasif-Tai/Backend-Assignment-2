import express from 'express'
import Product from '../models/product.js'

const productRoutes = express.Router()

function getProductDetails(body = {}) {
  const { name, description = '', price, image = '' } = body
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
    return null
  }

  return {
    name: name.trim(),
    description: description.trim(),
    price,
    image
  }
}

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
  const productDetails = getProductDetails(req.body)
  if (!productDetails) {
    return res.status(400).send({
      status: 400,
      data: null,
      error: true,
      errorMsg: 'Provide a name, description, non-negative price, and valid image path'
    })
  }

  try {
    const product = await Product.create(productDetails)
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

productRoutes.put('/:id', async (req, res) => {
  const productDetails = getProductDetails(req.body)
  if (!productDetails) {
    return res.status(400).send({
      status: 400,
      data: null,
      error: true,
      errorMsg: 'Provide a name, description, non-negative price, and valid image path'
    })
  }

  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productDetails,
      { new: true, runValidators: true }
    )
    if (!product) {
      return res.status(404).send({
        status: 404,
        data: null,
        error: true,
        errorMsg: 'Product not found'
      })
    }
    res.status(200).send({ status: 200, data: product, error: false })
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).send({
        status: 400,
        data: null,
        error: true,
        errorMsg: 'Invalid product details'
      })
    }
    console.error('Could not update product:', error)
    res.status(500).send({
      status: 500,
      data: null,
      error: true,
      errorMsg: 'Could not update product'
    })
  }
})

productRoutes.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      return res.status(404).send({
        status: 404,
        data: null,
        error: true,
        errorMsg: 'Product not found'
      })
    }
    res.status(200).send({ status: 200, data: null, error: false })
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).send({
        status: 400,
        data: null,
        error: true,
        errorMsg: 'Invalid product id'
      })
    }
    console.error('Could not delete product:', error)
    res.status(500).send({
      status: 500,
      data: null,
      error: true,
      errorMsg: 'Could not delete product'
    })
  }
})

export default productRoutes

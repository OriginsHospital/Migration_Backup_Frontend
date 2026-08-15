import Razorpay from 'razorpay'
import shortid from 'shortid'

// Initialize razorpay object
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_KEY,
})

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Parse the JSON body from the request
      const data = req.body

      const amount = data.amount // amount in paisa, here INR 1
      const currency = 'INR'
      const options = {
        amount: amount.toString(),
        currency,
        receipt: shortid.generate(),
        notes: {
          paymentFor: 'example_ebook',
          userId: data.userId,
          productId: data.productId,
        },
      }

      const order = await razorpay.orders.create(options)

      // Respond with the order details
      res.status(200).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      })
    } catch (error) {
      console.error('Error creating Razorpay order:', error)
      res.status(500).json({
        error: 'Error creating Razorpay order',
      })
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

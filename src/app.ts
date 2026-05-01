import Express from 'express'

const app = Express()

app.get('/', (req, res) => {
    res.send({ status: 'ok' })
})

export default app;
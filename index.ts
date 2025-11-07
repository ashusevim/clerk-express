import 'dotenv/config'
import express from "express"
import { clerkMiddleware, clerkClient, requireAuth, getAuth } from '@clerk/express'

const app = express()
const port = 3000

// Adding clerk middleware to handle authentication
app.use(clerkMiddleware())

// public route - landing page
app.get('/', async (req, res) => {
    const { userId } = getAuth(req)

    if (userId) {
        return res.redirect('/protected')
    }

    res.send(`
        <h1>Welcome! Please sign in</h1>
        <p>Sign in with:</p>
        <a href="/sign-in/google">Google</a>
        <a href="/sign-in/github">GitHub</a>
    `)
})

app.get('/sign-in', (req, res) => {
    const signInUrl = `https://enabling-seagull-97.clerk.accounts.dev/sign-in?redirect_url=${encodeURIComponent('http://localhost:3000/protected')}`
    res.redirect(signInUrl)
})

app.get('/protected', requireAuth(), async (req, res) => {
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({
            error: "unauthorized"
        })
    }

    const user = await clerkClient.users.getUser(userId);

    return res.json({
        user: {
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl
        }
    })
})

// sign out route
app.get('/sign-out', (req, res) => {
    // clear clerk session
    const signOutUrl = `https://enabling-seagull-97.clerk.accounts.dev/sign-out?redirect_url=${encodeURIComponent('http://localhost:3000')}`
    res.redirect(signOutUrl)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

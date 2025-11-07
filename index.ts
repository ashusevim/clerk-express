import 'dotenv/config'
import express from "express"
import { clerkMiddleware, clerkClient, requireAuth, getAuth } from '@clerk/express'

const app = express()
const port = process.env.PORT || 3000

const CLERK_FRONTEND_URL = process.env.CLERK_FRONTEND_URL || 'https://enabling-seagull-97.clerk.accounts.dev'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

app.use(clerkMiddleware())

app.get('/', async (req, res) => {
    const { userId } = getAuth(req)

    if (userId) {
        return res.redirect('/protected')
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Clerk OAuth</title>
            <style>
                body { font-family: Arial; text-align: center; padding: 50px; }
                .button { 
                    display: inline-block; 
                    padding: 10px 20px; 
                    margin: 10px;
                    background: #4285f4; 
                    color: white; 
                    text-decoration: none;
                    border-radius: 5px;
                }
                .github { background: #24292e; }
            </style>
        </head>
        <body>
            <h1>🔐 Welcome to Clerk OAuth</h1>
            <p>Choose your sign-in method:</p>
            <a href="/sign-in?strategy=oauth_google" class="button">
                Sign in with Google
            </a>
            <a href="/sign-in?strategy=oauth_github" class="button github">
                Sign in with GitHub
            </a>
            <br><br>
            <a href="/sign-in" class="button" style="background: #6c757d;">
                All Sign-in Options
            </a>
        </body>
        </html>
    `)
})

app.get('/sign-in', (req, res) => {
    const { strategy } = req.query
    let signInUrl = `${CLERK_FRONTEND_URL}/sign-in?redirect_url=${encodeURIComponent(`${BACKEND_URL}/protected`)}`

    if (strategy) {
        signInUrl += `&strategy=${strategy}`
    }

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

    return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Protected Page</title>
            <style>
                body{
                    font-family: Arial;
                    text-align: center;
                    padding: 50px;
                }
                .user-info{
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    display: inline-block;
                    margin: 20px;
                }
                img { border-radius: 50%; }
            </style>
        </head>
        <body>
            <h1> Welcome, ${user.username || 'User'}!</h1>
            <div class="user-info">
                <img src="${user.imageUrl}" width="100" alt="Profile">
                <h2>${user.firstName} ${user.lastName}</h2>
                <p>${user.emailAddresses[0]?.emailAddress}</p>
                <p>${user.id}</p>
            </div>
            <br>
            <a href="/sign-out" style="color: red;">Sign Out</a>
        </body>
        </html>
    `)
})

app.get('/sign-out', (req, res) => {
    const signOutUrl = `https://enabling-seagull-97.clerk.accounts.dev/sign-out?redirect_url=${encodeURIComponent('http://localhost:3000')}`
    res.redirect(signOutUrl)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

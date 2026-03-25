# Deployment Guide for Chatting App

Your application is now ready to be deployed to a live server. We recommend using **Render.com** because it is free, easy to set up, and supports Node.js.

## Prerequisites
1.  A [GitHub](https://github.com/) account.
2.  A [Render.com](https://render.com/) account (you can sign up using your GitHub account).

## Step 1: Push your code to GitHub
If you haven't already, you need to push your project to a GitHub repository:
1.  Initialize git if not already done: `git init`
2.  Add your files: `git add .`
3.  Commit your changes: `git commit -m "Prepare for deployment"`
4.  Create a new repository on GitHub.
5.  Follow the instructions on GitHub to push your local repository:
    ```bash
    git remote add origin <your-github-repo-url>
    git branch -M main
    git push -u origin main
    ```

## Step 2: Deploy to Render.com
1.  Log in to [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub account and select the repository you just created.
4.  In the configuration page:
    - **Name**: Choose a name for your app (e.g., `my-chatting-app`).
    - **Runtime**: `Node`.
    - **Build Command**: `npm install` (though you have no dependencies yet, this is standard).
    - **Start Command**: `npm start`.
5.  Click **Deploy Web Service**.

## Step 3: Access your Live App
Once the deployment is finished, Render will provide you with a URL (e.g., `https://my-chatting-app.onrender.com`). You can share this link with others to start chatting!

> [!IMPORTANT]
> Since this app uses local JSON files for storage, data (messages and users) will be reset whenever the server restarts on Render (e.g., when you push new code). For a permanent solution, you would eventually want to connect a database like MongoDB or PostgreSQL.

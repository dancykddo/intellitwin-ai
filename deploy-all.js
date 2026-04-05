/**
 * IntelliTwin Universal Deployer
 * This script automates:
 * 1. Git Initialization & Commit
 * 2. GitHub Repository Creation (via gh CLI)
 * 3. Railway Database Provisioning (via railway CLI)
 * 4. Firebase Storage Setup (via firebase-tools)
 * 5. Vercel Deployment & Variable Sync (via vercel CLI)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const run = (cmd) => {
  console.log(`\x1b[36m> Running: ${cmd}\x1b[0m`);
  try {
    return execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`\x1b[31mError running command: ${cmd}\x1b[0m`);
    process.exit(1);
  }
};

const main = async () => {
  console.log("\x1b[35m=== IntelliTwin Production Automation ===\x1b[0m");

  // 1. Initial Git Sync
  console.log("\x1b[33m\n[1/5] Syncing Local Repository...\x1b[0m");
  run("git init");
  run("git add .");
  try {
    run('git commit -m "IntelliTwin Automated Deployment"');
  } catch (e) {
    console.log("No changes to commit.");
  }
  run("git branch -M main");

  // 2. GitHub Orchestration
  console.log("\x1b[33m\n[2/5] Creating GitHub Repository...\x1b[0m");
  console.log("\x1b[32mAction Required: If prompted, please complete the browser-based OAuth login.\x1b[0m");
  try {
     run("npx -y gh auth login --web");
     run("npx -y gh repo create intellitwin --public --source=. --remote=origin --push");
  } catch (e) {
     console.log("GitHub repository might already exist or push failed. Continuing...");
  }

  // 3. Railway Database Provisioning
  console.log("\x1b[33m\n[3/5] Provisioning Cloud Database (Railway)...\x1b[0m");
  console.log("\x1b[32mAction Required: If prompted, please login to Railway and confirm project creation.\x1b[0m");
  try {
    run("npx -y @railway/cli login");
    // Attempting to create project non-interactively if possible, or guiding the user
    console.log("Initializing new Railway project...");
    run("npx -y @railway/cli init"); 
    run("npx -y @railway/cli add MySQL");
  } catch (e) {
    console.log("Railway setup partially failed or already exists. Continuing...");
  }
  
  // Note: For a fully automated schema apply, use:
  // run("npx -y @railway/cli run mysql -h <host> -u <user> -p<pass> < schema.sql");
  // However, Railway handles DB creation; schema push usually needs connection strings.
  console.log("\x1b[32mMySQL database successfully provisioned on Railway!\x1b[0m");

  // 4. Firebase Storage Setup
  console.log("\x1b[33m\n[4/5] Initializing Firebase Storage...\x1b[0m");
  console.log("\x1b[32mAction Required: Login to Firebase if prompted.\x1b[0m");
  run("npx -y firebase-tools login");
  run("npx -y firebase-tools init storage");
  
  // 5. Vercel Deployment & Sync
  console.log("\x1b[33m\n[5/5] Deploying to Vercel (Production)...\x1b[0m");
  console.log("\x1b[32mAction Required: Login to Vercel if prompted.\x1b[0m");
  try {
    run("npx -y vercel login");
    run("npx -y vercel link --yes");
    // Force deployment
    run("npx -y vercel deploy --prod --yes");
  } catch (e) {
    console.log("Vercel deployment failed or interrupted. Check your dashboard.");
  }

  console.log("\x1b[35m\n=== Deployment Complete! ===\x1b[0m");
  console.log("1. Repository: GitHub.com/<user>/intellitwin");
  console.log("2. Database: Railway.app Dashboard");
  console.log("3. Storage: Firebase.google.com Console");
  console.log("4. App URL: Vercel.com Projects");
  console.log("\x1b[32mVisit your /api/health endpoint to verify connectivity.\x1b[0m");
};

main();

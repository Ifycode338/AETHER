# GitHub Actions Token Refresh Setup Guide

## ✅ What This Does

This GitHub Actions workflow automatically:
- Runs every 30 minutes
- Generates a new Firebase access token
- Updates your Supabase Edge Function secrets
- **Completely free** - no cost at all

---

## 🔧 Setup Steps

### **Step 1: Create Google Cloud Service Account**

1. **Go to** https://console.cloud.google.com/iam-admin/serviceaccounts
2. **Select your project:** bennycare-app
3. **Click "Create Service Account"**
4. **Fill in:**
   - Service account name: `firebase-token-refresh`
   - Service account description: `Automated token refresh for Firebase`
5. **Click "Create and Continue"**
6. **Skip granting roles** (we'll add roles after)
7. **Click "Done"**

### **Step 2: Grant Required Roles**

1. **Click on the service account** you just created
2. **Go to "Keys" tab**
3. **Click "Add Key" → "Create New Key"**
4. **Select "JSON"**
5. **Click "Create"**
6. **The JSON key file will download** - save this file securely

### **Step 3: Add IAM Roles to Service Account**

1. **Go to** https://console.cloud.google.com/iam-admin/iam
2. **Select your project:** bennycare-app
3. **Find your service account:** `firebase-token-refresh@bennycare-app.iam.gserviceaccount.com`
4. **Click the pencil icon** to edit
5. **Click "Add Principal"**
6. **Enter service account email:** `firebase-token-refresh@bennycare-app.iam.gserviceaccount.com`
7. **Add these roles:**
   - `Cloud Functions Invoker`
   - `Service Account Token Creator`
8. **Click "Save"**

### **Step 4: Get Supabase Access Token**

1. **Go to** https://supabase.com/dashboard/project/chlfmkeplogbkornbwqc/settings/api
2. **Scroll down to** "Project API keys"
3. **Copy the "service_role" key** (starts with `eyJ...`)
4. **Save this securely**

### **Step 5: Push Code to GitHub**

If you haven't already:
```bash
git init
git add .
git commit -m "Add GitHub Actions token refresh workflow"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/AETHER.git
git push -u origin main
```

### **Step 6: Add Secrets to GitHub**

1. **Go to** your GitHub repository
2. **Click** "Settings" → "Secrets and variables" → "Actions"
3. **Click "New repository secret"**
4. **Add these secrets:**

**Secret 1: GCP_CREDENTIALS**
- Name: `GCP_CREDENTIALS`
- Value: Paste the entire contents of the JSON key file you downloaded in Step 2
- Click "Add secret"

**Secret 2: SUPABASE_ACCESS_TOKEN**
- Name: `SUPABASE_ACCESS_TOKEN`
- Value: Paste the Supabase service_role key from Step 4
- Click "Add secret"

### **Step 7: Enable GitHub Actions**

1. **Go to** your GitHub repository
2. **Click** "Actions" tab
3. **Click "I understand my workflows, go ahead and enable them"**

### **Step 8: Test the Workflow**

1. **Go to** "Actions" tab in your GitHub repository
2. **Click on** "Refresh Firebase Access Token" workflow
3. **Click "Run workflow"** button
4. **Select branch:** `main`
5. **Click "Run workflow"**

The workflow will:
- Generate a new Firebase access token
- Update your Supabase secrets
- Log success or failure

---

## 🎯 How It Works

**Every 30 minutes:**
1. GitHub Actions triggers automatically
2. Authenticates with Google Cloud
3. Generates a new Firebase access token
4. Updates Supabase Edge Function secrets
5. Logs the result

**Manual trigger:**
- You can also trigger it manually anytime from the Actions tab

---

## 📊 Monitoring

**To check if it's working:**
1. Go to your GitHub repository → Actions tab
2. Click on "Refresh Firebase Access Token"
3. You'll see a history of all runs
4. Green checkmark = success
5. Red X = failure (click to see error logs)

---

## 🔒 Security Notes

- **Never commit** the JSON key file to git
- **Never share** the secrets publicly
- The JSON key file is encrypted in GitHub secrets
- The Supabase service_role key has full access - keep it secure

---

## 🐛 Troubleshooting

**Workflow fails with "Authentication failed":**
- Check that GCP_CREDENTIALS is valid JSON
- Verify the service account has the required roles

**Workflow fails with "Supabase login failed":**
- Check that SUPABASE_ACCESS_TOKEN is valid
- Verify the token is the service_role key, not anon key

**Workflow doesn't run on schedule:**
- GitHub Actions has a limit of ~5 minutes delay for scheduled workflows
- Check that the workflow is enabled in Actions settings

---

## ✅ Benefits

- **Completely free** - no cost
- **Automated** - no manual intervention needed
- **Reliable** - GitHub Actions infrastructure
- **Secure** - secrets are encrypted
- **Easy to monitor** - visual dashboard

---

**Once setup is complete, your Firebase access token will be refreshed automatically every 30 minutes!** 🚀

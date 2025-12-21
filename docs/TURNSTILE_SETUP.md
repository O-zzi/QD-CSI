# Cloudflare Turnstile CAPTCHA Setup Guide

This document provides step-by-step instructions for implementing Cloudflare Turnstile CAPTCHA protection on The Quarterdeck's login and registration forms.

## Prerequisites

- Domain registered with Cloudflare or added to Cloudflare
- Cloudflare account (free tier works)
- Access to environment variables (Hostinger SSH, GitHub, or Supabase)

## Step 1: Get Turnstile Keys from Cloudflare

1. Go to [Cloudflare Turnstile Dashboard](https://dash.cloudflare.com/sign-up/turnstile)
2. Sign in to your Cloudflare account
3. Click **"Add Site"**
4. Configure your site:
   - **Site Name**: The Quarterdeck
   - **Domain**: thequarterdeck.pk (and any subdomains)
   - **Widget Mode**: Choose "Managed" (recommended for best UX)
5. Click **Create**
6. Copy your keys:
   - **Site Key** (public - safe for client-side): `0x4...`
   - **Secret Key** (private - server-side only): `0x4...`

### Test Keys (for Development)

For testing before domain setup:
- **Site Key**: `1x00000000000000000000AA` (always passes)
- **Secret Key**: `1x0000000000000000000000000000000AA` (always passes)

## Step 2: Add Environment Variables

### Option A: Hostinger VPS (via SSH)

```bash
ssh root@your-vps-ip
cd /path/to/quarterdeck
nano .env
```

Add these lines:
```env
TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

Save and restart the application:
```bash
pm2 restart quarterdeck
```

### Option B: GitHub Repository Secrets

1. Go to your GitHub repository
2. Navigate to **Settings > Secrets and variables > Actions**
3. Add two secrets:
   - `TURNSTILE_SITE_KEY`: your site key
   - `TURNSTILE_SECRET_KEY`: your secret key
4. Update your deployment workflow to pass these to the app

### Option C: Supabase (if using Supabase Edge Functions)

1. Go to Supabase Dashboard > Project Settings > Edge Functions
2. Add environment variables there

## Step 3: Frontend Implementation

The package `@marsidev/react-turnstile` is already installed.

### Update Login Form

Edit `client/src/pages/Login.tsx`:

```tsx
import { Turnstile } from '@marsidev/react-turnstile';
import { useState, useRef } from 'react';

export default function Login() {
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef(null);

  const handleSubmit = async (values) => {
    if (!turnstileToken) {
      toast({ title: "Please complete the verification" });
      return;
    }

    // Include token in login request
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...values,
        turnstileToken,
      }),
    });

    // Reset turnstile after submission
    turnstileRef.current?.reset();
    setTurnstileToken('');
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... existing form fields ... */}

      <Turnstile
        ref={turnstileRef}
        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
        onSuccess={(token) => setTurnstileToken(token)}
        onError={() => setTurnstileToken('')}
        onExpire={() => setTurnstileToken('')}
        options={{
          theme: 'dark', // matches your dark theme
          size: 'normal',
        }}
      />

      <Button type="submit" disabled={!turnstileToken}>
        Sign In
      </Button>
    </form>
  );
}
```

### Update Registration Form

Apply the same pattern to `client/src/pages/Register.tsx`.

## Step 4: Backend Verification

Edit `server/routes.ts` - add verification to login endpoint:

```typescript
// Add this helper function at the top
async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('[turnstile] Secret key not configured, skipping verification');
    return true; // Allow in development
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
          remoteip: ip,
        }),
      }
    );

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('[turnstile] Verification error:', error);
    return false;
  }
}

// Then in login route:
app.post('/api/auth/login', async (req, res) => {
  const { email, password, turnstileToken } = req.body;

  // Verify CAPTCHA first
  if (process.env.TURNSTILE_SECRET_KEY) {
    const isValidCaptcha = await verifyTurnstileToken(
      turnstileToken,
      req.ip
    );
    
    if (!isValidCaptcha) {
      return res.status(400).json({ 
        message: 'CAPTCHA verification failed. Please try again.' 
      });
    }
  }

  // ... rest of login logic
});
```

## Step 5: Add Frontend Environment Variable

Create/update `.env` file for frontend:

```env
VITE_TURNSTILE_SITE_KEY=your_site_key_here
```

Note: The `VITE_` prefix makes it available to the frontend.

## Step 6: Testing

### Local Development
1. Use test keys (always pass)
2. Verify the widget renders on login/register pages
3. Confirm form submission includes the token
4. Check backend logs for verification attempts

### Production Testing
1. Set real Cloudflare keys
2. Test from different IPs/devices
3. Verify failed attempts are blocked
4. Monitor Cloudflare dashboard for analytics

## Troubleshooting

### Widget Not Loading
- Check that `VITE_TURNSTILE_SITE_KEY` is set
- Verify domain is added to Cloudflare Turnstile settings
- Check browser console for errors

### Verification Failing
- Confirm `TURNSTILE_SECRET_KEY` is set on backend
- Check token is being sent in request body
- Verify Cloudflare API is reachable from server

### Token Expired
- Turnstile tokens are valid for 300 seconds (5 minutes)
- Call `turnstileRef.current?.reset()` to get a new token
- Consider auto-refresh on form focus

## Security Notes

- Never expose `TURNSTILE_SECRET_KEY` to the frontend
- Always verify tokens server-side before processing forms
- Consider adding Turnstile to other sensitive forms (password reset, contact)
- Monitor Cloudflare analytics for suspicious patterns

## Files Modified

When implementing:
1. `client/src/pages/Login.tsx` - Add Turnstile widget
2. `client/src/pages/Register.tsx` - Add Turnstile widget
3. `server/routes.ts` - Add token verification
4. `.env` - Add keys

## Resources

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [@marsidev/react-turnstile](https://github.com/marsidev/react-turnstile)
- [Turnstile Dashboard](https://dash.cloudflare.com/turnstile)

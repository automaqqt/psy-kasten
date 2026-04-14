# CSRF Protection Implementation Guide

## Overview

Cross-Site Request Forgery (CSRF) protection has been implemented using NextAuth's CSRF token mechanism. All state-changing API routes (POST, PUT, DELETE, PATCH) should include CSRF validation.

## Backend: Adding CSRF Protection to API Routes

### Method 1: Using the `checkCsrf` Function

```javascript
import { checkCsrf } from '../../../lib/csrf';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Validate CSRF token
    const csrfValid = await checkCsrf(req, res);
    if (!csrfValid) {
      return; // Response already sent by checkCsrf
    }

    // Your API logic here
    // ...
  }
}
```

### Method 2: Using the `withCsrfProtection` Wrapper

```javascript
import { withCsrfProtection } from '../../../lib/csrf';

async function handler(req, res) {
  // Your API logic here
  // CSRF is automatically validated for POST/PUT/DELETE/PATCH
}

export default withCsrfProtection(handler);
```

## Frontend: Including CSRF Tokens in Requests

### Getting the CSRF Token

```javascript
import { getCsrfToken } from 'next-auth/react';

// In a component or function
const csrfToken = await getCsrfToken();
```

### Including Token in Fetch Requests

#### As a Header (Recommended)

```javascript
const csrfToken = await getCsrfToken();

fetch('/api/some-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({ data: 'your data' }),
});
```

#### In Request Body

```javascript
const csrfToken = await getCsrfToken();

fetch('/api/some-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    csrfToken,
    data: 'your data',
  }),
});
```

### Example: Form Submission with CSRF

```javascript
import { getCsrfToken } from 'next-auth/react';
import { useState } from 'react';

function MyForm() {
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    const csrfToken = await getCsrfToken();

    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      // Handle success
    } else if (response.status === 403) {
      // CSRF validation failed - ask user to refresh
      alert('Security token expired. Please refresh the page.');
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

## Routes Currently Protected

- ✅ `/api/results` - Test result submissions
- ✅ `/api/auth/signup` - User registration
- ⚠️ **TODO**: The following routes still need CSRF protection:
  - `/api/studies/*` - Study management
  - `/api/participants/*` - Participant management
  - `/api/assignments/*` - Assignment management
  - `/api/proposals/*` - Proposal submissions
  - `/api/admin/*` - Admin operations

## Testing CSRF Protection

### Test 1: Request Without Token (Should Fail)

```bash
curl -X POST http://localhost:3000/api/results \
  -H "Content-Type: application/json" \
  -d '{"assignmentId": "test", "testData": {}}'

# Expected: 403 Forbidden
```

### Test 2: Request With Valid Token (Should Succeed)

```javascript
// Use browser console or test framework
const token = await getCsrfToken();
fetch('/api/results', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
  },
  body: JSON.stringify({ assignmentId: 'test', testData: {} }),
});

// Expected: Normal response (may be 400 for invalid data, but not 403)
```

## Security Notes

1. **CSRF tokens are tied to the user's session** - A new token is generated per session
2. **Tokens should never be stored in localStorage** - Use `getCsrfToken()` fresh for each request
3. **GET requests don't require CSRF tokens** - Only state-changing methods
4. **Failed CSRF checks return 403 Forbidden** - Frontend should handle by asking user to refresh

## Troubleshooting

### "CSRF cookie not found"

- Ensure NextAuth is properly configured
- Check that cookies are being set correctly
- Verify the user has an active session

### "CSRF token validation failed"

- Token may have expired - get a fresh token
- Check that token is being sent in correct format
- Verify cookie settings in `next-auth` configuration

## Additional Resources

- [NextAuth CSRF Protection](https://next-auth.js.org/configuration/options#csrf)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

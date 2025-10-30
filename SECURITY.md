# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Skill Vault, please report it by emailing [your-email@example.com] or opening a private security advisory on GitHub.

**Please do not report security vulnerabilities through public GitHub issues.**

## What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Time

We aim to respond to security reports within 48 hours and provide a fix within 7 days for critical vulnerabilities.

## Security Best Practices

### For Developers

1. **Never commit sensitive data**
   - API keys, passwords, tokens should be in `.env` only
   - Use `.env.example` for templates

2. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update packages with known vulnerabilities

3. **Validate all inputs**
   - Server-side validation is mandatory
   - Sanitize user inputs to prevent XSS

4. **Use parameterized queries**
   - Prevent SQL injection
   - Never concatenate user input into SQL

5. **Secure file uploads**
   - Validate file types and sizes
   - Store uploads outside web root when possible

### For Deployment

1. **Use HTTPS in production**
2. **Set secure environment variables**
3. **Enable CORS properly**
4. **Use strong passwords**
5. **Regular database backups**
6. **Monitor logs for suspicious activity**
7. **Keep Node.js and PostgreSQL updated**

## Known Security Features

- ✅ Password hashing with bcrypt
- ✅ Razorpay signature verification
- ✅ SQL injection protection (parameterized queries)
- ✅ Input validation on all endpoints
- ✅ File upload restrictions
- ✅ Transaction integrity with database transactions
- ✅ Environment variable protection

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

Thank you for helping keep Skill Vault secure!

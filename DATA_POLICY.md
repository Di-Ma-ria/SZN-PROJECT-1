# LODITOJO — Data Policy

**Version:** 1.1
**Effective Date:** July 2025
**Last Updated:** July 2026

---

## Table of Contents

1. Introduction
2. [Who We Are]
3. Information We Collect
4. How We Use Your Information
5. Legal Basis for Processing
6. How We Store Your Information
7. International Data Transfers
8. Who We Share Your Information With
9. Your Rights Under NDPR 2023
10. How to Make a Complaint
11. Cookies and Tokens
12. Children's Privacy
13. Security Incidents
14. Changes to This Policy
15. Seller Data Responsibilities
16. Payment Data
17. Applicable Law
18. Data Protection Officer
19. Contact Us
20. Glossary
21. Version History

---

## 1. Introduction

Welcome to LODITOJO. We are committed to protecting
your personal information and your right to privacy. This Data
Policy explains how we collect, use, store, protect and share
your information when you use our platform.

This policy applies to all users of LODITOJO including:

- Customers who browse and purchase products
- Sellers who list and sell products
- Administrators who manage the platform

**By creating an account or using our services you agree to
the terms of this Data Policy.** If you do not agree please
do not use our platform.

We review and update this policy regularly. The most recent
version is always available at:
https://loditojo-7t31.onrender.com/data-policy

---

## 2. Who We Are

LODITOJO is a Nigerian e-commerce platform that
connects buyers and sellers. Our platform allows:

- Customers to browse and purchase products safely
- Sellers to list and manage their products
- Administrators to manage the platform and ensure quality

**Business Information:**

- Business Name: LODITOJO Marketplace
- Platform Type: B2C and C2C E-Commerce
- Jurisdiction: Federal Republic of Nigeria
- Website: https://loditojo-7t31.onrender.com
- Email: loditamaria@gmail.com

As the operator of this platform LODITOJO acts as the
**Data Controller** — meaning we decide how and why your
personal data is processed.

---

## 3. Information We Collect

### 3.1 Information You Provide Directly

**Account Registration**

- Full name
- Email address
- Password (stored as encrypted hash — never in plain text)

**Profile Completion (after registration)**

- Phone number
- Delivery address (street, city, state, country)

**Seller Application**

- Store name and description
- Bank account details (for payment purposes)
- Business information

**Order Information**

- Products ordered
- Shipping address
- Special delivery instructions
- Payment reference numbers

**Communications**

- Support messages you send us
- Reviews and ratings you submit
- Wishlist items you save

### 3.2 Information Collected Automatically

When you use LODITOJO we automatically collect:

**Usage Data**

- Products and pages viewed
- Search queries entered
- Time spent on platform
- Actions taken (add to cart, place order, etc.)

**Technical Data**

- IP address
- Browser type and version
- Device type (mobile, desktop, tablet)
- Operating system
- Login timestamps and session duration

### 3.3 Information from Third Parties

**Paystack (Payment Processor)**

- Payment status (success or failure)
- Transaction reference numbers
- We never receive or store your card details

**Cloudinary (Image Storage)**

- Product image URLs
- Image metadata

---

## 4. How We Use Your Information

We use your personal information for the following purposes:

### 4.1 To Provide and Manage Our Services

- Create and manage your account
- Process and fulfil your orders
- Process payments securely through Paystack
- Deliver products to your address
- Manage your cart and wishlist
- Display your order history

### 4.2 To Communicate With You

- Send OTP codes for account verification
- Send order confirmation and status update emails
- Send account security alerts
- Respond to support requests
- Notify you of policy changes

### 4.3 To Protect Our Platform

- Verify your identity at login
- Detect and prevent fraudulent activity
- Protect against unauthorized account access
- Monitor for suspicious activity
- Lock accounts after repeated failed login attempts

### 4.4 To Improve Our Services

- Analyse how customers use our platform
- Fix technical bugs and improve performance
- Develop new features based on user behaviour
- Generate anonymous usage statistics

### 4.5 To Comply With Legal Obligations

- Maintain financial records as required by Nigerian law
- Respond to lawful requests from authorities
- Resolve disputes between buyers and sellers
- Enforce our Terms of Service

---

## 5. Legal Basis for Processing

Under the Nigeria Data Protection Act 2023 we process your
personal data on the following legal bases:

| Processing Activity    | Legal Basis                       |
| ---------------------- | --------------------------------- |
| Creating your account  | Contract performance              |
| Processing your orders | Contract performance              |
| Sending OTP codes      | Contract performance              |
| Sending order emails   | Contract performance              |
| Fraud prevention       | Legitimate interests              |
| Platform improvement   | Legitimate interests              |
| Legal compliance       | Legal obligation                  |
| Marketing emails       | Consent (you can opt out anytime) |

---

## 6. How We Store Your Information

### 6.1 Where We Store It

Your data is stored across the following secure systems:

- **MongoDB Atlas** — primary database for user and order data
- **Cloudinary** — product and profile images
- **Render** — application hosting and server logs

All providers use industry-standard encryption and security
measures including AES-256 encryption at rest and TLS
encryption in transit.

### 6.2 How Long We Keep It

We only keep your data for as long as necessary:

| Data Type                | Retention Period                     | Reason                       |
| ------------------------ | ------------------------------------ | ---------------------------- |
| Account information      | Until account is deleted             | Service provision            |
| Order history            | 7 years after order date             | Nigerian tax law requirement |
| Payment references       | 7 years after transaction            | Nigerian tax law requirement |
| OTP codes                | 10 minutes then auto-deleted         | Security                     |
| Login attempt logs       | 90 days                              | Security monitoring          |
| Deleted account data     | 30 days then permanently removed     | Dispute resolution           |
| Product images           | Until product is permanently deleted | Service provision            |
| Support messages         | 2 years from last contact            | Dispute resolution           |
| Session tokens (cookies) | 7 days                               | Authentication               |
| Access tokens (JWT)      | 10 minutes                           | Security                     |

### 6.3 How We Protect Your Data

We use multiple layers of security:

**Authentication Security**

- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire after 10 minutes
- Refresh tokens stored in HTTP-only cookies
- Accounts locked after 5 failed login attempts for 15 minutes

**Network Security**

- All data transmitted over HTTPS with TLS encryption
- Rate limiting — maximum 100 requests per 15 minutes per IP
- CORS policy restricts which domains can access our API
- HTTP security headers via Helmet middleware

**Access Control**

- Role-based access control (customer, seller, admin, superadmin)
- Sensitive routes require verified email
- Orders require completed profile
- Admin actions require admin role

---

## 7. International Data Transfers

Your data may be transferred to and processed in countries
outside Nigeria by our service providers:

| Provider      | Country        | Purpose             | Safeguard                    |
| ------------- | -------------- | ------------------- | ---------------------------- |
| MongoDB Atlas | United States  | Database storage    | Standard Contractual Clauses |
| Cloudinary    | United States  | Image storage       | Standard Contractual Clauses |
| Render        | United States  | Application hosting | Standard Contractual Clauses |
| Paystack      | Nigeria        | Payment processing  | Nigerian data protection law |
| Brevo         | European Union | Email delivery      | GDPR compliant               |

We ensure that all international data transfers are made
with appropriate safeguards in place as required by the
Nigeria Data Protection Act 2023.

---

## 8. Who We Share Your Information With

**We do not sell your personal information to anyone.**

We only share your data in these specific situations:

### 8.1 With Service Providers

We share data with trusted third parties who help us operate:

- **Paystack** — to process your payments securely
- **Cloudinary** — to store and serve product images
- **Brevo/Gmail** — to deliver transactional emails
- **MongoDB Atlas** — to store your data securely
- **Render** — to host our application

All service providers are bound by data processing agreements
and may only use your data to provide services to us.

### 8.2 With Sellers

When you place an order we share only what is necessary
for order fulfilment:

- Your name
- Your delivery address
- Your order details

We do not share your email, phone number, or payment
information with sellers.

### 8.3 With Legal Authorities

We may disclose your information when legally required by:

- Nigerian law enforcement agencies
- Court orders or legal proceedings
- Regulatory bodies such as NDPC or FIRS
- To protect the rights and safety of our users

We will notify you of such requests unless prohibited by law.

### 8.4 Business Transfers

In the event of a merger, acquisition, or sale of assets
your data may be transferred to the new owner. We will
notify you before this happens.

---

## 9. Your Rights Under NDPR 2023

As a Nigerian data subject you have the following rights:

### Right to Access

You can request a copy of all personal data we hold about
you. We will respond within 72 hours and provide your data
within 30 days.

**How to exercise:** Email loditamaria@gmail.com with
subject "Data Access Request"

### Right to Rectification

You can correct inaccurate personal information at any time
through your account profile page or by contacting us.

**How to exercise:** Update via PATCH /api/auth/update
or email loditamaria@gmail.com

### Right to Erasure (Right to be Forgotten)

You can request deletion of your account and personal data.
We will:

1. Soft delete your account immediately
2. Permanently remove your data within 30 days
3. Retain only what is required by Nigerian law (e.g. order
   records for 7 years for tax purposes)

**How to exercise:** Use DELETE /api/auth/delete-my-account
or email: loditamaria@gmail.com

### Right to Data Portability

You can request your personal data in a structured,
machine-readable format (JSON).

**How to exercise:** Email loditamaria@gmail.com with
subject "Data Portability Request"

### Right to Object

You can object to how we process your data, particularly
for marketing purposes. We will review and respond within
14 days.

**How to exercise:** Email loditamaria@gmail.com with
subject "Data Processing Objection"

### Right to Restrict Processing

You can ask us to pause processing of your data while a
complaint or investigation is ongoing.

**How to exercise:** Email loditamaria@gmail.com with
subject "Restrict Processing Request"

### Right to Withdraw Consent

Where processing is based on your consent you can withdraw
it at any time. Withdrawal does not affect the lawfulness
of processing before withdrawal.

---

## 10. How to Make a Complaint

We take data protection seriously. If you have a concern:

**Step 1 — Contact Us Directly**
Email: loditamaria@gmail.com
Subject: Data Protection Complaint
Response time: Within 72 hours on business days

**Step 2 — Escalate to Our DPO**
If unsatisfied with our response contact our Data
Protection Officer:
Email: loditamaria@gmail.com
Response time: Within 7 business days

**Step 3 — Report to the Regulator**
You have the right to lodge a complaint with:

Nigeria Data Protection Commission (NDPC)
Website: ndpc.gov.ng
Email: info@ndpc.gov.ng
Address: Plot 1574, Cadastral Zone B06, Mabushi,
Abuja, FCT, Nigeria

**Step 4 — Seek Legal Remedies**
You may also seek legal remedies through Nigerian courts
under the Nigeria Data Protection Act 2023.

---

## 11. Cookies and Tokens

### 11.1 What We Use

**HTTP-only Refresh Token Cookie**

- Purpose: Keeps you logged in securely
- Duration: 7 days
- Security: Cannot be accessed by JavaScript — prevents XSS
- Set automatically on login
- Cleared automatically on logout

**JWT Access Token**

- Purpose: Authenticates your API requests
- Duration: Expires after 10 minutes
- Storage: Stored in your application memory
- Refreshed automatically using the refresh token

### 11.2 We Do NOT Use

- Advertising or tracking cookies
- Third-party analytics cookies
- Cookies that track you across other websites
- Persistent marketing cookies

### 11.3 Cookie Consent

Our cookies are strictly necessary for the platform to
function. You cannot opt out of these without stopping
use of the platform. We do not use optional or
marketing cookies.

---

## 12. Children's Privacy

LODITOJO is intended for users aged 18 and above.
We do not knowingly collect personal information from
anyone under the age of 18.

If you are under 18 please do not create an account
or provide any personal information.

If we discover that a user is under 18 we will:

1. Immediately suspend the account
2. Delete all associated personal data
3. Notify the parent or guardian if possible

If you believe a child has created an account please
contact us immediately at loditamaria@gmail.com and
we will take action within 24 hours.

---

## 13. Security Incidents

We take data security seriously. In the event of a breach:

**Our Response Timeline:**

- 0-1 hours: Detect and contain the breach
- 1-24 hours: Investigate scope and impact
- 24-72 hours: Notify affected users by email
- 72 hours: Report to NDPC as required by law
- Ongoing: Monitor and prevent future incidents

**What We Will Tell You:**

- What data was affected
- What happened
- What we are doing about it
- What you should do to protect yourself

**What You Should Do If You Suspect a Breach:**

1. Change your password immediately
2. Enable two-factor authentication if available
3. Contact us at loditamaria@gmail.com
4. Monitor your financial accounts for unusual activity

---

## 14. Third Party Links

Our platform may contain links to third-party websites
including social media platforms, payment pages, and
partner sites.

**We are not responsible for:**

- The privacy practices of third-party websites
- The content or accuracy of third-party sites
- Any data collected by third parties

We encourage you to read the privacy policy of every
website you visit. Our policy applies only to data
collected on the LODITOJO platform.

---

## 15. Changes to This Policy

We may update this Data Policy from time to time to reflect:

- Changes in our services
- New legal requirements
- Feedback from users
- Technology changes

**How We Notify You of Changes:**

- **Minor changes:** Updated "Last Updated" date only
- **Significant changes:** Email notification sent to all users
  at least 14 days before changes take effect
- **Major changes:** Require your active consent before
  continued use of the platform

You can always find the current version of this policy at:
https://loditojo-7t31.onrender.com/data-policy

Continued use of our platform after changes take effect
means you accept the updated policy.

---

## 16. Seller Data Responsibilities

If you are a seller on LODITOJO you have additional
responsibilities regarding customer data:

### What You May Use Customer Data For

- Fulfilling orders placed through LODITOJO
- Communicating about specific orders
- Providing after-sales support for purchases

### What You Must NOT Do

- Share customer data with third parties
- Use customer data for your own marketing
- Contact customers about products not purchased from you
- Store customer data beyond order fulfilment
- Transfer customer data outside of LODITOJO systems

### Your Obligations

By becoming a seller on LODITOJO you agree to:

1. Process customer data only as instructed by LODITOJO
2. Implement appropriate security measures to protect data
3. Notify LODITOJO immediately of any data breaches
4. Delete customer data when no longer needed for
   order fulfilment
5. Comply with the Nigeria Data Protection Act 2023
6. Not engage in spam or unsolicited communications

**Violation of these obligations may result in:**

- Immediate suspension of your seller account
- Permanent ban from the platform
- Legal action under Nigerian data protection law
- Reporting to the Nigeria Data Protection Commission

---

## 17. Payment Data

We take payment security extremely seriously.

### What We Store

- Order total amount
- Payment status (paid, unpaid, refunded)
- Paystack transaction reference number
- Date and time of payment
- Payment method (Paystack or cash on delivery)

### What We Never Store

- Credit or debit card numbers
- Card CVV or security codes
- Card expiry dates
- Bank account passwords
- Any other sensitive financial credentials

### How Payments Are Secured

- All payments processed by **Paystack** — a PCI-DSS Level 1
  certified payment processor
- Paystack uses 256-bit SSL encryption for all transactions
- Card details are tokenized by Paystack and never reach
  our servers
- We use unique payment references per order to prevent
  duplicate charges

### Refund Policy

Refunds are processed back to your original payment method
through Paystack. Refund processing times:

- Paystack transactions: 3-5 business days
- We have no control over your bank's processing time

---

## 18. Applicable Law

This Data Policy is governed by the laws of the Federal
Republic of Nigeria including:

**Primary Legislation**

- Nigeria Data Protection Act 2023
- Nigeria Data Protection Regulation (NDPR) 2019

**Supporting Legislation**

- Consumer Protection Council Act Cap C25 LFN 2004
- Cybercrimes (Prohibition, Prevention, Etc) Act 2015
- Federal Competition and Consumer Protection Act 2018

**Regulatory Authority**
Nigeria Data Protection Commission (NDPC)
Website: ndpc.gov.ng

Any disputes relating to this policy shall be subject
to the exclusive jurisdiction of Nigerian courts.

---

## 19. Data Protection Officer

LODITOJO has designated a Data Protection Officer (DPO)
responsible for:

- Overseeing our data protection strategy
- Ensuring compliance with Nigerian data protection laws
- Acting as the point of contact for data subjects
- Advising on data protection impact assessments
- Liaising with the Nigeria Data Protection Commission

**Contact Our DPO:**
Email: dpo@loditojo.com
Response Time: Within 7 business days

All data protection queries, access requests, and
complaints should be directed to our DPO in the first
instance.

---

## 20. Contact Us

We are always happy to answer questions about your data
and this policy.

**General Enquiries:**
Email: loditamaria.com
Website: https://loditojo-7t31.onrender.com
Response Time: Within 72 hours on business days

**Data Protection Queries:**
Email: dpo@loditojo.com
Response Time: Within 7 business days

**Security Incidents and Breaches:**
Email: security@loditojo.com
Response Time: Within 24 hours

**Postal Address:**
LODITOJO
ABUJA, Nigeria

_Please include your full name and registered email address
in all correspondence so we can identify your account._

---

## 21. Glossary

| Term             | Definition                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Personal Data    | Any information that can identify you directly or indirectly                             |
| Processing       | Any operation performed on personal data including collection, storage, use, or deletion |
| Data Controller  | LODITOJO — the entity that determines how and why data is processed                      |
| Data Processor   | Third parties who process data on LODITOJO's behalf                                      |
| Data Subject     | You — the individual whose personal data is being processed                              |
| Encryption       | Converting data into a coded format that can only be read with a key                     |
| JWT              | JSON Web Token — a secure token used to authenticate API requests                        |
| OTP              | One Time Password — a 6-digit code sent to verify your identity                          |
| Bcrypt           | A password hashing algorithm used to store passwords securely                            |
| TLS              | Transport Layer Security — encrypts data sent over the internet                          |
| HTTPS            | Secure version of HTTP that uses TLS encryption                                          |
| HTTP-only Cookie | A browser cookie that cannot be accessed by JavaScript                                   |
| CORS             | Cross-Origin Resource Sharing — controls which websites can access our API               |
| Rate Limiting    | Restricting the number of requests from one source in a time period                      |
| Soft Delete      | Marking an account as deleted without permanently removing the data immediately          |
| PCI-DSS          | Payment Card Industry Data Security Standard                                             |
| NDPR             | Nigeria Data Protection Regulation 2019                                                  |
| NDPC             | Nigeria Data Protection Commission                                                       |
| DPO              | Data Protection Officer                                                                  |
| IP Address       | A unique address that identifies a device on the internet                                |

---

## 22. Version History

| Version | Date      | Summary of Changes                            |
| ------- | --------- | --------------------------------------------- |
| 1.0     | July 2025 | Initial data policy created                   |
| 1.1     | July 2026 | Added table of contents                       |
|         |           | Added legal basis for processing section      |
|         |           | Added international data transfers section    |
|         |           | Added formal complaint procedure              |
|         |           | Added data retention table with legal reasons |
|         |           | Expanded user rights section under NDPR 2023  |
|         |           | Added Data Protection Officer section         |
|         |           | Added version history                         |
|         |           | Updated contact information                   |
|         |           | Enhanced payment data section                 |
|         |           | Expanded seller responsibilities              |

---

_This Data Policy was last reviewed by the LODITOJO Data
Protection Officer in July 2026._

_LODITOJO — Building Trust Through Transparency_

_© 2026 LODITOJO. All rights reserved._

# API Documentation

## Base URL
```
http://localhost:9000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## User Routes

### Register User
Creates a new user account.

**Endpoint:** `POST /users`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "message": "Successful Register",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### Login
Authenticates a user and returns a JWT token.

**Endpoint:** `POST /login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Successful login",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### Update User
Updates user information (email and/or name).

**Endpoint:** `PUT /users/:user_id`

**Authentication:** Required

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "name": "Jane Doe"
}
```

**Response:** `200 OK`
```json
{
  "message": "Successfully updated user.",
  "updatedUser": {
    "id": "user_id",
    "email": "newemail@example.com",
    "name": "Jane Doe"
  }
}
```

---

### Delete User
Deletes the authenticated user's account.

**Endpoint:** `DELETE /users/:user_id`

**Authentication:** Required (must be the account owner)

**Response:** `200 OK`
```json
{
  "message": "User successfully deleted."
}
```

---

### Get User Transactions
Retrieves all transactions for a specific user.

**Endpoint:** `GET /users/:user_id/transactions`

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "transaction_id",
    "account_id": "account_id",
    "plaid_transaction_id": "plaid_txn_id",
    "amount": "25.50",
    "name": "Coffee Shop",
    "merchant_name": "Starbucks",
    "category": [],
    "date": "2024-12-01T00:00:00.000Z",
    "authorized_date": "2024-12-01T00:00:00.000Z",
    "pending": false,
    "iso_currency_code": "USD",
    "created_at": "2024-12-01T00:00:00.000Z",
    "account": {
      "name": "Checking Account",
    }
  }
]
```

---

### Get User Accounts
Retrieves all accounts for a specific user.

**Endpoint:** `GET /users/:user_id/accounts`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "accounts": [
    {
      "id": "account_id",
      "item_id": "item_id",
      "plaid_account_id": "plaid_account_id",
      "name": "Checking Account", 
      "item": {
        "institution_id": "institution_id", 
        "institution_name": "Bank Name"
      }
    }
  ]
}
```

---

## Plaid Routes

### Create Link Token
Generates a Plaid Link token for connecting financial institutions.

**Endpoint:** `POST /plaid/create_link_token`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "link_token": "link-sandbox-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "expiration": "2024-12-04T12:00:00Z",
  "request_id": "request_id_here"
}
```

---

### Exchange Public Token
Exchanges a Plaid public token for an access token and stores account/transaction data.

**Endpoint:** `POST /plaid/exchange_public_token`

**Authentication:** Required

**Request Body:**
```json
{
  "public_token": "public-sandbox-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "metadata": {
    "institution": {
      "name": "Chase",
      "institution_id": "ins_3"
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "access_token": "access-sandbox-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Note:** This endpoint automatically:
- Creates an item record
- Fetches and stores all associated accounts
- Retrieves the last 30 days of transactions

---

### Get Transactions by Item
Retrieves transactions for a specific Plaid item (last 30 days).

**Endpoint:** `GET /plaid/items/:item_id/transactions`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "accounts": [...],
  "transactions": [...],
  "item": {...},
  "total_transactions": 50,
  "request_id": "request_id_here"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

**Response:** `4xx` or `5xx`
```json
{
  "error": "Error message describing what went wrong"
}
```

Common error codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Environment Variables Required

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
PLAID_PRODUCTS=transactions
PLAID_COUNTRY_CODES=US
PORT=8000
```

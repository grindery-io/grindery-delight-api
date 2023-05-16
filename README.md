# Delight API

## Zapier Integration

The webhook routes are used by a Zapier integration to capture blockchain events and send them to the backend. The Zapier integration listens for events on the blockchain and captures the relevant data, then formats it into a JSON payload that conforms to the expected payload format for the webhook routes.

## WebSocket

The WebSocket is used to send notifications to clients. When an update is made to an offer, a notification is sent to all connected clients. The notification payload contains the updated offer ID, the user ID associated with the offer, and the type of update that was made. Clients can use this information to update their UI and reflect the changes made to the offer.

This project has a webhook where a Zapier integration listens for blockchain events and captures it. Then, the Zapier integration sends the captured events to the backend using the provided routes.

Additionally, a WebSocket is integrated to send notifications to clients.

## Authentication

### Webhook

When using Zapier to access an API that requires authentication, Zapier sends the API key in the headers of the HTTP request. The headers are essentially additional metadata that provides more information about the request being made.

To send the API key in the headers, Zapier typically uses the HTTP Authorization header. This header is used to send authentication credentials, such as an API key or access token, in an HTTP request.

Once the API receives the request with the API key in the headers, it can use that key to authenticate the request and grant access to the appropriate resources or actions.

### Websocket

#### Handshake Process

The handshake process is initiated when a client establishes a WebSocket connection with the server. Once the connection is established, the server sends a message indicating that the Mercari Web Socket Server is running. After receiving this message, the client sends a message with a request object that contains a method property set to authenticated to initiate the authentication process.

If the client sends a message with an invalid method property, the server closes the connection, logs an error message, and exits the function.

#### Authentication Process

Once the server receives a message with a valid method property, the server checks the provided `access_token` parameter. If the `access_token` is valid, the server decodes the JWT token and sets the userId property of the WebSocket connection to the sub claim of the JWT token. If the `access_token` is invalid, the server sends a message to the client indicating that the connection has been closed due to an invalid token, logs an error message, and exits the function.

If the authentication process is successful, the server sends a message to the client with a JSON object containing the result property set to `authenticated`. The `authTimeout` variable is cleared, and the server logs a message indicating that the client has been authenticated.

## Webhook Routes

### PUT `/offer/max-price`

This route updates the maximum price of an offer. It expects a JSON payload containing `_idOffer` and `_upperLimitFn` fields. `_idOffer` represents the offer ID, and `_upperLimitFn` represents the new maximum price.

Example JSON payload:

```
{
"_idOffer": "1234",
"_upperLimitFn": "1000"
}
```

### PUT `/offer/min-price`

This route updates the minimum price of an offer. It expects a JSON payload containing `_idOffer` and `_lowerLimitFn` fields. `_idOffer` represents the offer ID, and `_lowerLimitFn` represents the new minimum price.

Example JSON payload:

```
{
"_idOffer": "1234",
"_lowerLimitFn": "500"
}
```

### PUT `/offer/token`

This route updates the token of an offer. It expects a JSON payload containing `_idOffer` and `_token` fields. `_idOffer` represents the offer ID, and `_token` represents the new token.

Example JSON payload:

```
{
"_idOffer": "1234",
"_token": "0x123456789abcdef"
}
```

### PUT `/offer/chain`

This route updates the chain ID of an offer. It expects a JSON payload containing `_idOffer` and `_chainIn` fields. `_idOffer` represents the offer ID, and `_chainId` represents the new chain ID.

Example JSON payload:

```
{
"_idOffer": "1234",
"_chainId": "1"
}
```

### PUT `/offer/status`

This route updates the status of an offer. It expects a JSON payload containing `_idOffer` and `_status` fields. `_idOffer` represents the offer ID, and `_status` represents the new status.

Example JSON payload:

```
{
"_idOffer": "1234",
"_status": "completed"
}
```

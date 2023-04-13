import dotenv from 'dotenv';
import axios from 'axios';

async function refreshAccessToken() {
  try {
    const response = await getSession();
    const refreshToken = response.message.split(': ')[1];
    const url = 'https://orchestrator.grindery.org/oauth/token';
    const data = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const refreshedSession = await axios.post(url, data, config);
  } catch (error) {
    console.error(error);
  }
}

export const mockedToken =
  'eyJhbGciOiJFUzI1NiJ9.eyJhdWQiOiJ1cm46Z3JpbmRlcnk6YWNjZXNzLXRva2VuOnYxIiwic3ViIjoiZWlwMTU1OjE6MHgxMEEyQzMwNmNDYzg3OTM4QjFmZTNjNjNEQmIxNDU3QTljODEwZGY1IiwiaWF0IjoxNjgwODY5Nzg5LCJpc3MiOiJ1cm46Z3JpbmRlcnk6b3JjaGVzdHJhdG9yIiwiZXhwIjoxNjgwODczMzg5fQ.ChSkUEOeZnAk1C7oS45kxuR9JbmpqOZNa58ZYKcQ-KUgVSnuxoeekQDGXnUQAaQC1LDjPp3JbCWsSf9InE2gCg';

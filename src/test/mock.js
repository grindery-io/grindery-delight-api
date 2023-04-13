import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function getAccessToken() {
  try {
    const response = await axios.post(
      'https://orchestrator.grindery.org/oauth/token',
      {
        grant_type: 'refresh_token',
        refresh_token: process.env.GRINDERY_NEXUS_REFRESH_TOKEN,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const mockedToken = await getAccessToken();

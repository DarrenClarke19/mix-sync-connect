/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import axios from "axios";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

interface SpotifyTokenRequest {
  code: string;
  redirect_uri: string;
}

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Exchange Spotify authorization code for access token
 * This function handles the OAuth token exchange that can't be done client-side
 */
export const spotifyTokenExchange = onRequest(async (request, response) => {
  // Enable CORS for web requests
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const { code, redirect_uri }: SpotifyTokenRequest = request.body;

    if (!code || !redirect_uri) {
      response.status(400).json({ 
        error: 'Missing required parameters: code and redirect_uri' 
      });
      return;
    }

    logger.info('Spotify token exchange request', {
      code: code.substring(0, 10) + '...',
      redirect_uri
    });

    // Get Spotify credentials from environment variables (Firebase Functions v2)
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    // Debug logging to see what we're getting
    logger.info('Environment variables check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0,
      clientSecretLength: clientSecret?.length || 0
    });

    if (!clientId || !clientSecret) {
      logger.error('Missing Spotify credentials in environment variables');
      response.status(500).json({ 
        error: 'Server configuration error - missing Spotify credentials' 
      });
      return;
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id: clientId,
        client_secret: clientSecret,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const tokenData: SpotifyTokenResponse = tokenResponse.data;

    logger.info('Spotify token exchange successful', {
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    });

    // Return the tokens to the client
    response.status(200).json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    });

  } catch (error) {
    // Log the actual error details for debugging
    if (axios.isAxiosError(error)) {
      logger.error('Spotify API error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response) {
        response.status(error.response.status).json({
          error: 'Spotify API error',
          details: error.response.data
        });
      } else {
        response.status(500).json({
          error: 'Network error',
          message: error.message
        });
      }
    } else {
      logger.error('General error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      response.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Refresh Spotify access token using refresh token
 */
// Test function to debug configuration
export const testConfig = onRequest(async (request, response) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  try {
    logger.info('Environment variables check');
    
    response.status(200).json({
      message: 'Configuration test (Firebase Functions v2)',
      hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
      hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
      clientId: process.env.SPOTIFY_CLIENT_ID ? `${process.env.SPOTIFY_CLIENT_ID.substring(0, 10)}...` : 'NOT SET',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ? `${process.env.SPOTIFY_CLIENT_SECRET.substring(0, 10)}...` : 'NOT SET',
      allEnvVars: Object.keys(process.env).filter(key => key.includes('SPOTIFY'))
    });
  } catch (error) {
    logger.error('Test config error:', error);
    response.status(500).json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const spotifyRefreshToken = onRequest(async (request, response) => {
  // Enable CORS for web requests
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const { refresh_token } = request.body;

    if (!refresh_token) {
      response.status(400).json({ 
        error: 'Missing required parameter: refresh_token' 
      });
      return;
    }

    logger.info('Spotify refresh token request');

    // Get Spotify credentials from environment variables (Firebase Functions v2)
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      logger.error('Missing Spotify credentials in environment variables');
      response.status(500).json({ 
        error: 'Server configuration error' 
      });
      return;
    }

    // Refresh the access token
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const tokenData = tokenResponse.data;

    logger.info('Spotify token refresh successful', {
      expires_in: tokenData.expires_in
    });

    // Return the new access token
    response.status(200).json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    });

  } catch (error) {
    logger.error('Spotify token refresh failed', { error });

    if (axios.isAxiosError(error) && error.response) {
      // Spotify API error
      const spotifyError = error.response.data;
      response.status(error.response.status).json({
        error: 'Spotify API error',
        details: spotifyError
      });
    } else {
      // General error
      response.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});
